"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const branding_1 = require("../config/branding");
const cv2_1 = require("../utils/cv2");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("license-panel")
    .setDescription("Afficher le panel de licences premium")
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator);
async function execute(interaction) {
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(branding_1.THEME.primary)
        .addMediaGalleryComponents((0, cv2_1.mediaGif)("https://cdn.discordapp.com/attachments/1513986663636926565/1514030873916342413/ezgif-22a76ce7a3afa8d0.gif?ex=6a29e2a1&is=6a289121&hm=027bb5279ac83a57819887cabf928ef0e4173292c5f512c887b4de0dae1d2dc4"))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${branding_1.EMOJI.rocket} Yourazz License Manager`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`Devenez **vendeur certifié** et accédez à tout l'écosystème Yourazz.\n\n` +
        `${branding_1.EMOJI.arrowRight} ${branding_1.EMOJI.lock} Paiement sécurisé via Stripe\n` +
        `${branding_1.EMOJI.arrowRight} ${branding_1.EMOJI.bolt} Attribution automatique du rôle\n` +
        `${branding_1.EMOJI.arrowRight} ${branding_1.EMOJI.shield} Licence vérifiée et protégée\n` +
        `${branding_1.EMOJI.arrowRight} ${branding_1.EMOJI.star} Accès à toutes les fonctionnalités`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# ${branding_1.BRANDING.footer}`));
    const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("yrz_panel_payment")
        .setLabel("Paiement")
        .setEmoji("💳")
        .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
        .setCustomId("yrz_panel_dashboard")
        .setLabel("Mon Dashboard")
        .setEmoji("📊")
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId("yrz_panel_language")
        .setLabel("Langue")
        .setEmoji("🌍")
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("yrz_panel_help")
        .setLabel("Aide")
        .setEmoji("❓")
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId("yrz_panel_support")
        .setLabel("Support")
        .setEmoji("📩")
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    await interaction.reply({ content: `${branding_1.EMOJI.check} Panel envoyé.`, ephemeral: true });
    if (interaction.channel && "send" in interaction.channel) {
        await interaction.channel.send((0, cv2_1.cv2Reply)({ components: [container, row1, row2] }));
    }
}
//# sourceMappingURL=panel.js.map