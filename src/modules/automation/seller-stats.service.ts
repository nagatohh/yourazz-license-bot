import { prisma } from "../../services/database";

/**
 * Stats par vendeur (SellerProfile, clé = Discord user id).
 * Les incréments ne sont appelés QUE lors de la première ingestion d'un event
 * (le Core ne les rappelle pas sur un reprocess) → pas de double comptage.
 */
export class SellerStatsService {
  /** Garantit l'existence d'un profil vendeur. */
  static async ensure(discordUserId: string, username?: string) {
    return prisma.sellerProfile.upsert({
      where: { discordUserId },
      create: { discordUserId, username: username ?? discordUserId },
      update: username ? { username } : {},
    });
  }

  /** +1 vouch (total/semaine/mois) + activité. */
  static async addVouch(discordUserId: string, username?: string) {
    await this.ensure(discordUserId, username);
    return prisma.sellerProfile.update({
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
  static async addRating(discordUserId: string, rating: number, username?: string) {
    const profile = await this.ensure(discordUserId, username);
    const totalRatings = profile.totalRatings + 1;
    const ratingSum = profile.ratingSum + rating;
    const averageRating = Number((ratingSum / totalRatings).toFixed(2));

    return prisma.sellerProfile.update({
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
  static async addTicket(discordUserId: string, username?: string) {
    await this.ensure(discordUserId, username);
    return prisma.sellerProfile.update({
      where: { discordUserId },
      data: {
        ticketsHandled: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });
  }

  static async getByDiscordId(discordUserId: string) {
    return prisma.sellerProfile.findUnique({ where: { discordUserId } });
  }
}
