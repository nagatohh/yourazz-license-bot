"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const discord_js_1 = require("discord.js");
const channels_1 = require("../../config/channels");
const licenses_1 = require("../../config/licenses");
const format_1 = require("../../utils/format");
const cv2_1 = require("../../utils/cv2");
const logger_1 = require("../../utils/logger");
function dmPayload(container) {
    return (0, cv2_1.buildReply)([container]);
}
class NotificationService {
    static async sendDM(client, discordUserId, payload) {
        try {
            const user = await client.users.fetch(discordUserId);
            await user.send(payload);
        }
        catch {
            logger_1.logger.warn("NotificationService", `Impossible d'envoyer un DM à ${discordUserId}`);
        }
    }
    static async sendLicenseActivated(client, discordUserId, license) {
        const container = new discord_js_1.ContainerBuilder()
            .setAccentColor(cv2_1.ACCENT.success)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ✅ Licence activée`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`Votre licence **${license.plan.displayName}** est maintenant active !\n\n` +
            `📅 Expiration : **${(0, format_1.formatDate)(license.expiresAt)}**\n` +
            `📦 Produits max : **${license.plan.maxProducts === -1 ? "Illimité" : license.plan.maxProducts}**\n\n` +
            `Merci pour votre confiance ! 🎉`))
            .addMediaGalleryComponents((0, cv2_1.mediaGif)("https://cdn.discordapp.com/attachments/1513986663636926565/1514031473097703456/ezgif-208962271a6be842.gif?ex=6a29e330&is=6a2891b0&hm=661167db3025d35089dd42472f8d7064bd696f164fc54c913a821ef0a3aea74d&"));
        await this.sendDM(client, discordUserId, dmPayload(container));
    }
    static async sendExpirationReminder(client, discordUserId, license, daysLeft) {
        const urgency = daysLeft <= 1 ? "🚨" : daysLeft <= 3 ? "⚠️" : "📢";
        const container = new discord_js_1.ContainerBuilder()
            .setAccentColor(cv2_1.ACCENT.warning)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ⚠️ Licence expire ${daysLeft <= 1 ? "demain" : `dans ${daysLeft} jours`}`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`${urgency} Votre licence **${license.plan.displayName}** expire le **${(0, format_1.formatDate)(license.expiresAt)}**.\n\n` +
            `Renouvelez maintenant avec \`/licence renouveler\` pour ne pas perdre votre accès vendeur.`))
            .addMediaGalleryComponents((0, cv2_1.mediaGif)("https://cdn.discordapp.com/attachments/1511856683511578625/1512099822990135470/ezgif-28ca24151de2ab3d.gif"));
        await this.sendDM(client, discordUserId, dmPayload(container));
    }
    static async sendLicenseExpired(client, discordUserId, planName) {
        const container = new discord_js_1.ContainerBuilder()
            .setAccentColor(cv2_1.ACCENT.error)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ❌ Licence expirée`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`Votre licence **${planName}** a expiré.\n\n` +
            `Votre rôle vendeur a été retiré.\n` +
            `Utilisez \`/licence acheter\` pour renouveler.`));
        await this.sendDM(client, discordUserId, dmPayload(container));
    }
    static async sendPaymentFailed(client, discordUserId) {
        const container = new discord_js_1.ContainerBuilder()
            .setAccentColor(cv2_1.ACCENT.error)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ❌ Paiement échoué`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`Votre paiement n'a pas abouti.\nVeuillez réessayer avec \`/licence acheter\`.`));
        await this.sendDM(client, discordUserId, dmPayload(container));
    }
    static async logNewLicense(client, discordUserId, planName, amount, currency) {
        const channel = await client.channels.fetch(channels_1.CHANNELS.licenseLog);
        if (!channel)
            return;
        const plan = licenses_1.PLANS[planName];
        const container = new discord_js_1.ContainerBuilder()
            .setAccentColor(cv2_1.ACCENT.success)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## 🎉 Nouvelle licence vendue`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`**Vendeur :** <@${discordUserId}>\n` +
            `**Plan :** ${plan?.emoji ?? ""} ${plan?.displayName ?? planName}\n` +
            `**Montant :** ${(0, format_1.formatPrice)(amount, currency)}`));
        await channel.send((0, cv2_1.buildReply)([container]));
    }
    static async logLicenseExpired(client, discordUserId, planName) {
        const channel = await client.channels.fetch(channels_1.CHANNELS.staffLog);
        if (!channel)
            return;
        const container = new discord_js_1.ContainerBuilder()
            .setAccentColor(cv2_1.ACCENT.warning)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ⏰ Licence expirée`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`**Vendeur :** <@${discordUserId}>\n**Plan :** ${planName}`));
        await channel.send((0, cv2_1.buildReply)([container]));
    }
    static async logPaymentFailed(client, discordUserId, sessionId) {
        const channel = await client.channels.fetch(channels_1.CHANNELS.staffLog);
        if (!channel)
            return;
        const container = new discord_js_1.ContainerBuilder()
            .setAccentColor(cv2_1.ACCENT.error)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ❌ Paiement échoué`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`**Utilisateur :** <@${discordUserId}>\n**Session :** \`${sessionId}\``));
        await channel.send((0, cv2_1.buildReply)([container]));
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification.service.js.map