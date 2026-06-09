import { Client } from "discord.js";
export declare class NotificationService {
    static sendDM(client: Client, discordUserId: string, payload: Record<string, any>): Promise<void>;
    static sendLicenseActivated(client: Client, discordUserId: string, license: any): Promise<void>;
    static sendExpirationReminder(client: Client, discordUserId: string, license: any, daysLeft: number): Promise<void>;
    static sendLicenseExpired(client: Client, discordUserId: string, planName: string): Promise<void>;
    static sendPaymentFailed(client: Client, discordUserId: string): Promise<void>;
    static logNewLicense(client: Client, discordUserId: string, planName: string, amount: number, currency: string): Promise<void>;
    static logLicenseExpired(client: Client, discordUserId: string, planName: string): Promise<void>;
    static logPaymentFailed(client: Client, discordUserId: string, sessionId: string): Promise<void>;
}
//# sourceMappingURL=notification.service.d.ts.map