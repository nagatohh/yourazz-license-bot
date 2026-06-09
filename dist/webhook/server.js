"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setClient = setClient;
exports.startWebhookServer = startWebhookServer;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const bot_1 = require("../config/bot");
const stripe_service_1 = require("../modules/payments/stripe.service");
const payment_service_1 = require("../modules/payments/payment.service");
const logger_1 = require("../utils/logger");
const database_1 = require("../services/database");
let discordClient;
function setClient(client) {
    discordClient = client;
}
function startWebhookServer() {
    if (!stripe_service_1.StripeService.isConfigured()) {
        logger_1.logger.warn("Webhook", "Stripe non configuré — webhook désactivé");
        return;
    }
    const app = (0, express_1.default)();
    // Sécurité HTTP headers
    app.use((0, helmet_1.default)());
    // Rate limiting — max 30 requêtes/minute par IP
    app.use((0, express_rate_limit_1.default)({
        windowMs: 60_000,
        max: 30,
        message: "Too many requests",
        standardHeaders: true,
        legacyHeaders: false,
    }));
    // Masquer la technologie utilisée
    app.disable("x-powered-by");
    app.post("/webhook/stripe", express_1.default.raw({ type: "application/json" }), async (req, res) => {
        const signature = req.headers["stripe-signature"];
        if (!signature) {
            return res.status(400).send("Missing signature");
        }
        try {
            const event = await stripe_service_1.StripeService.verifyWebhookSignature(req.body, signature);
            const existing = await database_1.prisma.stripeWebhookEvent.findUnique({
                where: { stripeEventId: event.id },
            });
            if (existing?.processed) {
                logger_1.logger.info("Webhook", `Event déjà traité: ${event.id}`);
                return res.json({ received: true });
            }
            await database_1.prisma.stripeWebhookEvent.upsert({
                where: { stripeEventId: event.id },
                update: {},
                create: { stripeEventId: event.id, type: event.type, payload: event.data },
            });
            switch (event.type) {
                case "checkout.session.completed": {
                    const session = event.data.object;
                    if (session.payment_status !== "paid")
                        break;
                    const metadata = session.metadata;
                    if (!metadata?.discordUserId)
                        break;
                    await payment_service_1.PaymentService.handleCheckoutCompleted(discordClient, session.id, session.payment_intent, metadata, session.amount_total, session.currency?.toUpperCase() ?? "EUR");
                    break;
                }
                case "checkout.session.expired": {
                    logger_1.logger.info("Webhook", `Session expirée: ${event.data.object.id}`);
                    break;
                }
                case "payment_intent.payment_failed": {
                    const intent = event.data.object;
                    const metadata = intent.metadata;
                    if (metadata?.discordUserId) {
                        await payment_service_1.PaymentService.handlePaymentFailed(discordClient, intent.id, metadata);
                    }
                    break;
                }
                case "charge.refunded": {
                    const charge = event.data.object;
                    if (charge.payment_intent) {
                        await payment_service_1.PaymentService.handleRefund(discordClient, charge.payment_intent);
                    }
                    break;
                }
            }
            await database_1.prisma.stripeWebhookEvent.update({
                where: { stripeEventId: event.id },
                data: { processed: true },
            });
            res.json({ received: true });
        }
        catch (err) {
            logger_1.logger.error("Webhook", `Erreur: ${err.message}`);
            res.status(400).send(`Webhook Error: ${err.message}`);
        }
    });
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
    const port = parseInt(bot_1.env.PORT);
    app.listen(port, () => {
        logger_1.logger.info("Webhook", `Serveur webhook démarré sur le port ${port}`);
    }).on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            logger_1.logger.warn("Webhook", `Port ${port} occupé — webhook désactivé (le bot fonctionne sans)`);
        }
        else {
            logger_1.logger.error("Webhook", `Erreur serveur: ${err.message}`);
        }
    });
}
//# sourceMappingURL=server.js.map