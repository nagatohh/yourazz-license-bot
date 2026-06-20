import { OwnerTier, ScoreEventType } from "@prisma/client";
export declare class OwnerService {
    static create(discordId: string, username: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        discordId: string;
        username: string;
        teamName: string | null;
        tier: import(".prisma/client").$Enums.OwnerTier;
        totalScore: number;
        isActive: boolean;
    }>;
    static remove(discordId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        discordId: string;
        username: string;
        teamName: string | null;
        tier: import(".prisma/client").$Enums.OwnerTier;
        totalScore: number;
        isActive: boolean;
    }>;
    static getByDiscordId(discordId: string): Promise<({
        team: {
            status: import(".prisma/client").$Enums.TeamMemberStatus;
            id: string;
            discordId: string;
            username: string;
            ownerId: string;
            note: string | null;
            addedById: string | null;
            joinedAt: Date;
            leftAt: Date | null;
            lastActive: Date | null;
            totalSales: number;
            sanctions: number;
        }[];
        goals: {
            id: string;
            createdAt: Date;
            description: string;
            ownerId: string;
            target: number;
            completed: boolean;
            endsAt: Date;
            period: import(".prisma/client").$Enums.GoalPeriod;
            metric: string | null;
            current: number;
            startsAt: Date;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        discordId: string;
        username: string;
        teamName: string | null;
        tier: import(".prisma/client").$Enums.OwnerTier;
        totalScore: number;
        isActive: boolean;
    }) | null>;
    /** Version légère (sans includes) — pour les actions où seuls id/tier comptent. */
    static getLite(discordId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        discordId: string;
        username: string;
        teamName: string | null;
        tier: import(".prisma/client").$Enums.OwnerTier;
        totalScore: number;
        isActive: boolean;
    } | null>;
    static getAll(): Promise<({
        team: {
            status: import(".prisma/client").$Enums.TeamMemberStatus;
            id: string;
            discordId: string;
            username: string;
            ownerId: string;
            note: string | null;
            addedById: string | null;
            joinedAt: Date;
            leftAt: Date | null;
            lastActive: Date | null;
            totalSales: number;
            sanctions: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        discordId: string;
        username: string;
        teamName: string | null;
        tier: import(".prisma/client").$Enums.OwnerTier;
        totalScore: number;
        isActive: boolean;
    })[]>;
    static addRecruit(ownerId: string, discordId: string, username: string): Promise<{
        status: import(".prisma/client").$Enums.TeamMemberStatus;
        id: string;
        discordId: string;
        username: string;
        ownerId: string;
        note: string | null;
        addedById: string | null;
        joinedAt: Date;
        leftAt: Date | null;
        lastActive: Date | null;
        totalSales: number;
        sanctions: number;
    }>;
    static removeRecruit(ownerId: string, discordId: string): Promise<void>;
    static transferRecruit(fromOwnerId: string, toOwnerId: string, memberDiscordId: string): Promise<void>;
    static getTeam(ownerId: string): Promise<{
        status: import(".prisma/client").$Enums.TeamMemberStatus;
        id: string;
        discordId: string;
        username: string;
        ownerId: string;
        note: string | null;
        addedById: string | null;
        joinedAt: Date;
        leftAt: Date | null;
        lastActive: Date | null;
        totalSales: number;
        sanctions: number;
    }[]>;
    static getTeamStats(ownerId: string): Promise<{
        active: number;
        inactive: number;
        sanctioned: number;
        total: number;
    }>;
    static addScore(ownerId: string, type: ScoreEventType, points: number, memberId?: string, reason?: string): Promise<void>;
    static manualScore(ownerId: string, points: number, reason: string): Promise<void>;
    static getLeaderboard(limit?: number): Promise<({
        team: {
            status: import(".prisma/client").$Enums.TeamMemberStatus;
            id: string;
            discordId: string;
            username: string;
            ownerId: string;
            note: string | null;
            addedById: string | null;
            joinedAt: Date;
            leftAt: Date | null;
            lastActive: Date | null;
            totalSales: number;
            sanctions: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        discordId: string;
        username: string;
        teamName: string | null;
        tier: import(".prisma/client").$Enums.OwnerTier;
        totalScore: number;
        isActive: boolean;
    })[]>;
    static checkTierUpgrade(ownerId: string): Promise<import(".prisma/client").$Enums.OwnerTier | undefined>;
    static markMemberActive(discordId: string): Promise<void>;
    static recordMemberSale(discordId: string): Promise<void>;
    static sanctionMember(discordId: string): Promise<void>;
    static getTierInfo(tier: OwnerTier): {
        readonly tier: "BRONZE";
        readonly label: "Bronze";
        readonly emoji: "🥉";
        readonly minRecruits: 5;
    } | {
        readonly tier: "SILVER";
        readonly label: "Silver";
        readonly emoji: "🥈";
        readonly minRecruits: 15;
    } | {
        readonly tier: "GOLD";
        readonly label: "Gold";
        readonly emoji: "🥇";
        readonly minRecruits: 30;
    } | {
        readonly tier: "DIAMOND";
        readonly label: "Diamond";
        readonly emoji: "💎";
        readonly minRecruits: 50;
    } | {
        readonly tier: "LEGEND";
        readonly label: "Legend";
        readonly emoji: "🏆";
        readonly minRecruits: 100;
    };
    static getNextTier(tier: OwnerTier): {
        readonly tier: "BRONZE";
        readonly label: "Bronze";
        readonly emoji: "🥉";
        readonly minRecruits: 5;
    } | {
        readonly tier: "SILVER";
        readonly label: "Silver";
        readonly emoji: "🥈";
        readonly minRecruits: 15;
    } | {
        readonly tier: "GOLD";
        readonly label: "Gold";
        readonly emoji: "🥇";
        readonly minRecruits: 30;
    } | {
        readonly tier: "DIAMOND";
        readonly label: "Diamond";
        readonly emoji: "💎";
        readonly minRecruits: 50;
    } | {
        readonly tier: "LEGEND";
        readonly label: "Legend";
        readonly emoji: "🏆";
        readonly minRecruits: 100;
    } | null;
}
//# sourceMappingURL=owner.service.d.ts.map