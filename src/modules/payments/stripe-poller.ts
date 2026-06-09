import { CronJob } from "cron";
import { Client } from "discord.js";
import { stripe } from "../../config/stripe";
import { StripeService } from "./stripe.service";
import { PaymentService } from "./payment.service";
import { prisma } from "../../services/database";
import { logger } from "../../utils/logger";

export function startStripePoller(client: Client) {
  if (!StripeService.isConfigured()) {
    logger.warn("StripePoller", "Stripe non configuré — polling désactivé");
    return;
  }

  const job = new CronJob("*/15 * * * * *", async () => {
    try {
      const sessions = await stripe.checkout.sessions.list({
        limit: 10,
        status: "complete",
      });

      for (const session of sessions.data) {
        if (session.payment_status !== "paid") continue;
        if (!session.metadata?.discordUserId) continue;

        const existing = await prisma.stripeWebhookEvent.findUnique({
          where: { stripeEventId: session.id },
        });
        if (existing?.processed) continue;

        await prisma.stripeWebhookEvent.upsert({
          where: { stripeEventId: session.id },
          update: {},
          create: {
            stripeEventId: session.id,
            type: "checkout.session.completed",
          },
        });

        await PaymentService.handleCheckoutCompleted(
          client,
          session.id,
          session.payment_intent as string,
          session.metadata as any,
          session.amount_total!,
          session.currency?.toUpperCase() ?? "EUR",
        );

        await prisma.stripeWebhookEvent.update({
          where: { stripeEventId: session.id },
          data: { processed: true },
        });

        logger.info("StripePoller", `Paiement détecté et traité: ${session.id}`);
      }
    } catch (err: any) {
      logger.error("StripePoller", `Erreur polling: ${err.message}`);
    }
  });

  job.start();
  logger.info("StripePoller", "Polling Stripe démarré (toutes les 15 secondes)");
}
