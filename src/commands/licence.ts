import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from "discord.js";
import { PLANS } from "../config/licenses";
import { EMOJI, THEME, BRANDING } from "../config/branding";
import { LicenseService } from "../modules/licenses/license.service";
import { UserService } from "../modules/users/user.service";
import { StripeService } from "../modules/payments/stripe.service";
import { progressBar, statusBadge, planBadge } from "../utils/premium-embed";
import { formatPrice, formatDate, daysUntil } from "../utils/format";
import { successCard, warningCard, errorCard, primaryCard, buildReply, cv2Reply, ACCENT } from "../utils/cv2";
import { isSeller } from "../utils/permissions";
import { GuildMember } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("licence")
  .setDescription("Gérer votre licence vendeur")
  .addSubcommand((sub) =>
    sub.setName("acheter").setDescription("Acheter une licence vendeur"),
  )
  .addSubcommand((sub) =>
    sub.setName("statut").setDescription("Voir le statut de votre licence"),
  )
  .addSubcommand((sub) =>
    sub.setName("renouveler").setDescription("Renouveler votre licence"),
  )
  .addSubcommand((sub) =>
    sub.setName("dashboard").setDescription("Votre tableau de bord vendeur"),
  )
  .addSubcommand((sub) =>
    sub.setName("key").setDescription("Voir ou utiliser une clé licence"),
  )
  .addSubcommand((sub) =>
    sub.setName("aide").setDescription("Comment fonctionne le système de licences"),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!isSeller(interaction.member as GuildMember)) {
    return interaction.reply({ ...buildReply([errorCard("Accès refusé", "Cette commande est réservée aux vendeurs Yourazz.")]), ephemeral: true });
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

async function handleAcheter(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const plan = PLANS.vendeur;
  await UserService.getOrCreate(interaction.user);

  if (!StripeService.isConfigured()) {
    const container = successCard(
      "Licence Vendeur — Yourazz",
      `Devenez vendeur certifié pour **${formatPrice(plan.price, plan.currency)}/mois**\n\n` +
      plan.features.map((f) => `✓ ${f}`).join("\n") +
      `\n\n⚠️ Le paiement Stripe n'est pas encore configuré.\nContactez un administrateur.`,
    );
    return interaction.editReply(buildReply([container]));
  }

  const session = await StripeService.createCheckoutSession({
    discordUserId: interaction.user.id,
    guildId: interaction.guildId!,
    planName: "vendeur",
  });

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.primary)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🏷️ Licence Vendeur — Yourazz`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `Devenez vendeur certifié pour **${formatPrice(plan.price, plan.currency)}/mois**\n\n` +
        plan.features.map((f) => `✓ ${f}`).join("\n") +
        `\n\nCliquez ci-dessous pour procéder au paiement sécurisé.`,
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# 🔒 Paiement sécurisé par Stripe`));

  const btn = new ButtonBuilder()
    .setLabel(`💳 Payer ${formatPrice(plan.price, plan.currency)}`)
    .setStyle(ButtonStyle.Link)
    .setURL(session.url!);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn);

  await interaction.editReply(buildReply([container], [row]));
}

