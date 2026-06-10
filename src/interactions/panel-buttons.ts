import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from "discord.js";
import { PLANS } from "../config/licenses";
import { BRANDING, THEME, EMOJI } from "../config/branding";
import { StripeService } from "../modules/payments/stripe.service";
import { LicenseService } from "../modules/licenses/license.service";
import { UserService } from "../modules/users/user.service";
import { progressBar, statusBadge, planBadge } from "../utils/premium-embed";
import { formatPrice, formatDate, daysUntil } from "../utils/format";
import { buildReply, ACCENT, mediaGif } from "../utils/cv2";

export async function handlePanelButton(interaction: ButtonInteraction) {
  const id = interaction.customId;

  if (id === "yrz_panel_payment") return handlePayment(interaction);
  if (id === "yrz_panel_dashboard") return handleDashboard(interaction);
  if (id === "yrz_panel_language") return handleLanguage(interaction);
  if (id === "yrz_panel_help") return handleHelp(interaction);
  if (id === "yrz_panel_support") return handleSupport(interaction);
}

async function handlePayment(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const plan = PLANS.vendeur;
  await UserService.getOrCreate(interaction.user);

  if (!StripeService.isConfigured()) {
    const container = new ContainerBuilder()
      .setAccentColor(ACCENT.warning)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${EMOJI.warning} Paiement indisponible`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("Le système de paiement n'est pas encore configuré.\nContactez un administrateur."),
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
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${EMOJI.tag} Licence Vendeur Yourazz`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${EMOJI.fire} **Offre Vendeur** — ${formatPrice(plan.price, plan.currency)}/mois\n\n` +
        `${EMOJI.check} Accès vendeur complet\n` +
        `${EMOJI.check} Produits illimités\n` +
        `${EMOJI.check} Licence 30 jours\n` +
        `${EMOJI.check} Support prioritaire\n\n` +
        `${EMOJI.lock} *Paiement sécurisé par Stripe*\n` +
        `*Après paiement, cliquez sur "Confirmer" pour activer votre licence.*`,
      ),
    )
    .addMediaGalleryComponents(mediaGif(BRANDING.paymentBannerUrl))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${BRANDING.footer}`));

  const payBtn = new ButtonBuilder()
    .setLabel("Payer " + formatPrice(plan.price, plan.currency))
    .setEmoji("💳")
    .setStyle(ButtonStyle.Link)
    .setURL(session.url!);

  const confirmBtn = new ButtonBuilder()
    .setCustomId(`yrz_confirm_payment_${session.id}`)
    .setLabel("Confirmer paiement")
    .setEmoji("✅")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(payBtn, confirmBtn);

  await interaction.editReply(buildReply([container], [row]));
}

async function handleDashboard(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const dbUser = await UserService.getOrCreate(interaction.user);
  const license = await LicenseService.getActive(dbUser.id, interaction.guildId!);

  if (!license) {
    const container = new ContainerBuilder()
      .setAccentColor(ACCENT.warning)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${EMOJI.chart} Dashboard`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Vous n'avez pas encore de licence active.\n\nCliquez sur **${EMOJI.card} Paiement** pour devenir vendeur.`,
        ),
      );
    return interaction.editReply(buildReply([container]));
  }

  const remaining = daysUntil(license.expiresAt);
  const progress = progressBar(remaining, 30);

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.primary)
    .addMediaGalleryComponents(mediaGif(BRANDING.dashboardBannerUrl))
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

async function handleLanguage(interaction: ButtonInteraction) {
  const select = new StringSelectMenuBuilder()
    .setCustomId("yrz_lang_select")
    .setPlaceholder("Choisir / Choose / Elegir")
    .addOptions(
      { label: "Français", value: "fr", emoji: "🇫🇷", description: "Langue française" },
      { label: "English", value: "en", emoji: "🇬🇧", description: "English language" },
      { label: "Español", value: "es", emoji: "🇪🇸", description: "Idioma español" },
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.info)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${EMOJI.globe} Choisir la langue`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "Sélectionnez votre langue préférée.\nTous les messages du bot seront traduits.",
      ),
    )
    .addActionRowComponents(row);

  await interaction.reply({ ...buildReply([container]), ephemeral: true });
}

async function handleHelp(interaction: ButtonInteraction) {
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.info)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${EMOJI.help} Centre d'aide`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**${EMOJI.card} Comment acheter une licence ?**\nCliquez sur Paiement → Payez via Stripe → Confirmez → C'est fait !\n\n` +
        `**${EMOJI.chart} Comment voir mon dashboard ?**\nCliquez sur "Mon Dashboard" ou tapez \`/licence dashboard\`\n\n` +
        `**🔄 Comment renouveler ?**\nDashboard → Renouveler, ou tapez \`/licence renouveler\`\n\n` +
        `**${EMOJI.mail} Besoin d'aide ?**\nCliquez sur Support pour contacter l'équipe.`,
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "**Commandes disponibles :**\n" +
        "`/licence statut` — Statut de votre licence\n" +
        "`/licence dashboard` — Votre tableau de bord\n" +
        "`/licence renouveler` — Renouveler\n" +
        "`/key redeem` — Activer une clé licence",
      ),
    );

  await interaction.reply({ ...buildReply([container]), ephemeral: true });
}

async function handleSupport(interaction: ButtonInteraction) {
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.primary)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${EMOJI.mail} Support Yourazz`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${EMOJI.sparkle} **Besoin d'aide ?**\n\n` +
        `Notre équipe est disponible pour vous aider.\n\n` +
        `${EMOJI.arrowRight} Problème de paiement\n` +
        `${EMOJI.arrowRight} Question sur votre licence\n` +
        `${EMOJI.arrowRight} Bug ou erreur technique\n` +
        `${EMOJI.arrowRight} Autre demande\n\n` +
        `Contactez un administrateur ou ouvrez un ticket.`,
      ),
    )
    .addMediaGalleryComponents(mediaGif("https://cdn.discordapp.com/attachments/1513986663636926565/1514031473462739024/ezgif-2146a2e1b3da616d.gif?ex=6a29e330&is=6a2891b0&hm=6c0cece2e5218563dfe11c5a3066d7e6ff064eaeeec1a0b7b44d5096fa74cd92&"));

  await interaction.reply({ ...buildReply([container]), ephemeral: true });
}
