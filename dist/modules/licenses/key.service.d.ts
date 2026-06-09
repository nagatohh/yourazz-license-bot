export declare class KeyService {
    static generate(planName: string, count?: number): Promise<{
        status: import(".prisma/client").$Enums.KeyStatus;
        id: string;
        createdAt: Date;
        durationDays: number;
        expiresAt: Date | null;
        planId: string;
        key: string;
        redeemedById: string | null;
        redeemedAt: Date | null;
    }[]>;
    static redeem(key: string, userId: string, guildId: string): Promise<{
        license: {
            plan: {
                id: string;
                createdAt: Date;
                name: string;
                displayName: string;
                price: number;
                currency: string;
                durationDays: number;
                maxProducts: number;
                roleId: string;
                stripePriceId: string | null;
                features: string[];
                active: boolean;
                updatedAt: Date;
            };
        } & {
            status: import(".prisma/client").$Enums.LicenseStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            guildId: string;
            startedAt: Date;
            expiresAt: Date;
            renewedAt: Date | null;
            suspendedAt: Date | null;
            suspensionReason: string | null;
            stripeCustomerId: string | null;
            stripeSubscriptionId: string | null;
            userId: string;
            planId: string;
        };
        plan: {
            id: string;
            createdAt: Date;
            name: string;
            displayName: string;
            price: number;
            currency: string;
            durationDays: number;
            maxProducts: number;
            roleId: string;
            stripePriceId: string | null;
            features: string[];
            active: boolean;
            updatedAt: Date;
        };
    }>;
    static getStatus(key: string): Promise<({
        plan: {
            id: string;
            createdAt: Date;
            name: string;
            displayName: string;
            price: number;
            currency: string;
            durationDays: number;
            maxProducts: number;
            roleId: string;
            stripePriceId: string | null;
            features: string[];
            active: boolean;
            updatedAt: Date;
        };
        redeemedBy: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            discordId: string;
            username: string;
            globalName: string | null;
            avatarUrl: string | null;
            language: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.KeyStatus;
        id: string;
        createdAt: Date;
        durationDays: number;
        expiresAt: Date | null;
        planId: string;
        key: string;
        redeemedById: string | null;
        redeemedAt: Date | null;
    }) | null>;
    static blacklist(key: string): Promise<{
        status: import(".prisma/client").$Enums.KeyStatus;
        id: string;
        createdAt: Date;
        durationDays: number;
        expiresAt: Date | null;
        planId: string;
        key: string;
        redeemedById: string | null;
        redeemedAt: Date | null;
    }>;
}
//# sourceMappingURL=key.service.d.ts.map