"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startStripePoller = startStripePoller;
const cron_1 = require("cron");
const stripe_1 = require("../../config/stripe");
const stripe_service_1 = require("./stripe.service");
const payment_service_1 = require("./payment.service");
const database_1 = require("../../services/database");
const logger_1 = require("../../utils/logger");
function startStripePoller(client) {
    if (!stripe_service_1.StripeService.isConfigured()) {
        logger_1.logger.warn("StripePoller", "Stripe non configuré — polling désactivé");
        return;
    }
    const job = new cron_1.CronJob("*/15 * * * * *", async () => {
        try {
            const sessions = await stripe_1.stripe.checkout.sessions.list({
                limit: 10,
                status: "complete",
            });
            for (const session of sessions.data) {
                if (session.payment_status !== "paid")
                    continue;
                if (!session.metadata?.discordUserId)
                    continue;
                const existing = await database_1.prisma.stripeWebhookEvent.findUnique({
                    where: { stripeEventId: session.id },
                });
                if (existing?.processed)
                    continue;
                await database_1.prisma.stripeWebhookEvent.upsert({
                    where: { stripeEventId: session.id },
                    update: {},
                    create: {
                        stripeEventId: session.id,
                        type: "checkout.session.completed",
                    },
                });
                await payment_service_1.PaymentService.handleCheckoutCompleted(client, session.id, session.payment_intent, session.metadata, session.amount_total, session.currency?.toUpperCase() ?? "EUR");
                await database_1.prisma.stripeWebhookEvent.update({
                    where: { stripeEventId: session.id },
                    data: { processed: true },
                });
                logger_1.logger.info("StripePoller", `Paiement détecté et traité: ${session.id}`);
            }
        }
        catch (err) {
            logger_1.logger.error("StripePoller", `Erreur polling: ${err.message}`);
        }
    });
    job.start();
    logger_1.logger.info("StripePoller", "Polling Stripe démarré (toutes les 15 secondes)");
}
//# sourceMappingURL=stripe-poller.js.map