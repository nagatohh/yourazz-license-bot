export declare class LicenseService {
    static create(userId: string, guildId: string, planName: string, durationDays?: number): Promise<{
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
    }>;
    static renew(licenseId: string, durationDays?: number): Promise<{
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
    }>;
    static suspend(licenseId: string, reason: string): Promise<{
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
    }>;
    static reactivate(licenseId: string): Promise<{
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
    }>;
    static expire(licenseId: string): Promise<{
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
    }>;
    static extend(licenseId: string, days: number): Promise<{
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
    }>;
    static getActive(userId: string, guildId: string): Promise<({
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
    }) | null>;
    static getByUser(userId: string): Promise<({
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
    })[]>;
    static getExpiringIn(days: number): Promise<({
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            discordId: string;
            username: string;
            globalName: string | null;
            avatarUrl: string | null;
            language: string;
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
    })[]>;
    static getExpired(): Promise<({
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            discordId: string;
            username: string;
            globalName: string | null;
            avatarUrl: string | null;
            language: string;
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
    })[]>;
    static getAllByGuild(guildId: string, status?: string): Promise<({
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            discordId: string;
            username: string;
            globalName: string | null;
            avatarUrl: string | null;
            language: string;
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
    })[]>;
    static getStats(guildId: string): Promise<{
        active: number;
        expired: number;
        suspended: number;
        totalRevenue: number;
        monthRevenue: number;
    }>;
    private static getOrCreatePlan;
}
//# sourceMappingURL=license.service.d.ts.map