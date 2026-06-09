"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleButton = handleButton;
const discord_js_1 = require("discord.js");
const stripe_service_1 = require("../modules/payments/stripe.service");
const license_service_1 = require("../modules/licenses/license.service");
const user_service_1 = require("../modules/users/user.service");
const cv2_1 = require("../utils/cv2");
const format_1 = require("../utils/format");
const branding_1 = require("../config/branding");
async function handleButton(interaction) {
    const id = interaction.customId;
    if (id === "yrz_renew")
        return handleRenew(interaction);
    if (id === "yrz_redeem_key")
        return showRedeemModal(interaction);
}
async function handleRenew(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const dbUser = await user_service_1.UserService.getOrCreate(interaction.user);
    const license = await license_service_1.LicenseService.getActive(dbUser.id, interaction.guildId);
    if (!license) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Pas de licence", "Aucune licence à renouveler.")]));
    }
    const session = await stripe_service_1.StripeService.createCheckoutSession({
        discordUserId: interaction.user.id,
        guildId: interaction.guildId,
        planName: license.plan.name,
    });
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## 🔄 Renouvellement`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`Renouvelez votre licence **${license.plan.displayName}**\n\n💰 **${(0, format_1.formatPrice)(license.plan.price, license.plan.currency)}**`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# ${branding_1.BRANDING.footer}`));
    const btn = new discord_js_1.ButtonBuilder().setLabel(`💳 Payer ${(0, format_1.formatPrice)(license.plan.price, license.plan.currency)}`).setStyle(discord_js_1.ButtonStyle.Link).setURL(session.url);
    const row = new discord_js_1.ActionRowBuilder().addComponents(btn);
    await interaction.editReply((0, cv2_1.buildReply)([container], [row]));
}
async function showRedeemModal(interaction) {
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId("yrz_redeem_modal")
        .setTitle("🔑 Activer une clé licence");
    const input = new discord_js_1.TextInputBuilder()
        .setCustomId("key_input")
        .setLabel("Votre clé licence")
        .setPlaceholder("YRZ-XXXX-XXXX-XXXX")
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(17)
        .setMaxLength(19);
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}
//# sourceMappingURL=buttons.js.map