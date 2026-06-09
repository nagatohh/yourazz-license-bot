import { Client } from "discord.js";
export declare class PaymentService {
    static handleCheckoutCompleted(client: Client, sessionId: string, paymentIntentId: string, metadata: {
        discordUserId: string;
        guildId: string;
        licensePlan: string;
        durationDays: string;
    }, amount: number, currency: string): Promise<void>;
    static handlePaymentFailed(client: Client, sessionId: string, metadata: {
        discordUserId: string;
    }): Promise<void>;
    static handleRefund(client: Client, paymentIntentId: string): Promise<void>;
}
//# sourceMappingURL=payment.service.d.ts.map