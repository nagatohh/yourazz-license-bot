"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const licenses_1 = require("../config/licenses");
const branding_1 = require("../config/branding");
const license_service_1 = require("../modules/licenses/license.service");
const user_service_1 = require("../modules/users/user.service");
const stripe_service_1 = require("../modules/payments/stripe.service");
const premium_embed_1 = require("../utils/premium-embed");
const format_1 = require("../utils/format");
const cv2_1 = require("../utils/cv2");
const permissions_1 = require("../utils/permissions");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("licence")
    .setDescription("Gérer votre licence vendeur")
    .addSubcommand((sub) => sub.setName("acheter").setDescription("Acheter une licence vendeur"))
    .addSubcommand((sub) => sub.setName("statut").setDescription("Voir le statut de votre licence"))
    .addSubcommand((sub) => sub.setName("renouveler").setDescription("Renouveler votre licence"))
    .addSubcommand((sub) => sub.setName("dashboard").setDescription("Votre tableau de bord vendeur"))
    .addSubcommand((sub) => sub.setName("key").setDescription("Voir ou utiliser une clé licence"))
    .addSubcommand((sub) => sub.setName("aide").setDescription("Comment fonctionne le système de licences"));
async function execute(interaction) {
    if (!(0, permissions_1.isSeller)(interaction.member)) {
        return interaction.reply({ ...(0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Accès refusé", "Cette commande est réservée aux vendeurs Yourazz.")]), ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    switch (sub) {
        case "acheter": return handleAcheter(interaction);
        case "statut": return handleStatut(interaction);
        case "renouveler": return handleRenouveler(interaction);
        case "dashboard": return handleDashboard(interaction);
        case "key": return handleKey(interaction);
        case "aide": return handleAide(interaction);
    }
}
async function handleAcheter(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const plan = licenses_1.PLANS.vendeur;
    await user_service_1.UserService.getOrCreate(interaction.user);
    if (!stripe_service_1.StripeService.isConfigured()) {
        const container = (0, cv2_1.successCard)("Licence Vendeur — Yourazz", `Devenez vendeur certifié pour **${(0, format_1.formatPrice)(plan.price, plan.currency)}/mois**\n\n` +
            plan.features.map((f) => `✓ ${f}`).join("\n") +
            `\n\n⚠️ Le paiement Stripe n'est pas encore configuré.\nContactez un administrateur.`);
        return interaction.editReply((0, cv2_1.buildReply)([container]));
    }
    const session = await stripe_service_1.StripeService.createCheckoutSession({
        discordUserId: interaction.user.id,
        guildId: interaction.guildId,
        planName: "vendeur",
    });
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## 🏷️ Licence Vendeur — Yourazz`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`Devenez vendeur certifié pour **${(0, format_1.formatPrice)(plan.price, plan.currency)}/mois**\n\n` +
        plan.features.map((f) => `✓ ${f}`).join("\n") +
        `\n\nCliquez ci-dessous pour procéder au paiement sécurisé.`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# 🔒 Paiement sécurisé par Stripe`));
    const btn = new discord_js_1.ButtonBuilder()
        .setLabel(`💳 Payer ${(0, format_1.formatPrice)(plan.price, plan.currency)}`)
        .setStyle(discord_js_1.ButtonStyle.Link)
        .setURL(session.url);
    const row = new discord_js_1.ActionRowBuilder().addComponents(btn);
    await interaction.editReply((0, cv2_1.buildReply)([container], [row]));
}
async function handleStatut(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const dbUser = await user_service_1.UserService.getOrCreate(interaction.user);
    const license = await license_service_1.LicenseService.getActive(dbUser.id, interaction.guildId);
    if (!license) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.warningCard)("Aucune licence active", "Vous n'avez pas de licence active.\nUtilisez `/licence acheter` pour en obtenir une.")]));
    }
    const remaining = (0, format_1.daysUntil)(license.expiresAt);
    const progress = (0, premium_embed_1.progressBar)(remaining, 30);
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.primary)
        .addSectionComponents(new discord_js_1.SectionBuilder()
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${branding_1.EMOJI.chart} Dashboard Vendeur\n\n` +
        `**${interaction.user.globalName || interaction.user.username}**\n\n` +
        `${branding_1.EMOJI.arrowRight} Plan : ${(0, premium_embed_1.planBadge)()}\n` +
        `${branding_1.EMOJI.arrowRight} Statut : ${(0, premium_embed_1.statusBadge)(license.status)}\n` +
        `${branding_1.EMOJI.arrowRight} Expire le : **${(0, format_1.formatDate)(license.expiresAt)}**\n\n` +
        `${branding_1.EMOJI.clock} **Temps restant**\n${progress} — **${remaining} jours**`))
        .setThumbnailAccessory(new discord_js_1.ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ size: 128 }))))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# ${branding_1.BRANDING.footer}`));
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("yrz_renew").setLabel("Renouveler").setEmoji("🔄").setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId("yrz_panel_support").setLabel("Support").setEmoji("📩").setStyle(discord_js_1.ButtonStyle.Secondary));
    await interaction.editReply((0, cv2_1.buildReply)([container], [row]));
}
async function handleRenouveler(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const dbUser = await user_service_1.UserService.getOrCreate(interaction.user);
    const license = await license_service_1.LicenseService.getActive(dbUser.id, interaction.guildId);
    if (!license) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.warningCard)("Pas de licence", "Vous n'avez pas de licence à renouveler. Utilisez `/licence acheter`.")]));
    }
    if (!stripe_service_1.StripeService.isConfigured()) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.warningCard)("Paiement indisponible", "Le paiement Stripe n'est pas encore configuré. Contactez un administrateur.")]));
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
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`Renouvelez votre licence **${license.plan.displayName}** pour 30 jours supplémentaires.\n\n` +
        `💰 Montant : **${(0, format_1.formatPrice)(license.plan.price, license.plan.currency)}**`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# ${branding_1.BRANDING.footer}`));
    const btn = new discord_js_1.ButtonBuilder().setLabel("💳 Payer maintenant").setStyle(discord_js_1.ButtonStyle.Link).setURL(session.url);
    const row = new discord_js_1.ActionRowBuilder().addComponents(btn);
    await interaction.editReply((0, cv2_1.buildReply)([container], [row]));
}
async function handleDashboard(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const dbUser = await user_service_1.UserService.getOrCreate(interaction.user);
    const licenses = await license_service_1.LicenseService.getByUser(dbUser.id);
    const active = licenses.find((l) => l.status === "ACTIVE");
    const currentLine = active
        ? `${licenses_1.PLANS[active.plan.name]?.emoji ?? ""} **${active.plan.displayName}** — expire ${(0, format_1.formatDate)(active.expiresAt)}`
        : "❌ Aucune licence active";
    const historyLines = licenses.length > 0
        ? licenses.slice(0, 5).map((l) => `${l.status === "ACTIVE" ? "🟢" : "⚫"} ${l.plan.displayName} — ${(0, format_1.formatDate)(l.createdAt)}`).join("\n")
        : "Aucun historique";
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.primary)
        .addSectionComponents(new discord_js_1.SectionBuilder()
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## 📊 Dashboard Vendeur\n\n**Licence actuelle**\n${currentLine}\n\n**Historique**\n${historyLines}`))
        .setThumbnailAccessory(new discord_js_1.ThumbnailBuilder().setURL(interaction.user.displayAvatarURL())))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# ${branding_1.BRANDING.footer}`));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
