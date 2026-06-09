"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const stripe_1 = require("../../config/stripe");
const bot_1 = require("../../config/bot");
const licenses_1 = require("../../config/licenses");
const logger_1 = require("../../utils/logger");
class StripeService {
    static isConfigured() {
        return !!bot_1.env.STRIPE_SECRET_KEY;
    }
    static async createCheckoutSession(params) {
        const plan = licenses_1.PLANS[params.planName];
        if (!plan)
            throw new Error(`Plan inconnu: ${params.planName}`);
        const session = await stripe_1.stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: plan.currency.toLowerCase(),
                        product_data: {
                            name: `Licence Vendeur ${plan.displayName}`,
                            description: plan.features.join(" • "),
                        },
                        unit_amount: plan.price,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                discordUserId: params.discordUserId,
                guildId: params.guildId,
                licensePlan: params.planName,
                durationDays: String(plan.durationDays),
            },
            customer_email: params.userEmail,
            success_url: `${bot_1.env.APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${bot_1.env.APP_URL}/payment/cancel`,
        });
        logger_1.logger.info("StripeService", `Session Checkout créée pour ${params.discordUserId} — plan ${params.planName}`);
        return session;
    }
    static async verifyWebhookSignature(payload, signature) {
        return stripe_1.stripe.webhooks.constructEvent(payload, signature, bot_1.env.STRIPE_WEBHOOK_SECRET);
    }
}
exports.StripeService = StripeService;
//# sourceMappingURL=stripe.service.js.map