import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from "discord.js";
import { EMOJI, BRANDING, THEME } from "../config/branding";
import { cv2Reply, CV2_FLAG, mediaGif } from "../utils/cv2";

export const data = new SlashCommandBuilder()
  .setName("license-panel")
  .setDescription("Afficher le panel de licences premium")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const container = new ContainerBuilder()
    .setAccentColor(THEME.primary)
    .addMediaGalleryComponents(mediaGif("https://cdn.discordapp.com/attachments/1513986663636926565/1514030873916342413/ezgif-22a76ce7a3afa8d0.gif?ex=6a29e2a1&is=6a289121&hm=027bb5279ac83a57819887cabf928ef0e4173292c5f512c887b4de0dae1d2dc4"))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## ${EMOJI.rocket} Yourazz License Manager`),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `Devenez **vendeur certifié** et accédez à tout l'écosystème Yourazz.\n\n` +
        `${EMOJI.arrowRight} ${EMOJI.lock} Paiement sécurisé via Stripe\n` +
        `${EMOJI.arrowRight} ${EMOJI.bolt} Attribution automatique du rôle\n` +
        `${EMOJI.arrowRight} ${EMOJI.shield} Licence vérifiée et protégée\n` +
        `${EMOJI.arrowRight} ${EMOJI.star} Accès à toutes les fonctionnalités`,
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${BRANDING.footer}`));

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("yrz_panel_payment")
      .setLabel("Paiement")
      .setEmoji("💳")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("yrz_panel_crypto")
      .setLabel("Crypto")
      .setEmoji("🪙")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("yrz_panel_dashboard")
      .setLabel("Mon Dashboard")
      .setEmoji("📊")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("yrz_panel_language")
      .setLabel("Langue")
      .setEmoji("🌍")
      .setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("yrz_panel_help")
      .setLabel("Aide")
      .setEmoji("❓")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("yrz_panel_support")
      .setLabel("Support")
      .setEmoji("📩")
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.reply({ content: `${EMOJI.check} Panel envoyé.`, ephemeral: true });
  if (interaction.channel && "send" in interaction.channel) {
    await interaction.channel.send(cv2Reply({ components: [container, row1, row2] }));
  }
}
