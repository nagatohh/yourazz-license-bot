import {
  Client,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from "discord.js";
import { EMOJI, BRANDING, THEME } from "../../config/branding";
import { formatDate } from "../../utils/format";
import { buildReply, ACCENT, CV2_FLAG, mediaGif } from "../../utils/cv2";
import { logger } from "../../utils/logger";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AnimationService {
  static async sendActivationAnimation(
    client: Client,
    discordUserId: string,
    license: any,
    lang = "fr",
  ) {
    try {
      const user = await client.users.fetch(discordUserId);
      const dm = await user.createDM();

      // Step 1 — Verifying
      const step1 = new ContainerBuilder()
        .setAccentColor(ACCENT.warning)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${EMOJI.yellowCircle} **Vérification du paiement...**\n\n${EMOJI.clock} Veuillez patienter...`,
          ),
        );
      const msg = await dm.send(buildReply([step1]));

      await sleep(1500);

      // Step 2 — Activating
      const step2 = new ContainerBuilder()
        .setAccentColor(ACCENT.info)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${EMOJI.check} Paiement vérifié\n` +
            `${EMOJI.yellowCircle} **Activation de la licence...**\n\n${EMOJI.clock} Presque terminé...`,
          ),
        );
      await msg.edit(buildReply([step2]));

      await sleep(1500);

      // Step 3 — Assigning role
      const step3 = new ContainerBuilder()
        .setAccentColor(ACCENT.info)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${EMOJI.check} Paiement vérifié\n` +
            `${EMOJI.check} Licence activée\n` +
            `${EMOJI.yellowCircle} **Attribution du rôle vendeur...**\n\n${EMOJI.bolt} Dernière étape...`,
          ),
        );
      await msg.edit(buildReply([step3]));

      await sleep(1500);

      // Step 4 — Final success
      const finalContainer = new ContainerBuilder()
        .setAccentColor(ACCENT.success)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `## ${EMOJI.sparkle} Bienvenue chez Yourazz !\n\n` +
            `Votre paiement a été **validé avec succès**.\n\n` +
            `${EMOJI.check} Licence activée\n` +
            `${EMOJI.check} Rôle vendeur attribué\n` +
            `${EMOJI.check} Accès débloqués\n` +
            `${EMOJI.check} Dashboard disponible`,
          ),
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `${EMOJI.fire} **Plan :** Vendeur Yourazz\n` +
            `${EMOJI.calendar} **Expiration :** ${formatDate(license.expiresAt)}\n\n` +
            `Merci pour votre confiance ${EMOJI.heart}`,
          ),
        )
        .addMediaGalleryComponents(mediaGif(BRANDING.successBannerUrl))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${BRANDING.footer}`));

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("yrz_panel_dashboard")
          .setLabel("Mon Dashboard")
          .setEmoji("📊")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("yrz_panel_support")
          .setLabel("Support")
          .setEmoji("📩")
          .setStyle(ButtonStyle.Secondary),
      );

      await msg.edit(buildReply([finalContainer], [row]));
    } catch (err: any) {
      logger.warn("AnimationService", `DM impossible pour ${discordUserId}: ${err.message}`);
    }
  }
}
