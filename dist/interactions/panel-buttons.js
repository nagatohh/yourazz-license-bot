"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePanelButton = handlePanelButton;
const discord_js_1 = require("discord.js");
const licenses_1 = require("../config/licenses");
const branding_1 = require("../config/branding");
const bot_1 = require("../config/bot");
const stripe_service_1 = require("../modules/payments/stripe.service");
const license_service_1 = require("../modules/licenses/license.service");
const user_service_1 = require("../modules/users/user.service");
const premium_embed_1 = require("../utils/premium-embed");
const format_1 = require("../utils/format");
const cv2_1 = require("../utils/cv2");
async function handlePanelButton(interaction) {
    const id = interaction.customId;
    if (id === "yrz_panel_payment")
        return handlePayment(interaction);
    if (id === "yrz_panel_crypto")
        return handleCrypto(interaction);
    if (id === "yrz_panel_dashboard")
        return handleDashboard(interaction);
    if (id === "yrz_panel_language")
        return handleLanguage(interaction);
    if (id === "yrz_panel_help")
        return handleHelp(interaction);
    if (id === "yrz_panel_support")
        return handleSupport(interaction);
}
async function handlePayment(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const plan = licenses_1.PLANS.vendeur;
    await user_service_1.UserService.getOrCreate(interaction.user);
    if (!stripe_service_1.StripeService.isConfigured()) {
        const container = new discord_js_1.ContainerBuilder()
            .setAccentColor(cv2_1.ACCENT.warning)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${branding_1.EMOJI.warning} Paiement indisponible`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("Le système de paiement n'est pas encore configuré.\nContactez un administrateur."));
        return interaction.editReply((0, cv2_1.buildReply)([container]));
    }
    const session = await stripe_service_1.StripeService.createCheckoutSession({
        discordUserId: interaction.user.id,
        guildId: interaction.guildId,
        planName: "vendeur",
    });
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${branding_1.EMOJI.tag} Licence Vendeur Yourazz`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`${branding_1.EMOJI.fire} **Offre Vendeur** — ${(0, format_1.formatPrice)(plan.price, plan.currency)}/mois\n\n` +
        `${branding_1.EMOJI.check} Accès vendeur complet\n` +
        `${branding_1.EMOJI.check} Produits illimités\n` +
        `${branding_1.EMOJI.check} Licence 30 jours\n` +
        `${branding_1.EMOJI.check} Support prioritaire\n\n` +
        `${branding_1.EMOJI.lock} *Paiement sécurisé par Stripe*\n` +
        `*Après paiement, cliquez sur "Confirmer" pour activer votre licence.*`))
        .addMediaGalleryComponents((0, cv2_1.mediaGif)(branding_1.BRANDING.paymentBannerUrl))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# ${branding_1.BRANDING.footer}`));
    const payBtn = new discord_js_1.ButtonBuilder()
        .setLabel("Payer " + (0, format_1.formatPrice)(plan.price, plan.currency))
        .setEmoji("💳")
        .setStyle(discord_js_1.ButtonStyle.Link)
        .setURL(session.url);
    const confirmBtn = new discord_js_1.ButtonBuilder()
        .setCustomId(`yrz_confirm_payment_${session.id}`)
        .setLabel("Confirmer paiement")
        .setEmoji("✅")
        .setStyle(discord_js_1.ButtonStyle.Success);
    const row = new discord_js_1.ActionRowBuilder().addComponents(payBtn, confirmBtn);
    await interaction.editReply((0, cv2_1.buildReply)([container], [row]));
}
async function handleCrypto(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const wallets = [];
    if (bot_1.env.CRYPTO_WALLET_LTC)
        wallets.push(`**LTC :** \`${bot_1.env.CRYPTO_WALLET_LTC}\``);
    if (bot_1.env.CRYPTO_WALLET_BTC)
        wallets.push(`**BTC :** \`${bot_1.env.CRYPTO_WALLET_BTC}\``);
    if (bot_1.env.CRYPTO_WALLET_ETH)
        wallets.push(`**ETH :** \`${bot_1.env.CRYPTO_WALLET_ETH}\``);
    if (wallets.length === 0) {
        const container = new discord_js_1.ContainerBuilder()
            .setAccentColor(cv2_1.ACCENT.warning)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ₿ Paiement Crypto`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("Le paiement crypto n'est pas encore configuré.\nContactez un administrateur."));
        return interaction.editReply((0, cv2_1.buildReply)([container]));
    }
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ₿ Paiement Crypto — Licence Vendeur`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`${branding_1.EMOJI.fire} **Offre Vendeur** — 25€ (équivalent crypto)\n\n` +
        `### 📋 Étapes :\n` +
        `**1.** Envoyez l'équivalent de **25€** à l'une des adresses ci-dessous\n` +
        `**2.** Envoyez une capture de la transaction à un admin\n` +
        `**3.** Un admin vous fournira une **clé d'activation**\n` +
        `**4.** Utilisez \`/key redeem <clé>\` ou le bouton 🔑 pour activer\n\n` +
        `### 💰 Adresses wallet :\n` +
        wallets.join("\n") +
        `\n\n### ⚠️ Important :\n` +
        `▸ Envoyez le montant **exact** en équivalent EUR\n` +
        `▸ Conservez votre preuve de transaction\n` +
        `▸ La clé sera fournie après vérification par un admin`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# ${branding_1.BRANDING.footer}`));
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("yrz_redeem_key")
        .setLabel("Activer une clé")
        .setEmoji("🔑")
        .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
        .setCustomId("yrz_panel_support")
        .setLabel("Contacter un admin")
        .setEmoji("📩")
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    await interaction.editReply((0, cv2_1.buildReply)([container], [row]));
}
async function handleDashboard(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const dbUser = await user_service_1.UserService.getOrCreate(interaction.user);
    const license = await license_service_1.LicenseService.getActive(dbUser.id, interaction.guildId);
    if (!license) {
        const container = new discord_js_1.ContainerBuilder()
            .setAccentColor(cv2_1.ACCENT.warning)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${branding_1.EMOJI.chart} Dashboard`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`Vous n'avez pas encore de licence active.\n\nCliquez sur **${branding_1.EMOJI.card} Paiement** pour devenir vendeur.`));
        return interaction.editReply((0, cv2_1.buildReply)([container]));
    }
    const remaining = (0, format_1.daysUntil)(license.expiresAt);
    const progress = (0, premium_embed_1.progressBar)(remaining, 30);
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.primary)
        .addMediaGalleryComponents((0, cv2_1.mediaGif)(branding_1.BRANDING.dashboardBannerUrl))
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
async function handleLanguage(interaction) {
    const select = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId("yrz_lang_select")
        .setPlaceholder("Choisir / Choose / Elegir")
        .addOptions({ label: "Français", value: "fr", emoji: "🇫🇷", description: "Langue française" }, { label: "English", value: "en", emoji: "🇬🇧", description: "English language" }, { label: "Español", value: "es", emoji: "🇪🇸", description: "Idioma español" });
    const row = new discord_js_1.ActionRowBuilder().addComponents(select);
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.info)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${branding_1.EMOJI.globe} Choisir la langue`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("Sélectionnez votre langue préférée.\nTous les messages du bot seront traduits."))
        .addActionRowComponents(row);
    await interaction.reply({ ...(0, cv2_1.buildReply)([container]), ephemeral: true });
}
async function handleHelp(interaction) {
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.info)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${branding_1.EMOJI.help} Centre d'aide`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`**${branding_1.EMOJI.card} Comment acheter une licence ?**\nCliquez sur Paiement → Payez via Stripe → Confirmez → C'est fait !\n\n` +
        `**${branding_1.EMOJI.chart} Comment voir mon dashboard ?**\nCliquez sur "Mon Dashboard" ou tapez \`/licence dashboard\`\n\n` +
        `**🔄 Comment renouveler ?**\nDashboard → Renouveler, ou tapez \`/licence renouveler\`\n\n` +
        `**${branding_1.EMOJI.mail} Besoin d'aide ?**\nCliquez sur Support pour contacter l'équipe.`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("**Commandes disponibles :**\n" +
        "`/licence statut` — Statut de votre licence\n" +
        "`/licence dashboard` — Votre tableau de bord\n" +
        "`/licence renouveler` — Renouveler\n" +
        "`/key redeem` — Activer une clé licence"));
    await interaction.reply({ ...(0, cv2_1.buildReply)([container]), ephemeral: true });
}
async function handleSupport(interaction) {
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${branding_1.EMOJI.mail} Support Yourazz`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`${branding_1.EMOJI.sparkle} **Besoin d'aide ?**\n\n` +
        `Notre équipe est disponible pour vous aider.\n\n` +
        `${branding_1.EMOJI.arrowRight} Problème de paiement\n` +
        `${branding_1.EMOJI.arrowRight} Question sur votre licence\n` +
        `${branding_1.EMOJI.arrowRight} Bug ou erreur technique\n` +
        `${branding_1.EMOJI.arrowRight} Autre demande\n\n` +
        `Contactez un administrateur ou ouvrez un ticket.`))
        .addMediaGalleryComponents((0, cv2_1.mediaGif)("https://cdn.discordapp.com/attachments/1513986663636926565/1514031473462739024/ezgif-2146a2e1b3da616d.gif?ex=6a29e330&is=6a2891b0&hm=6c0cece2e5218563dfe11c5a3066d7e6ff064eaeeec1a0b7b44d5096fa74cd92&"));
    await interaction.reply({ ...(0, cv2_1.buildReply)([container]), ephemeral: true });
}
//# sourceMappingURL=panel-buttons.js.map