import { CronJob } from "cron";
import { Client } from "discord.js";
import { LicenseService } from "./license.service";
import { RoleService } from "../admin/role.service";
import { NotificationService } from "../notifications/notification.service";
import { AuditService } from "../admin/audit.service";
import { REMINDER_DAYS } from "../../config/licenses";
import { daysUntil } from "../../utils/format";
import { logger } from "../../utils/logger";

export function startExpirationJob(client: Client) {
  const job = new CronJob("0 */30 * * * *", async () => {
    await checkReminders(client);
    await checkExpired(client);
  });

  job.start();
  logger.info("ExpirationJob", "Job d'expiration démarré (toutes les 30 min)");
}

async function checkReminders(client: Client) {
  for (const days of REMINDER_DAYS) {
    const licenses = await LicenseService.getExpiringIn(days);

    for (const license of licenses) {
      const remaining = daysUntil(license.expiresAt);
      if (remaining === days || (days === 1 && remaining <= 1 && remaining > 0)) {
        await NotificationService.sendExpirationReminder(
          client,
          license.user.discordId,
          license,
          remaining,
        );
      }
    }
  }
}

async function checkExpired(client: Client) {
  const expired = await LicenseService.getExpired();

  for (const license of expired) {
    await LicenseService.expire(license.id);
    await RoleService.removeSellerRoles(client, license.guildId, license.user.discordId);
    await NotificationService.sendLicenseExpired(client, license.user.discordId, license.plan.displayName);
    await NotificationService.logLicenseExpired(client, license.user.discordId, license.plan.displayName);
    await AuditService.log(null, "LICENSE_EXPIRED", license.userId, { plan: license.plan.name });
    logger.info("ExpirationJob", `Licence expirée: ${license.user.discordId} — ${license.plan.name}`);
  }
}
