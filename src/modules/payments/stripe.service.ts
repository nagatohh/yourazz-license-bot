import { stripe } from "../../config/stripe";
import { env } from "../../config/bot";
import { PLANS } from "../../config/licenses";
import { logger } from "../../utils/logger";

export class StripeService {
  static isConfigured(): boolean {
    return !!env.STRIPE_SECRET_KEY;
  }

  static async createCheckoutSession(params: {
    discordUserId: string;
    guildId: string;
    planName: string;
    userEmail?: string;
  }) {
    const plan = PLANS[params.planName];
    if (!plan) throw new Error(`Plan inconnu: ${params.planName}`);

    const session = await stripe.checkout.sessions.create({
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
      success_url: `${env.APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.APP_URL}/payment/cancel`,
    });

    logger.info("StripeService", `Session Checkout créée pour ${params.discordUserId} — plan ${params.planName}`);
    return session;
  }

  static async verifyWebhookSignature(payload: string | Buffer, signature: string) {
    return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  }
}
