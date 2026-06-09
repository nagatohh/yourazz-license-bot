"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startExpirationJob = startExpirationJob;
const cron_1 = require("cron");
const license_service_1 = require("./license.service");
const role_service_1 = require("../admin/role.service");
const notification_service_1 = require("../notifications/notification.service");
const audit_service_1 = require("../admin/audit.service");
const licenses_1 = require("../../config/licenses");
const format_1 = require("../../utils/format");
const logger_1 = require("../../utils/logger");
function startExpirationJob(client) {
    const job = new cron_1.CronJob("0 */30 * * * *", async () => {
        await checkReminders(client);
        await checkExpired(client);
    });
    job.start();
    logger_1.logger.info("ExpirationJob", "Job d'expiration démarré (toutes les 30 min)");
}
async function checkReminders(client) {
    for (const days of licenses_1.REMINDER_DAYS) {
        const licenses = await license_service_1.LicenseService.getExpiringIn(days);
        for (const license of licenses) {
            const remaining = (0, format_1.daysUntil)(license.expiresAt);
            if (remaining === days || (days === 1 && remaining <= 1 && remaining > 0)) {
                await notification_service_1.NotificationService.sendExpirationReminder(client, license.user.discordId, license, remaining);
            }
        }
    }
}
async function checkExpired(client) {
    const expired = await license_service_1.LicenseService.getExpired();
    for (const license of expired) {
        await license_service_1.LicenseService.expire(license.id);
        await role_service_1.RoleService.removeSellerRoles(client, license.guildId, license.user.discordId);
        await notification_service_1.NotificationService.sendLicenseExpired(client, license.user.discordId, license.plan.displayName);
        await notification_service_1.NotificationService.logLicenseExpired(client, license.user.discordId, license.plan.displayName);
        await audit_service_1.AuditService.log(null, "LICENSE_EXPIRED", license.userId, { plan: license.plan.name });
        logger_1.logger.info("ExpirationJob", `Licence expirée: ${license.user.discordId} — ${license.plan.name}`);
    }
}
//# sourceMappingURL=expiration.job.js.map