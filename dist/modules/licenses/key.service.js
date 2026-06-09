"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyService = void 0;
const database_1 = require("../../services/database");
const format_1 = require("../../utils/format");
const license_service_1 = require("./license.service");
const logger_1 = require("../../utils/logger");
class KeyService {
    static async generate(planName, count = 1) {
        const plan = await database_1.prisma.licensePlan.findUnique({ where: { name: planName } });
        if (!plan)
            throw new Error(`Plan inconnu: ${planName}`);
        const keys = [];
        for (let i = 0; i < count; i++) {
            let key;
            do {
                key = (0, format_1.generateLicenseKey)();
            } while (await database_1.prisma.licenseKey.findUnique({ where: { key } }));
            const created = await database_1.prisma.licenseKey.create({
                data: {
                    key,
                    planId: plan.id,
                    durationDays: plan.durationDays,
                },
            });
            keys.push(created);
        }
        logger_1.logger.info("KeyService", `${count} clé(s) générée(s) pour le plan ${planName}`);
        return keys;
    }
    static async redeem(key, userId, guildId) {
        const licenseKey = await database_1.prisma.licenseKey.findUnique({
            where: { key },
            include: { plan: true },
        });
        if (!licenseKey)
            throw new Error("Clé invalide");
        if (licenseKey.status !== "AVAILABLE")
            throw new Error(`Clé ${licenseKey.status.toLowerCase()}`);
        const license = await license_service_1.LicenseService.create(userId, guildId, licenseKey.plan.name, licenseKey.durationDays);
        await database_1.prisma.licenseKey.update({
            where: { id: licenseKey.id },
            data: {
                status: "REDEEMED",
                redeemedById: userId,
                redeemedAt: new Date(),
            },
        });
        logger_1.logger.info("KeyService", `Clé ${key} utilisée par ${userId}`);
        return { license, plan: licenseKey.plan };
    }
    static async getStatus(key) {
        return database_1.prisma.licenseKey.findUnique({
            where: { key },
            include: { plan: true, redeemedBy: true },
        });
    }
    static async blacklist(key) {
        return database_1.prisma.licenseKey.update({
            where: { key },
            data: { status: "BLACKLISTED" },
        });
    }
}
exports.KeyService = KeyService;
//# sourceMappingURL=key.service.js.map