async function handleStatut(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const dbUser = await UserService.getOrCreate(interaction.user);
  const license = await LicenseService.getActive(dbUser.id, interaction.guildId!);

  if (!license) {
    return interaction.editReply(buildReply([warningCard(
      "Aucune licence active",
      "Vous n'avez pas de licence active.\nUtilisez `/licence acheter` pour en obtenir une.",
    )]));
  }

  const remaining = daysUntil(license.expiresAt);
  const progress = progressBar(remaining, 30);

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.primary)
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## ${EMOJI.chart} Dashboard Vendeur\n\n` +
            `**${interaction.user.globalName || interaction.user.username}**\n\n` +
            `${EMOJI.arrowRight} Plan : ${planBadge()}\n` +
            `${EMOJI.arrowRight} Statut : ${statusBadge(license.status)}\n` +
            `${EMOJI.arrowRight} Expire le : **${formatDate(license.expiresAt)}**\n\n` +
            `${EMOJI.clock} **Temps restant**\n${progress} — **${remaining} jours**`,
          ),
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL({ size: 128 })),
        ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${BRANDING.footer}`));

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("yrz_renew").setLabel("Renouveler").setEmoji("🔄").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("yrz_panel_support").setLabel("Support").setEmoji("📩").setStyle(ButtonStyle.Secondary),
  );

  await interaction.editReply(buildReply([container], [row]));
}

async function handleRenouveler(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const dbUser = await UserService.getOrCreate(interaction.user);
  const license = await LicenseService.getActive(dbUser.id, interaction.guildId!);

  if (!license) {
    return interaction.editReply(buildReply([warningCard("Pas de licence", "Vous n'avez pas de licence à renouveler. Utilisez `/licence acheter`.")]));
  }

  if (!StripeService.isConfigured()) {
    return interaction.editReply(buildReply([warningCard("Paiement indisponible", "Le paiement Stripe n'est pas encore configuré. Contactez un administrateur.")]));
  }

  const session = await StripeService.createCheckoutSession({
    discordUserId: interaction.user.id,
    guildId: interaction.guildId!,
    planName: license.plan.name,
  });

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.primary)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🔄 Renouvellement`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `Renouvelez votre licence **${license.plan.displayName}** pour 30 jours supplémentaires.\n\n` +
        `💰 Montant : **${formatPrice(license.plan.price, license.plan.currency)}**`,
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${BRANDING.footer}`));

  const btn = new ButtonBuilder().setLabel("💳 Payer maintenant").setStyle(ButtonStyle.Link).setURL(session.url!);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn);

  await interaction.editReply(buildReply([container], [row]));
}

async function handleDashboard(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const dbUser = await UserService.getOrCreate(interaction.user);
  const licenses = await LicenseService.getByUser(dbUser.id);
  const active = licenses.find((l) => l.status === "ACTIVE");

  const currentLine = active
    ? `${PLANS[active.plan.name]?.emoji ?? ""} **${active.plan.displayName}** — expire ${formatDate(active.expiresAt)}`
    : "❌ Aucune licence active";

  const historyLines = licenses.length > 0
    ? licenses.slice(0, 5).map((l) => `${l.status === "ACTIVE" ? "🟢" : "⚫"} ${l.plan.displayName} — ${formatDate(l.createdAt)}`).join("\n")
    : "Aucun historique";

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.primary)
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## 📊 Dashboard Vendeur\n\n**Licence actuelle**\n${currentLine}\n\n**Historique**\n${historyLines}`,
          ),
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(interaction.user.displayAvatarURL()),
        ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${BRANDING.footer}`));

  await interaction.editReply(buildReply([container]));
}

async function handleKey(interaction: ChatInputCommandInteraction) {
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.primary)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🔑 Clés Licence`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "Vous avez une clé licence ? Utilisez le bouton ci-dessous pour l'activer.\n\nFormat : `YRZ-XXXX-XXXX-XXXX`",
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${BRANDING.footer}`));

  const btn = new ButtonBuilder().setCustomId("yrz_redeem_key").setLabel("🔑 Activer une clé").setStyle(ButtonStyle.Success);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn);

  await interaction.reply({ ...buildReply([container], [row]), ephemeral: true });
}

async function handleAide(interaction: ChatInputCommandInteraction) {
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.info)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ❓ Comment ça marche ?`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "**Yourazz License Manager** gère automatiquement les licences vendeur.\n\n" +
        "**1.** Choisissez un plan avec `/licence acheter`\n" +
        "**2.** Payez via Stripe (CB sécurisé)\n" +
        "**3.** Votre licence est activée instantanément\n" +
        "**4.** Vous recevez le rôle vendeur\n" +
        "**5.** Des rappels sont envoyés avant expiration\n" +
        "**6.** Renouvelez facilement avec `/licence renouveler`",
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "**Commandes disponibles :**\n" +
        "`/licence acheter` — Acheter une licence\n" +
        "`/licence statut` — Voir votre licence\n" +
        "`/licence renouveler` — Renouveler\n" +
        "`/licence dashboard` — Tableau de bord\n" +
        "`/licence key` — Activer une clé\n" +
        "`/key redeem` — Utiliser une clé",
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Yourazz — Système sécurisé`));

  await interaction.reply({ ...buildReply([container]), ephemeral: true });
}
