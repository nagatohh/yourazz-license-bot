import {
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from "discord.js";
import { StripeService } from "../modules/payments/stripe.service";
import { LicenseService } from "../modules/licenses/license.service";
import { UserService } from "../modules/users/user.service";
import { errorCard, buildReply, ACCENT } from "../utils/cv2";
import { formatPrice } from "../utils/format";
import { BRANDING } from "../config/branding";

export async function handleButton(interaction: ButtonInteraction) {
  const id = interaction.customId;

  if (id === "yrz_renew") return handleRenew(interaction);
  if (id === "yrz_redeem_key") return showRedeemModal(interaction);
}

async function handleRenew(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const dbUser = await UserService.getOrCreate(interaction.user);
  const license = await LicenseService.getActive(dbUser.id, interaction.guildId!);

  if (!license) {
    return interaction.editReply(buildReply([errorCard("Pas de licence", "Aucune licence à renouveler.")]));
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
        `Renouvelez votre licence **${license.plan.displayName}**\n\n💰 **${formatPrice(license.plan.price, license.plan.currency)}**`,
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${BRANDING.footer}`));

  const btn = new ButtonBuilder().setLabel(`💳 Payer ${formatPrice(license.plan.price, license.plan.currency)}`).setStyle(ButtonStyle.Link).setURL(session.url!);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn);

  await interaction.editReply(buildReply([container], [row]));
}

async function showRedeemModal(interaction: ButtonInteraction) {
  const modal = new ModalBuilder()
    .setCustomId("yrz_redeem_modal")
    .setTitle("🔑 Activer une clé licence");

  const input = new TextInputBuilder()
    .setCustomId("key_input")
    .setLabel("Votre clé licence")
    .setPlaceholder("YRZ-XXXX-XXXX-XXXX")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(17)
    .setMaxLength(19);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
  await interaction.showModal(modal);
}
