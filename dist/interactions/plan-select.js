"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePlanSelect = handlePlanSelect;
const discord_js_1 = require("discord.js");
const licenses_1 = require("../config/licenses");
const stripe_service_1 = require("../modules/payments/stripe.service");
const user_service_1 = require("../modules/users/user.service");
const format_1 = require("../utils/format");
const cv2_1 = require("../utils/cv2");
async function handlePlanSelect(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const planName = interaction.values[0];
    const plan = licenses_1.PLANS[planName];
    if (!plan) {
        return interaction.editReply({ content: "❌ Plan inconnu." });
    }
    await user_service_1.UserService.getOrCreate(interaction.user);
    const session = await stripe_service_1.StripeService.createCheckoutSession({
        discordUserId: interaction.user.id,
        guildId: interaction.guildId,
        planName,
    });
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(plan.color ?? cv2_1.ACCENT.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${plan.emoji} Licence ${plan.displayName}`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`**Prix :** ${(0, format_1.formatPrice)(plan.price, plan.currency)}\n` +
        `**Durée :** ${plan.durationDays} jours\n\n` +
        `**Inclus :**\n${plan.features.map((f) => `✓ ${f}`).join("\n")}\n\n` +
        `Cliquez ci-dessous pour procéder au paiement sécurisé.`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# 🔒 Paiement sécurisé par Stripe`));
    const btn = new discord_js_1.ButtonBuilder()
        .setLabel("💳 Payer maintenant")
        .setStyle(discord_js_1.ButtonStyle.Link)
        .setURL(session.url);
    const row = new discord_js_1.ActionRowBuilder().addComponents(btn);
    await interaction.editReply((0, cv2_1.buildReply)([container], [row]));
}
//# sourceMappingURL=plan-select.js.map