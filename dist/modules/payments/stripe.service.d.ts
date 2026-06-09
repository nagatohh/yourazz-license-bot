export declare class StripeService {
    static isConfigured(): boolean;
    static createCheckoutSession(params: {
        discordUserId: string;
        guildId: string;
        planName: string;
        userEmail?: string;
    }): Promise<import("stripe").Stripe.Response<import("stripe").Stripe.Checkout.Session>>;
    static verifyWebhookSignature(payload: string | Buffer, signature: string): Promise<import("stripe").Stripe.Event>;
}
//# sourceMappingURL=stripe.service.d.ts.map