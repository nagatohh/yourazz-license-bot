/**
 * Stats par vendeur (SellerProfile, clé = Discord user id).
 * Les incréments ne sont appelés QUE lors de la première ingestion d'un event
 * (le Core ne les rappelle pas sur un reprocess) → pas de double comptage.
 */
export declare class SellerStatsService {
    /** Garantit l'existence d'un profil vendeur. */
    static ensure(discordUserId: string, username?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        username: string;
        discordUserId: string;
        ownerId: string | null;
        rank: string | null;
        totalVouches: number;
        weeklyVouches: number;
        monthlyVouches: number;
        totalRatings: number;
        ratingSum: number;
        averageRating: number;
        ticketsHandled: number;
        lastActivityAt: Date | null;
    }>;
    /** +1 vouch (total/semaine/mois) + activité. */
    static addVouch(discordUserId: string, username?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        username: string;
        discordUserId: string;
        ownerId: string | null;
        rank: string | null;
        totalVouches: number;
        weeklyVouches: number;
        monthlyVouches: number;
        totalRatings: number;
        ratingSum: number;
        averageRating: number;
        ticketsHandled: number;
        lastActivityAt: Date | null;
    }>;
    /**
     * Enregistre une note client et recalcule la moyenne via ratingSum/totalRatings
     * (recalcul exact, robuste aux arrondis).
     */
    static addRating(discordUserId: string, rating: number, username?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        username: string;
        discordUserId: string;
        ownerId: string | null;
        rank: string | null;
        totalVouches: number;
        weeklyVouches: number;
        monthlyVouches: number;
        totalRatings: number;
        ratingSum: number;
        averageRating: number;
        ticketsHandled: number;
        lastActivityAt: Date | null;
    }>;
    /** +1 ticket traité. */
    static addTicket(discordUserId: string, username?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        username: string;
        discordUserId: string;
        ownerId: string | null;
        rank: string | null;
        totalVouches: number;
        weeklyVouches: number;
        monthlyVouches: number;
        totalRatings: number;
        ratingSum: number;
        averageRating: number;
        ticketsHandled: number;
        lastActivityAt: Date | null;
    }>;
    static getByDiscordId(discordUserId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        username: string;
        discordUserId: string;
        ownerId: string | null;
        rank: string | null;
        totalVouches: number;
        weeklyVouches: number;
        monthlyVouches: number;
        totalRatings: number;
        ratingSum: number;
        averageRating: number;
        ticketsHandled: number;
        lastActivityAt: Date | null;
    } | null>;
}
//# sourceMappingURL=seller-stats.service.d.ts.map