async function handleKey(interaction) {
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## 🔑 Clés Licence`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("Vous avez une clé licence ? Utilisez le bouton ci-dessous pour l'activer.\n\nFormat : `YRZ-XXXX-XXXX-XXXX`"))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# ${branding_1.BRANDING.footer}`));
    const btn = new discord_js_1.ButtonBuilder().setCustomId("yrz_redeem_key").setLabel("🔑 Activer une clé").setStyle(discord_js_1.ButtonStyle.Success);
    const row = new discord_js_1.ActionRowBuilder().addComponents(btn);
    await interaction.reply({ ...(0, cv2_1.buildReply)([container], [row]), ephemeral: true });
}
async function handleAide(interaction) {
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.info)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ❓ Comment ça marche ?`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("**Yourazz License Manager** gère automatiquement les licences vendeur.\n\n" +
        "**1.** Choisissez un plan avec `/licence acheter`\n" +
        "**2.** Payez via Stripe (CB sécurisé)\n" +
        "**3.** Votre licence est activée instantanément\n" +
        "**4.** Vous recevez le rôle vendeur\n" +
        "**5.** Des rappels sont envoyés avant expiration\n" +
        "**6.** Renouvelez facilement avec `/licence renouveler`"))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("**Commandes disponibles :**\n" +
        "`/licence acheter` — Acheter une licence\n" +
        "`/licence statut` — Voir votre licence\n" +
        "`/licence renouveler` — Renouveler\n" +
        "`/licence dashboard` — Tableau de bord\n" +
        "`/licence key` — Activer une clé\n" +
        "`/key redeem` — Utiliser une clé"))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# Yourazz — Système sécurisé`));
    await interaction.reply({ ...(0, cv2_1.buildReply)([container]), ephemeral: true });
}
//# sourceMappingURL=licence.js.map