"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnerService = void 0;
const database_1 = require("../../services/database");
const owners_1 = require("../../config/owners");
class OwnerService {
    static async create(discordId, username) {
        return database_1.prisma.owner.create({
            data: { discordId, username },
        });
    }
    static async remove(discordId) {
        return database_1.prisma.owner.delete({
            where: { discordId },
        });
    }
    static async getByDiscordId(discordId) {
        return database_1.prisma.owner.findUnique({
            where: { discordId },
            include: {
                team: { where: { status: { in: ["ACTIVE", "INACTIVE"] } } },
                goals: { where: { completed: false }, orderBy: { endsAt: "asc" } },
            },
        });
    }
    /** Version légère (sans includes) — pour les actions où seuls id/tier comptent. */
    static async getLite(discordId) {
        return database_1.prisma.owner.findUnique({ where: { discordId } });
    }
    static async getAll() {
        return database_1.prisma.owner.findMany({
            where: { isActive: true },
            include: { team: true },
            orderBy: { totalScore: "desc" },
        });
    }
    static async addRecruit(ownerId, discordId, username) {
        const member = await database_1.prisma.ownerTeamMember.create({
            data: { ownerId, discordId, username, lastActive: new Date() },
        });
        await this.addScore(ownerId, "RECRUIT_ACTIVE", owners_1.OWNER_SCORE.RECRUIT_ACTIVE, discordId);
        await this.checkTierUpgrade(ownerId);
        return member;
    }
    static async removeRecruit(ownerId, discordId) {
        await database_1.prisma.ownerTeamMember.updateMany({
            where: { ownerId, discordId },
            data: { status: "LEFT", leftAt: new Date() },
        });
        await this.addScore(ownerId, "MEMBER_LEFT", owners_1.OWNER_SCORE.MEMBER_LEFT, discordId);
    }
    static async transferRecruit(fromOwnerId, toOwnerId, memberDiscordId) {
        await database_1.prisma.ownerTeamMember.updateMany({
            where: { ownerId: fromOwnerId, discordId: memberDiscordId },
            data: { ownerId: toOwnerId },
        });
    }
    static async getTeam(ownerId) {
        return database_1.prisma.ownerTeamMember.findMany({
            where: { ownerId, status: { in: ["ACTIVE", "INACTIVE"] } },
            orderBy: { joinedAt: "desc" },
        });
    }
    static async getTeamStats(ownerId) {
        const team = await database_1.prisma.ownerTeamMember.findMany({ where: { ownerId } });
        const active = team.filter((m) => m.status === "ACTIVE").length;
        const inactive = team.filter((m) => m.status === "INACTIVE").length;
        const sanctioned = team.filter((m) => m.status === "SANCTIONED").length;
        const total = team.filter((m) => m.status !== "LEFT").length;
        return { active, inactive, sanctioned, total };
    }
    static async addScore(ownerId, type, points, memberId, reason) {
        await database_1.prisma.ownerScoreEvent.create({
            data: { ownerId, type, points, memberId, reason },
        });
        await database_1.prisma.owner.update({
            where: { id: ownerId },
            data: { totalScore: { increment: points } },
        });
    }
    static async manualScore(ownerId, points, reason) {
        await this.addScore(ownerId, "MANUAL_ADJUST", points, undefined, reason);
    }
    static async getLeaderboard(limit = 15) {
        return database_1.prisma.owner.findMany({
            where: { isActive: true },
            orderBy: { totalScore: "desc" },
            take: limit,
            include: { team: { where: { status: "ACTIVE" } } },
        });
    }
    static async checkTierUpgrade(ownerId) {
        const owner = await database_1.prisma.owner.findUnique({
            where: { id: ownerId },
            include: { team: { where: { status: "ACTIVE" } } },
        });
        if (!owner)
            return;
        const activeRecruits = owner.team.length;
        let newTier = "BRONZE";
        for (const t of owners_1.OWNER_TIERS) {
            if (activeRecruits >= t.minRecruits)
                newTier = t.tier;
        }
        if (newTier !== owner.tier) {
            await database_1.prisma.owner.update({
                where: { id: ownerId },
                data: { tier: newTier },
            });
        }
        return newTier;
    }
    static async markMemberActive(discordId) {
        await database_1.prisma.ownerTeamMember.updateMany({
            where: { discordId, status: { in: ["ACTIVE", "INACTIVE"] } },
            data: { lastActive: new Date(), status: "ACTIVE" },
        });
    }
    static async recordMemberSale(discordId) {
        const members = await database_1.prisma.ownerTeamMember.findMany({
            where: { discordId, status: "ACTIVE" },
        });
        for (const member of members) {
            await database_1.prisma.ownerTeamMember.update({
                where: { id: member.id },
                data: { totalSales: { increment: 1 } },
            });
            await this.addScore(member.ownerId, "MEMBER_SALE", owners_1.OWNER_SCORE.MEMBER_SALE, discordId);
        }
    }
    static async sanctionMember(discordId) {
        const members = await database_1.prisma.ownerTeamMember.findMany({
            where: { discordId, status: "ACTIVE" },
        });
        for (const member of members) {
            await database_1.prisma.ownerTeamMember.update({
                where: { id: member.id },
                data: { sanctions: { increment: 1 }, status: "SANCTIONED" },
            });
            await this.addScore(member.ownerId, "MEMBER_SANCTIONED", owners_1.OWNER_SCORE.MEMBER_SANCTIONED, discordId);
        }
    }
    static getTierInfo(tier) {
        return owners_1.OWNER_TIERS.find((t) => t.tier === tier) ?? owners_1.OWNER_TIERS[0];
    }
    static getNextTier(tier) {
        const idx = owners_1.OWNER_TIERS.findIndex((t) => t.tier === tier);
        return idx < owners_1.OWNER_TIERS.length - 1 ? owners_1.OWNER_TIERS[idx + 1] : null;
    }
}
exports.OwnerService = OwnerService;
//# sourceMappingURL=owner.service.js.map