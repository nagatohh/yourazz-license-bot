import {
  StringSelectMenuInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from "discord.js";
import { PLANS } from "../config/licenses";
import { StripeService } from "../modules/payments/stripe.service";
import { UserService } from "../modules/users/user.service";
import { formatPrice } from "../utils/format";
import { buildReply, ACCENT } from "../utils/cv2";

export async function handlePlanSelect(interaction: StringSelectMenuInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const planName = interaction.values[0];
  const plan = PLANS[planName];
  if (!plan) {
    return interaction.editReply({ content: "❌ Plan inconnu." });
  }

  await UserService.getOrCreate(interaction.user);

  const session = await StripeService.createCheckoutSession({
    discordUserId: interaction.user.id,
    guildId: interaction.guildId!,
    planName,
  });

  const container = new ContainerBuilder()
    .setAccentColor(plan.color ?? ACCENT.primary)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${plan.emoji} Licence ${plan.displayName}`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Prix :** ${formatPrice(plan.price, plan.currency)}\n` +
        `**Durée :** ${plan.durationDays} jours\n\n` +
        `**Inclus :**\n${plan.features.map((f: string) => `✓ ${f}`).join("\n")}\n\n` +
        `Cliquez ci-dessous pour procéder au paiement sécurisé.`,
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# 🔒 Paiement sécurisé par Stripe`));

  const btn = new ButtonBuilder()
    .setLabel("💳 Payer maintenant")
    .setStyle(ButtonStyle.Link)
    .setURL(session.url!);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn);

  await interaction.editReply(buildReply([container], [row]));
}
