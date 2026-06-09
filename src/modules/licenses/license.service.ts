import { prisma } from "../../services/database";
import { PLANS } from "../../config/licenses";
import { logger } from "../../utils/logger";

export class LicenseService {
  static async create(userId: string, guildId: string, planName: string, durationDays?: number) {
    const plan = await this.getOrCreatePlan(planName);
    const duration = durationDays ?? plan.durationDays;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    const license = await prisma.license.create({
      data: {
        userId,
        guildId,
        planId: plan.id,
        status: "ACTIVE",
        expiresAt,
      },
      include: { plan: true },
    });

    logger.info("LicenseService", `Licence ${planName} créée pour ${userId}`, { licenseId: license.id });
    return license;
  }

  static async renew(licenseId: string, durationDays?: number) {
    const license = await prisma.license.findUnique({
      where: { id: licenseId },
      include: { plan: true },
    });
    if (!license) throw new Error("Licence introuvable");

    const duration = durationDays ?? license.plan.durationDays;
    const now = new Date();
    const baseDate = license.expiresAt > now ? license.expiresAt : now;
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + duration);

    return prisma.license.update({
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

  static async suspend(licenseId: string, reason: string) {
    return prisma.license.update({
      where: { id: licenseId },
      data: {
        status: "SUSPENDED",
        suspendedAt: new Date(),
        suspensionReason: reason,
      },
    });
  }

  static async reactivate(licenseId: string) {
    return prisma.license.update({
      where: { id: licenseId },
      data: {
        status: "ACTIVE",
        suspendedAt: null,
        suspensionReason: null,
      },
    });
  }

  static async expire(licenseId: string) {
    return prisma.license.update({
      where: { id: licenseId },
      data: { status: "EXPIRED" },
    });
  }

  static async extend(licenseId: string, days: number) {
    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) throw new Error("Licence introuvable");

    const newExpiry = new Date(license.expiresAt);
    newExpiry.setDate(newExpiry.getDate() + days);

    return prisma.license.update({
      where: { id: licenseId },
      data: { expiresAt: newExpiry },
    });
  }

  static async getActive(userId: string, guildId: string) {
    return prisma.license.findFirst({
      where: { userId, guildId, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { expiresAt: "desc" },
    });
  }

  static async getByUser(userId: string) {
    return prisma.license.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getExpiringIn(days: number) {
    const now = new Date();
    const target = new Date();
    target.setDate(target.getDate() + days);

    return prisma.license.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { gte: now, lte: target },
      },
      include: { user: true, plan: true },
    });
  }

  static async getExpired() {
    return prisma.license.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: new Date() },
      },
      include: { user: true, plan: true },
    });
  }

  static async getAllByGuild(guildId: string, status?: string) {
    const where: any = { guildId };
    if (status) where.status = status;
    return prisma.license.findMany({
      where,
      include: { user: true, plan: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getStats(guildId: string) {
    const [active, expired, suspended, totalRevenue] = await Promise.all([
      prisma.license.count({ where: { guildId, status: "ACTIVE" } }),
      prisma.license.count({ where: { guildId, status: "EXPIRED" } }),
      prisma.license.count({ where: { guildId, status: "SUSPENDED" } }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
    ]);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthRevenue = await prisma.payment.aggregate({
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

  private static async getOrCreatePlan(planName: string) {
    const config = PLANS[planName];
    if (!config) throw new Error(`Plan inconnu: ${planName}`);

    const planData = {
      displayName: config.displayName,
      price: config.price,
      currency: config.currency,
      durationDays: config.durationDays,
      maxProducts: config.maxProducts,
      roleId: config.roleId,
      features: config.features,
    };

    return prisma.licensePlan.upsert({
      where: { name: planName },
      update: planData,
      create: { name: config.name, ...planData },
    });
  }
}
