"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimationService = void 0;
const discord_js_1 = require("discord.js");
const branding_1 = require("../../config/branding");
const format_1 = require("../../utils/format");
const cv2_1 = require("../../utils/cv2");
const logger_1 = require("../../utils/logger");
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
class AnimationService {
    static async sendActivationAnimation(client, discordUserId, license, lang = "fr") {
        try {
            const user = await client.users.fetch(discordUserId);
            const dm = await user.createDM();
            // Step 1 — Verifying
            const step1 = new discord_js_1.ContainerBuilder()
                .setAccentColor(cv2_1.ACCENT.warning)
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`${branding_1.EMOJI.yellowCircle} **Vérification du paiement...**\n\n${branding_1.EMOJI.clock} Veuillez patienter...`));
            const msg = await dm.send((0, cv2_1.buildReply)([step1]));
            await sleep(1500);
            // Step 2 — Activating
            const step2 = new discord_js_1.ContainerBuilder()
                .setAccentColor(cv2_1.ACCENT.info)
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`${branding_1.EMOJI.check} Paiement vérifié\n` +
                `${branding_1.EMOJI.yellowCircle} **Activation de la licence...**\n\n${branding_1.EMOJI.clock} Presque terminé...`));
            await msg.edit((0, cv2_1.buildReply)([step2]));
            await sleep(1500);
            // Step 3 — Assigning role
            const step3 = new discord_js_1.ContainerBuilder()
                .setAccentColor(cv2_1.ACCENT.info)
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`${branding_1.EMOJI.check} Paiement vérifié\n` +
                `${branding_1.EMOJI.check} Licence activée\n` +
                `${branding_1.EMOJI.yellowCircle} **Attribution du rôle vendeur...**\n\n${branding_1.EMOJI.bolt} Dernière étape...`));
            await msg.edit((0, cv2_1.buildReply)([step3]));
            await sleep(1500);
            // Step 4 — Final success
            const finalContainer = new discord_js_1.ContainerBuilder()
                .setAccentColor(cv2_1.ACCENT.success)
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${branding_1.EMOJI.sparkle} Bienvenue chez Yourazz !\n\n` +
                `Votre paiement a été **validé avec succès**.\n\n` +
                `${branding_1.EMOJI.check} Licence activée\n` +
                `${branding_1.EMOJI.check} Rôle vendeur attribué\n` +
                `${branding_1.EMOJI.check} Accès débloqués\n` +
                `${branding_1.EMOJI.check} Dashboard disponible`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`${branding_1.EMOJI.fire} **Plan :** Vendeur Yourazz\n` +
                `${branding_1.EMOJI.calendar} **Expiration :** ${(0, format_1.formatDate)(license.expiresAt)}\n\n` +
                `Merci pour votre confiance ${branding_1.EMOJI.heart}`))
                .addMediaGalleryComponents((0, cv2_1.mediaGif)(branding_1.BRANDING.successBannerUrl))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# ${branding_1.BRANDING.footer}`));
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId("yrz_panel_dashboard")
                .setLabel("Mon Dashboard")
                .setEmoji("📊")
                .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
                .setCustomId("yrz_panel_support")
                .setLabel("Support")
                .setEmoji("📩")
                .setStyle(discord_js_1.ButtonStyle.Secondary));
            await msg.edit((0, cv2_1.buildReply)([finalContainer], [row]));
        }
        catch (err) {
            logger_1.logger.warn("AnimationService", `DM impossible pour ${discordUserId}: ${err.message}`);
        }
    }
}
exports.AnimationService = AnimationService;
//# sourceMappingURL=animation.service.js.map