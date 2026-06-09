import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "../config/bot";
import { StripeService } from "../modules/payments/stripe.service";
import { PaymentService } from "../modules/payments/payment.service";
import { logger } from "../utils/logger";
import { prisma } from "../services/database";
import { Client } from "discord.js";

let discordClient: Client;

export function setClient(client: Client) {
  discordClient = client;
}

export function startWebhookServer() {
  if (!StripeService.isConfigured()) {
    logger.warn("Webhook", "Stripe non configuré — webhook désactivé");
    return;
  }

  const app = express();

  // Sécurité HTTP headers
  app.use(helmet());

  // Rate limiting — max 30 requêtes/minute par IP
  app.use(rateLimit({
    windowMs: 60_000,
    max: 30,
    message: "Too many requests",
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // Masquer la technologie utilisée
  app.disable("x-powered-by");

  app.post(
    "/webhook/stripe",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const signature = req.headers["stripe-signature"] as string;
      if (!signature) {
        return res.status(400).send("Missing signature");
      }

      try {
        const event = await StripeService.verifyWebhookSignature(req.body, signature);

        const existing = await prisma.stripeWebhookEvent.findUnique({
          where: { stripeEventId: event.id },
        });
        if (existing?.processed) {
          logger.info("Webhook", `Event déjà traité: ${event.id}`);
          return res.json({ received: true });
        }

        await prisma.stripeWebhookEvent.upsert({
          where: { stripeEventId: event.id },
          update: {},
          create: { stripeEventId: event.id, type: event.type, payload: event.data as any },
        });

        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as any;
            if (session.payment_status !== "paid") break;

            const metadata = session.metadata;
            if (!metadata?.discordUserId) break;

            await PaymentService.handleCheckoutCompleted(
              discordClient,
              session.id,
              session.payment_intent,
              metadata,
              session.amount_total,
              session.currency?.toUpperCase() ?? "EUR",
            );
            break;
          }

          case "checkout.session.expired": {
            logger.info("Webhook", `Session expirée: ${(event.data.object as any).id}`);
            break;
          }

          case "payment_intent.payment_failed": {
            const intent = event.data.object as any;
            const metadata = intent.metadata;
            if (metadata?.discordUserId) {
              await PaymentService.handlePaymentFailed(discordClient, intent.id, metadata);
            }
            break;
          }

          case "charge.refunded": {
            const charge = event.data.object as any;
            if (charge.payment_intent) {
              await PaymentService.handleRefund(discordClient, charge.payment_intent);
            }
            break;
          }
        }

        await prisma.stripeWebhookEvent.update({
          where: { stripeEventId: event.id },
          data: { processed: true },
        });

        res.json({ received: true });
      } catch (err: any) {
        logger.error("Webhook", `Erreur: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
      }
    },
  );

  app.get("/payment/success", (_, res) => {
    res.send(`
      <html>
        <body style="background:#111;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            <h1>✅ Paiement réussi !</h1>
            <p>Votre licence a été activée. Retournez sur Discord.</p>
          </div>
        </body>
      </html>
    `);
  });

  app.get("/payment/cancel", (_, res) => {
    res.send(`
      <html>
        <body style="background:#111;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            <h1>❌ Paiement annulé</h1>
            <p>Vous pouvez réessayer depuis Discord.</p>
          </div>
        </body>
      </html>
    `);
  });

  app.get("/health", (_, res) => res.json({ status: "ok" }));

  const port = parseInt(env.PORT);
  app.listen(port, () => {
    logger.info("Webhook", `Serveur webhook démarré sur le port ${port}`);
  }).on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      logger.warn("Webhook", `Port ${port} occupé — webhook désactivé (le bot fonctionne sans)`);
    } else {
      logger.error("Webhook", `Erreur serveur: ${err.message}`);
    }
  });
}
