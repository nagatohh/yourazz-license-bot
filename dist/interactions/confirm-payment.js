"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConfirmPayment = handleConfirmPayment;
const discord_js_1 = require("discord.js");
const stripe_1 = require("../config/stripe");
const payment_service_1 = require("../modules/payments/payment.service");
const database_1 = require("../services/database");
const branding_1 = require("../config/branding");
const cv2_1 = require("../utils/cv2");
const logger_1 = require("../utils/logger");
async function handleConfirmPayment(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sessionId = interaction.customId.replace("yrz_confirm_payment_", "");
    try {
        // Step 1 — checking
        const checking = new discord_js_1.ContainerBuilder()
            .setAccentColor(cv2_1.ACCENT.warning)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`${branding_1.EMOJI.yellowCircle} **Vérification en cours...**\n\n${branding_1.EMOJI.clock} Connexion à Stripe...`));
        await interaction.editReply((0, cv2_1.buildReply)([checking]));
        const session = await stripe_1.stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status !== "paid") {
            const container = new discord_js_1.ContainerBuilder()
                .setAccentColor(cv2_1.ACCENT.warning)
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${branding_1.EMOJI.clock} Paiement non détecté`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`Nous n'avons pas encore reçu votre paiement.\n\n` +
                `${branding_1.EMOJI.arrowRight} Si vous venez de payer, **attendez quelques secondes** et réessayez.\n` +
                `${branding_1.EMOJI.arrowRight} Si vous n'avez pas encore payé, cliquez d'abord sur **"💳 Payer"**.`));
            return interaction.editReply((0, cv2_1.buildReply)([container]));
        }
        const existing = await database_1.prisma.stripeWebhookEvent.findUnique({
            where: { stripeEventId: session.id },
        });
        if (existing?.processed) {
            const container = new discord_js_1.ContainerBuilder()
                .setAccentColor(cv2_1.ACCENT.success)
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${branding_1.EMOJI.check} Déjà activé`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`Votre licence est **déjà active** !\n\nUtilisez \`/licence statut\` ou cliquez sur **${branding_1.EMOJI.chart} Dashboard** pour voir les détails.`));
            return interaction.editReply((0, cv2_1.buildReply)([container]));
        }
        await database_1.prisma.stripeWebhookEvent.upsert({
            where: { stripeEventId: session.id },
            update: {},
            create: { stripeEventId: session.id, type: "checkout.session.completed" },
        });
        await payment_service_1.PaymentService.handleCheckoutCompleted(interaction.client, session.id, session.payment_intent, session.metadata, session.amount_total, session.currency?.toUpperCase() ?? "EUR");
        await database_1.prisma.stripeWebhookEvent.update({
            where: { stripeEventId: session.id },
            data: { processed: true },
        });
        const container = new discord_js_1.ContainerBuilder()
            .setAccentColor(cv2_1.ACCENT.success)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${branding_1.EMOJI.sparkle} Paiement confirmé !`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`${branding_1.EMOJI.check} Paiement vérifié\n` +
            `${branding_1.EMOJI.check} Licence activée\n` +
            `${branding_1.EMOJI.check} Rôle vendeur attribué\n\n` +
            `Bienvenue parmi les vendeurs Yourazz ! ${branding_1.EMOJI.fire}\n\n` +
            `*Consultez vos DMs pour le récapitulatif complet.*`))
            .addMediaGalleryComponents((0, cv2_1.mediaGif)(branding_1.BRANDING.successBannerUrl))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# ${branding_1.BRANDING.footer}`));
        await interaction.editReply((0, cv2_1.buildReply)([container]));
        logger_1.logger.info("ConfirmPayment", `Paiement confirmé par ${interaction.user.id}`);
    }
    catch (err) {
        logger_1.logger.error("ConfirmPayment", `Erreur: ${err.message}`);
        const container = new discord_js_1.ContainerBuilder()
            .setAccentColor(cv2_1.ACCENT.error)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${branding_1.EMOJI.cross} Erreur`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("Impossible de vérifier le paiement.\nRéessayez dans quelques instants.\n\nSi le problème persiste, contactez le support."));
        await interaction.editReply((0, cv2_1.buildReply)([container]));
    }
}
//# sourceMappingURL=confirm-payment.js.map