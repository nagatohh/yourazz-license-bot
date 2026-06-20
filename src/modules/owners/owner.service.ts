import { prisma } from "../../services/database";
import { OWNER_SCORE, OWNER_TIERS } from "../../config/owners";
import { OwnerTier, ScoreEventType, TeamMemberStatus } from "@prisma/client";

export class OwnerService {
  static async create(discordId: string, username: string) {
    return prisma.owner.create({
      data: { discordId, username },
    });
  }

  static async remove(discordId: string) {
    return prisma.owner.delete({
      where: { discordId },
    });
  }

  static async getByDiscordId(discordId: string) {
    return prisma.owner.findUnique({
      where: { discordId },
      include: {
        team: { where: { status: { in: ["ACTIVE", "INACTIVE"] } } },
        goals: { where: { completed: false }, orderBy: { endsAt: "asc" } },
      },
    });
  }

  /** Version légère (sans includes) — pour les actions où seuls id/tier comptent. */
  static async getLite(discordId: string) {
    return prisma.owner.findUnique({ where: { discordId } });
  }

  static async getAll() {
    return prisma.owner.findMany({
      where: { isActive: true },
      include: { team: true },
      orderBy: { totalScore: "desc" },
    });
  }

  static async addRecruit(ownerId: string, discordId: string, username: string) {
    const member = await prisma.ownerTeamMember.create({
      data: { ownerId, discordId, username, lastActive: new Date() },
    });

    await this.addScore(ownerId, "RECRUIT_ACTIVE", OWNER_SCORE.RECRUIT_ACTIVE, discordId);
    await this.checkTierUpgrade(ownerId);
    return member;
  }

  static async removeRecruit(ownerId: string, discordId: string) {
    await prisma.ownerTeamMember.updateMany({
      where: { ownerId, discordId },
      data: { status: "LEFT", leftAt: new Date() },
    });

    await this.addScore(ownerId, "MEMBER_LEFT", OWNER_SCORE.MEMBER_LEFT, discordId);
  }

  static async transferRecruit(fromOwnerId: string, toOwnerId: string, memberDiscordId: string) {
    await prisma.ownerTeamMember.updateMany({
      where: { ownerId: fromOwnerId, discordId: memberDiscordId },
      data: { ownerId: toOwnerId },
    });
  }

  static async getTeam(ownerId: string) {
    return prisma.ownerTeamMember.findMany({
      where: { ownerId, status: { in: ["ACTIVE", "INACTIVE"] } },
      orderBy: { joinedAt: "desc" },
    });
  }

  static async getTeamStats(ownerId: string) {
    const team = await prisma.ownerTeamMember.findMany({ where: { ownerId } });
    const active = team.filter((m) => m.status === "ACTIVE").length;
    const inactive = team.filter((m) => m.status === "INACTIVE").length;
    const sanctioned = team.filter((m) => m.status === "SANCTIONED").length;
    const total = team.filter((m) => m.status !== "LEFT").length;
    return { active, inactive, sanctioned, total };
  }

  static async addScore(
    ownerId: string,
    type: ScoreEventType,
    points: number,
    memberId?: string,
    reason?: string,
  ) {
    await prisma.ownerScoreEvent.create({
      data: { ownerId, type, points, memberId, reason },
    });

    await prisma.owner.update({
      where: { id: ownerId },
      data: { totalScore: { increment: points } },
    });
  }

  static async manualScore(ownerId: string, points: number, reason: string) {
    await this.addScore(ownerId, "MANUAL_ADJUST", points, undefined, reason);
  }

  static async getLeaderboard(limit = 15) {
    return prisma.owner.findMany({
      where: { isActive: true },
      orderBy: { totalScore: "desc" },
      take: limit,
      include: { team: { where: { status: "ACTIVE" } } },
    });
  }

  static async checkTierUpgrade(ownerId: string) {
    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      include: { team: { where: { status: "ACTIVE" } } },
    });
    if (!owner) return;

    const activeRecruits = owner.team.length;
    let newTier: OwnerTier = "BRONZE";

    for (const t of OWNER_TIERS) {
      if (activeRecruits >= t.minRecruits) newTier = t.tier;
    }

    if (newTier !== owner.tier) {
      await prisma.owner.update({
        where: { id: ownerId },
        data: { tier: newTier },
      });
    }

    return newTier;
  }

  static async markMemberActive(discordId: string) {
    await prisma.ownerTeamMember.updateMany({
      where: { discordId, status: { in: ["ACTIVE", "INACTIVE"] } },
      data: { lastActive: new Date(), status: "ACTIVE" },
    });
  }

  static async recordMemberSale(discordId: string) {
    const members = await prisma.ownerTeamMember.findMany({
      where: { discordId, status: "ACTIVE" },
    });

    for (const member of members) {
      await prisma.ownerTeamMember.update({
        where: { id: member.id },
        data: { totalSales: { increment: 1 } },
      });
      await this.addScore(member.ownerId, "MEMBER_SALE", OWNER_SCORE.MEMBER_SALE, discordId);
    }
  }

  static async sanctionMember(discordId: string) {
    const members = await prisma.ownerTeamMember.findMany({
      where: { discordId, status: "ACTIVE" },
    });

    for (const member of members) {
      await prisma.ownerTeamMember.update({
        where: { id: member.id },
        data: { sanctions: { increment: 1 }, status: "SANCTIONED" },
      });
      await this.addScore(member.ownerId, "MEMBER_SANCTIONED", OWNER_SCORE.MEMBER_SANCTIONED, discordId);
    }
  }

  static getTierInfo(tier: OwnerTier) {
    return OWNER_TIERS.find((t) => t.tier === tier) ?? OWNER_TIERS[0];
  }

  static getNextTier(tier: OwnerTier) {
    const idx = OWNER_TIERS.findIndex((t) => t.tier === tier);
    return idx < OWNER_TIERS.length - 1 ? OWNER_TIERS[idx + 1] : null;
  }
}
