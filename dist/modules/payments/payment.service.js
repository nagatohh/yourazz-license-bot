"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const database_1 = require("../../services/database");
const license_service_1 = require("../licenses/license.service");
const role_service_1 = require("../admin/role.service");
const notification_service_1 = require("../notifications/notification.service");
const animation_service_1 = require("../notifications/animation.service");
const audit_service_1 = require("../admin/audit.service");
const logger_1 = require("../../utils/logger");
class PaymentService {
    static async handleCheckoutCompleted(client, sessionId, paymentIntentId, metadata, amount, currency) {
        const existing = await database_1.prisma.payment.findUnique({
            where: { stripeSessionId: sessionId },
        });
        if (existing) {
            logger_1.logger.warn("PaymentService", `Paiement déjà traité: ${sessionId}`);
            return;
        }
        const user = await database_1.prisma.discordUser.findUnique({
            where: { discordId: metadata.discordUserId },
        });
        if (!user) {
            logger_1.logger.error("PaymentService", `Utilisateur introuvable: ${metadata.discordUserId}`);
            return;
        }
        const activeLicense = await license_service_1.LicenseService.getActive(user.id, metadata.guildId);
        let license;
        if (activeLicense) {
            license = await license_service_1.LicenseService.renew(activeLicense.id, parseInt(metadata.durationDays));
        }
        else {
            license = await license_service_1.LicenseService.create(user.id, metadata.guildId, metadata.licensePlan, parseInt(metadata.durationDays));
        }
        await database_1.prisma.payment.create({
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
        await role_service_1.RoleService.assignSellerRole(client, metadata.guildId, metadata.discordUserId, metadata.licensePlan);
        const dbUserLang = await database_1.prisma.discordUser.findUnique({ where: { id: user.id } });
        const lang = dbUserLang?.language ?? "fr";
        await animation_service_1.AnimationService.sendActivationAnimation(client, metadata.discordUserId, license, lang);
        await notification_service_1.NotificationService.logNewLicense(client, metadata.discordUserId, metadata.licensePlan, amount, currency);
        await audit_service_1.AuditService.log(user.id, "LICENSE_PURCHASED", user.id, {
            plan: metadata.licensePlan,
            amount,
            sessionId,
        });
        logger_1.logger.info("PaymentService", `Paiement traité: ${sessionId} — ${metadata.licensePlan} pour ${metadata.discordUserId}`);
    }
    static async handlePaymentFailed(client, sessionId, metadata) {
        await notification_service_1.NotificationService.sendPaymentFailed(client, metadata.discordUserId);
        await notification_service_1.NotificationService.logPaymentFailed(client, metadata.discordUserId, sessionId);
        logger_1.logger.warn("PaymentService", `Paiement échoué: ${sessionId}`);
    }
    static async handleRefund(client, paymentIntentId) {
        const payment = await database_1.prisma.payment.findUnique({
            where: { stripePaymentIntentId: paymentIntentId },
            include: { license: true, user: true },
        });
        if (!payment)
            return;
        await database_1.prisma.payment.update({
            where: { id: payment.id },
            data: { status: "REFUNDED" },
        });
        if (payment.license) {
            await license_service_1.LicenseService.suspend(payment.license.id, "Remboursement Stripe");
            if (payment.user) {
                await role_service_1.RoleService.removeSellerRoles(client, payment.license.guildId, payment.user.discordId);
            }
        }
        logger_1.logger.info("PaymentService", `Remboursement traité: ${paymentIntentId}`);
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=payment.service.js.map