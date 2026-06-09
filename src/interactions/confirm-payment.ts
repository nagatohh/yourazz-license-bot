import {
  ButtonInteraction,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from "discord.js";
import { stripe } from "../config/stripe";
import { PaymentService } from "../modules/payments/payment.service";
import { prisma } from "../services/database";
import { EMOJI, BRANDING } from "../config/branding";
import { buildReply, ACCENT, mediaGif } from "../utils/cv2";
import { logger } from "../utils/logger";

export async function handleConfirmPayment(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const sessionId = interaction.customId.replace("yrz_confirm_payment_", "");

  try {
    // Step 1 — checking
    const checking = new ContainerBuilder()
      .setAccentColor(ACCENT.warning)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${EMOJI.yellowCircle} **Vérification en cours...**\n\n${EMOJI.clock} Connexion à Stripe...`),
      );
    await interaction.editReply(buildReply([checking]));

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      const container = new ContainerBuilder()
        .setAccentColor(ACCENT.warning)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${EMOJI.clock} Paiement non détecté`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `Nous n'avons pas encore reçu votre paiement.\n\n` +
            `${EMOJI.arrowRight} Si vous venez de payer, **attendez quelques secondes** et réessayez.\n` +
            `${EMOJI.arrowRight} Si vous n'avez pas encore payé, cliquez d'abord sur **"💳 Payer"**.`,
          ),
        );
      return interaction.editReply(buildReply([container]));
    }

    const existing = await prisma.stripeWebhookEvent.findUnique({
      where: { stripeEventId: session.id },
    });

    if (existing?.processed) {
      const container = new ContainerBuilder()
        .setAccentColor(ACCENT.success)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${EMOJI.check} Déjà activé`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `Votre licence est **déjà active** !\n\nUtilisez \`/licence statut\` ou cliquez sur **${EMOJI.chart} Dashboard** pour voir les détails.`,
          ),
        );
      return interaction.editReply(buildReply([container]));
    }

    await prisma.stripeWebhookEvent.upsert({
      where: { stripeEventId: session.id },
      update: {},
      create: { stripeEventId: session.id, type: "checkout.session.completed" },
    });

    await PaymentService.handleCheckoutCompleted(
      interaction.client,
      session.id,
      session.payment_intent as string,
      session.metadata as any,
      session.amount_total!,
      session.currency?.toUpperCase() ?? "EUR",
    );

    await prisma.stripeWebhookEvent.update({
      where: { stripeEventId: session.id },
      data: { processed: true },
    });

    const container = new ContainerBuilder()
      .setAccentColor(ACCENT.success)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${EMOJI.sparkle} Paiement confirmé !`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${EMOJI.check} Paiement vérifié\n` +
          `${EMOJI.check} Licence activée\n` +
          `${EMOJI.check} Rôle vendeur attribué\n\n` +
          `Bienvenue parmi les vendeurs Yourazz ! ${EMOJI.fire}\n\n` +
          `*Consultez vos DMs pour le récapitulatif complet.*`,
        ),
      )
      .addMediaGalleryComponents(mediaGif(BRANDING.successBannerUrl))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${BRANDING.footer}`));

    await interaction.editReply(buildReply([container]));

    logger.info("ConfirmPayment", `Paiement confirmé par ${interaction.user.id}`);
  } catch (err: any) {
    logger.error("ConfirmPayment", `Erreur: ${err.message}`);
    const container = new ContainerBuilder()
      .setAccentColor(ACCENT.error)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${EMOJI.cross} Erreur`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "Impossible de vérifier le paiement.\nRéessayez dans quelques instants.\n\nSi le problème persiste, contactez le support.",
        ),
      );
    await interaction.editReply(buildReply([container]));
  }
}
