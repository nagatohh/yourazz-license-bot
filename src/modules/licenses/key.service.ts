import { prisma } from "../../services/database";
import { generateLicenseKey } from "../../utils/format";
import { LicenseService } from "./license.service";
import { logger } from "../../utils/logger";

export class KeyService {
  static async generate(planName: string, count = 1) {
    const plan = await prisma.licensePlan.findUnique({ where: { name: planName } });
    if (!plan) throw new Error(`Plan inconnu: ${planName}`);

    const keys = [];
    for (let i = 0; i < count; i++) {
      let key: string;
      do {
        key = generateLicenseKey();
      } while (await prisma.licenseKey.findUnique({ where: { key } }));

      const created = await prisma.licenseKey.create({
        data: {
          key,
          planId: plan.id,
          durationDays: plan.durationDays,
        },
      });
      keys.push(created);
    }

    logger.info("KeyService", `${count} clé(s) générée(s) pour le plan ${planName}`);
    return keys;
  }

  static async redeem(key: string, userId: string, guildId: string) {
    const licenseKey = await prisma.licenseKey.findUnique({
      where: { key },
      include: { plan: true },
    });

    if (!licenseKey) throw new Error("Clé invalide");
    if (licenseKey.status !== "AVAILABLE") throw new Error(`Clé ${licenseKey.status.toLowerCase()}`);

    const license = await LicenseService.create(userId, guildId, licenseKey.plan.name, licenseKey.durationDays);

    await prisma.licenseKey.update({
      where: { id: licenseKey.id },
      data: {
        status: "REDEEMED",
        redeemedById: userId,
        redeemedAt: new Date(),
      },
    });

    logger.info("KeyService", `Clé ${key} utilisée par ${userId}`);
    return { license, plan: licenseKey.plan };
  }

  static async getStatus(key: string) {
    return prisma.licenseKey.findUnique({
      where: { key },
      include: { plan: true, redeemedBy: true },
    });
  }

  static async blacklist(key: string) {
    return prisma.licenseKey.update({
      where: { key },
      data: { status: "BLACKLISTED" },
    });
  }
}
