import { prisma } from "../../services/database";
import { LicenseService } from "../licenses/license.service";
import { UserService } from "../users/user.service";
import { RoleService } from "../admin/role.service";
import { NotificationService } from "../notifications/notification.service";
import { AnimationService } from "../notifications/animation.service";
import { AuditService } from "../admin/audit.service";
import { logger } from "../../utils/logger";
import { Client } from "discord.js";

export class PaymentService {
  static async handleCheckoutCompleted(
    client: Client,
    sessionId: string,
    paymentIntentId: string,
    metadata: {
      discordUserId: string;
      guildId: string;
      licensePlan: string;
      durationDays: string;
    },
    amount: number,
    currency: string,
  ) {
    const existing = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
    });
    if (existing) {
      logger.warn("PaymentService", `Paiement déjà traité: ${sessionId}`);
      return;
    }

    const user = await prisma.discordUser.findUnique({
      where: { discordId: metadata.discordUserId },
    });
    if (!user) {
      logger.error("PaymentService", `Utilisateur introuvable: ${metadata.discordUserId}`);
      return;
    }

    const activeLicense = await LicenseService.getActive(user.id, metadata.guildId);
    let license;

    if (activeLicense) {
      license = await LicenseService.renew(activeLicense.id, parseInt(metadata.durationDays));
    } else {
      license = await LicenseService.create(user.id, metadata.guildId, metadata.licensePlan, parseInt(metadata.durationDays));
    }

    await prisma.payment.create({
      data: {
        userId: user.id,
        licenseId: license.id,
        stripeSessionId: sessionId,
        stripePaymentIntentId: paymentIntentId,
        amount,
        currency,
        status: "COMPLETED",
        plan: metadata.licensePlan,
      },
    });

    await RoleService.assignSellerRole(client, metadata.guildId, metadata.discordUserId, metadata.licensePlan);

    const dbUserLang = await prisma.discordUser.findUnique({ where: { id: user.id } });
    const lang = (dbUserLang as any)?.language ?? "fr";
    await AnimationService.sendActivationAnimation(client, metadata.discordUserId, license, lang);
    await NotificationService.logNewLicense(client, metadata.discordUserId, metadata.licensePlan, amount, currency);

    await AuditService.log(user.id, "LICENSE_PURCHASED", user.id, {
      plan: metadata.licensePlan,
      amount,
      sessionId,
    });

    logger.info("PaymentService", `Paiement traité: ${sessionId} — ${metadata.licensePlan} pour ${metadata.discordUserId}`);
  }

  static async handlePaymentFailed(
    client: Client,
    sessionId: string,
    metadata: { discordUserId: string },
  ) {
    await NotificationService.sendPaymentFailed(client, metadata.discordUserId);
    await NotificationService.logPaymentFailed(client, metadata.discordUserId, sessionId);
    logger.warn("PaymentService", `Paiement échoué: ${sessionId}`);
  }

  static async handleRefund(
    client: Client,
    paymentIntentId: string,
  ) {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { license: true, user: true },
    });
    if (!payment) return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "REFUNDED" },
    });

    if (payment.license) {
      await LicenseService.suspend(payment.license.id, "Remboursement Stripe");
      if (payment.user) {
        await RoleService.removeSellerRoles(client, payment.license.guildId, payment.user.discordId);
      }
    }

    logger.info("PaymentService", `Remboursement traité: ${paymentIntentId}`);
  }
}
