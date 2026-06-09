"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseService = void 0;
const database_1 = require("../../services/database");
const licenses_1 = require("../../config/licenses");
const logger_1 = require("../../utils/logger");
class LicenseService {
    static async create(userId, guildId, planName, durationDays) {
        const plan = await this.getOrCreatePlan(planName);
        const duration = durationDays ?? plan.durationDays;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + duration);
        const license = await database_1.prisma.license.create({
            data: {
                userId,
                guildId,
                planId: plan.id,
                status: "ACTIVE",
                expiresAt,
            },
            include: { plan: true },
        });
        logger_1.logger.info("LicenseService", `Licence ${planName} créée pour ${userId}`, { licenseId: license.id });
        return license;
    }
    static async renew(licenseId, durationDays) {
        const license = await database_1.prisma.license.findUnique({
            where: { id: licenseId },
            include: { plan: true },
        });
        if (!license)
            throw new Error("Licence introuvable");
        const duration = durationDays ?? license.plan.durationDays;
        const now = new Date();
        const baseDate = license.expiresAt > now ? license.expiresAt : now;
        const newExpiry = new Date(baseDate);
        newExpiry.setDate(newExpiry.getDate() + duration);
        return database_1.prisma.license.update({
            where: { id: licenseId },
            data: {
                status: "ACTIVE",
                expiresAt: newExpiry,
                renewedAt: now,
                suspendedAt: null,
                suspensionReason: null,
            },
            include: { plan: true },
        });
    }
    static async suspend(licenseId, reason) {
        return database_1.prisma.license.update({
            where: { id: licenseId },
            data: {
                status: "SUSPENDED",
                suspendedAt: new Date(),
                suspensionReason: reason,
            },
        });
    }
    static async reactivate(licenseId) {
        return database_1.prisma.license.update({
            where: { id: licenseId },
            data: {
                status: "ACTIVE",
                suspendedAt: null,
                suspensionReason: null,
            },
        });
    }
    static async expire(licenseId) {
        return database_1.prisma.license.update({
            where: { id: licenseId },
            data: { status: "EXPIRED" },
        });
    }
    static async extend(licenseId, days) {
        const license = await database_1.prisma.license.findUnique({ where: { id: licenseId } });
        if (!license)
            throw new Error("Licence introuvable");
        const newExpiry = new Date(license.expiresAt);
        newExpiry.setDate(newExpiry.getDate() + days);
        return database_1.prisma.license.update({
            where: { id: licenseId },
            data: { expiresAt: newExpiry },
        });
    }
    static async getActive(userId, guildId) {
        return database_1.prisma.license.findFirst({
            where: { userId, guildId, status: "ACTIVE" },
            include: { plan: true },
            orderBy: { expiresAt: "desc" },
        });
    }
    static async getByUser(userId) {
        return database_1.prisma.license.findMany({
            where: { userId },
            include: { plan: true },
            orderBy: { createdAt: "desc" },
        });
    }
    static async getExpiringIn(days) {
        const now = new Date();
        const target = new Date();
        target.setDate(target.getDate() + days);
        return database_1.prisma.license.findMany({
            where: {
                status: "ACTIVE",
                expiresAt: { gte: now, lte: target },
            },
            include: { user: true, plan: true },
        });
    }
    static async getExpired() {
        return database_1.prisma.license.findMany({
            where: {
                status: "ACTIVE",
                expiresAt: { lt: new Date() },
            },
            include: { user: true, plan: true },
        });
    }
    static async getAllByGuild(guildId, status) {
        const where = { guildId };
        if (status)
            where.status = status;
        return database_1.prisma.license.findMany({
            where,
            include: { user: true, plan: true },
            orderBy: { createdAt: "desc" },
        });
    }
    static async getStats(guildId) {
        const [active, expired, suspended, totalRevenue] = await Promise.all([
            database_1.prisma.license.count({ where: { guildId, status: "ACTIVE" } }),
            database_1.prisma.license.count({ where: { guildId, status: "EXPIRED" } }),
            database_1.prisma.license.count({ where: { guildId, status: "SUSPENDED" } }),
            database_1.prisma.payment.aggregate({
                where: { status: "COMPLETED" },
                _sum: { amount: true },
            }),
        ]);
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthRevenue = await database_1.prisma.payment.aggregate({
            where: { status: "COMPLETED", createdAt: { gte: monthStart } },
            _sum: { amount: true },
        });
        return {
            active,
            expired,
            suspended,
            totalRevenue: totalRevenue._sum.amount ?? 0,
            monthRevenue: monthRevenue._sum.amount ?? 0,
        };
    }
    static async getOrCreatePlan(planName) {
        const config = licenses_1.PLANS[planName];
        if (!config)
            throw new Error(`Plan inconnu: ${planName}`);
        const planData = {
            displayName: config.displayName,
            price: config.price,
            currency: config.currency,
            durationDays: config.durationDays,
            maxProducts: config.maxProducts,
            roleId: config.roleId,
            features: config.features,
        };
        return database_1.prisma.licensePlan.upsert({
            where: { name: planName },
            update: planData,
            create: { name: config.name, ...planData },
        });
    }
}
exports.LicenseService = LicenseService;
//# sourceMappingURL=license.service.js.map