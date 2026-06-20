"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerStatsService = void 0;
const database_1 = require("../../services/database");
/**
 * Stats par vendeur (SellerProfile, clé = Discord user id).
 * Les incréments ne sont appelés QUE lors de la première ingestion d'un event
 * (le Core ne les rappelle pas sur un reprocess) → pas de double comptage.
 */
class SellerStatsService {
    /** Garantit l'existence d'un profil vendeur. */
    static async ensure(discordUserId, username) {
        return database_1.prisma.sellerProfile.upsert({
            where: { discordUserId },
            create: { discordUserId, username: username ?? discordUserId },
            update: username ? { username } : {},
        });
    }
    /** +1 vouch (total/semaine/mois) + activité. */
    static async addVouch(discordUserId, username) {
        await this.ensure(discordUserId, username);
        return database_1.prisma.sellerProfile.update({
            where: { discordUserId },
            data: {
                totalVouches: { increment: 1 },
                weeklyVouches: { increment: 1 },
                monthlyVouches: { increment: 1 },
                lastActivityAt: new Date(),
            },
        });
    }
    /**
     * Enregistre une note client et recalcule la moyenne via ratingSum/totalRatings
     * (recalcul exact, robuste aux arrondis).
     */
    static async addRating(discordUserId, rating, username) {
        const profile = await this.ensure(discordUserId, username);
        const totalRatings = profile.totalRatings + 1;
        const ratingSum = profile.ratingSum + rating;
        const averageRating = Number((ratingSum / totalRatings).toFixed(2));
        return database_1.prisma.sellerProfile.update({
            where: { discordUserId },
            data: {
                totalRatings,
                ratingSum,
                averageRating,
                lastActivityAt: new Date(),
            },
        });
    }
    /** +1 ticket traité. */
    static async addTicket(discordUserId, username) {
        await this.ensure(discordUserId, username);
        return database_1.prisma.sellerProfile.update({
            where: { discordUserId },
            data: {
                ticketsHandled: { increment: 1 },
                lastActivityAt: new Date(),
            },
        });
    }
    static async getByDiscordId(discordUserId) {
        return database_1.prisma.sellerProfile.findUnique({ where: { discordUserId } });
    }
}
exports.SellerStatsService = SellerStatsService;
//# sourceMappingURL=seller-stats.service.js.map