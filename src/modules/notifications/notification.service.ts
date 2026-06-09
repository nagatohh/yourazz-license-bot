import {
  Client,
  TextChannel,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from "discord.js";
import { CHANNELS } from "../../config/channels";
import { PLANS } from "../../config/licenses";
import { formatPrice, formatDate } from "../../utils/format";
import { buildReply, ACCENT, mediaGif } from "../../utils/cv2";
import { logger } from "../../utils/logger";

function dmPayload(container: ContainerBuilder) {
  return buildReply([container]);
}

export class NotificationService {
  static async sendDM(client: Client, discordUserId: string, payload: Record<string, any>) {
    try {
      const user = await client.users.fetch(discordUserId);
      await user.send(payload);
    } catch {
      logger.warn("NotificationService", `Impossible d'envoyer un DM à ${discordUserId}`);
    }
  }

  static async sendLicenseActivated(client: Client, discordUserId: string, license: any) {
    const container = new ContainerBuilder()
      .setAccentColor(ACCENT.success)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ✅ Licence activée`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Votre licence **${license.plan.displayName}** est maintenant active !\n\n` +
          `📅 Expiration : **${formatDate(license.expiresAt)}**\n` +
          `📦 Produits max : **${license.plan.maxProducts === -1 ? "Illimité" : license.plan.maxProducts}**\n\n` +
          `Merci pour votre confiance ! 🎉`,
        ),
      )
      .addMediaGalleryComponents(mediaGif("https://cdn.discordapp.com/attachments/1513986663636926565/1514031473097703456/ezgif-208962271a6be842.gif?ex=6a29e330&is=6a2891b0&hm=661167db3025d35089dd42472f8d7064bd696f164fc54c913a821ef0a3aea74d&"));
    await this.sendDM(client, discordUserId, dmPayload(container));
  }

  static async sendExpirationReminder(client: Client, discordUserId: string, license: any, daysLeft: number) {
    const urgency = daysLeft <= 1 ? "🚨" : daysLeft <= 3 ? "⚠️" : "📢";
    const container = new ContainerBuilder()
      .setAccentColor(ACCENT.warning)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## ⚠️ Licence expire ${daysLeft <= 1 ? "demain" : `dans ${daysLeft} jours`}`,
        ),
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `${urgency} Votre licence **${license.plan.displayName}** expire le **${formatDate(license.expiresAt)}**.\n\n` +
          `Renouvelez maintenant avec \`/licence renouveler\` pour ne pas perdre votre accès vendeur.`,
        ),
      )
      .addMediaGalleryComponents(mediaGif("https://cdn.discordapp.com/attachments/1511856683511578625/1512099822990135470/ezgif-28ca24151de2ab3d.gif"));
    await this.sendDM(client, discordUserId, dmPayload(container));
  }

  static async sendLicenseExpired(client: Client, discordUserId: string, planName: string) {
    const container = new ContainerBuilder()
      .setAccentColor(ACCENT.error)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ❌ Licence expirée`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Votre licence **${planName}** a expiré.\n\n` +
          `Votre rôle vendeur a été retiré.\n` +
          `Utilisez \`/licence acheter\` pour renouveler.`,
        ),
      );
    await this.sendDM(client, discordUserId, dmPayload(container));
  }

  static async sendPaymentFailed(client: Client, discordUserId: string) {
    const container = new ContainerBuilder()
      .setAccentColor(ACCENT.error)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ❌ Paiement échoué`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Votre paiement n'a pas abouti.\nVeuillez réessayer avec \`/licence acheter\`.`,
        ),
      );
    await this.sendDM(client, discordUserId, dmPayload(container));
  }

  static async logNewLicense(client: Client, discordUserId: string, planName: string, amount: number, currency: string) {
    const channel = await client.channels.fetch(CHANNELS.licenseLog) as TextChannel | null;
    if (!channel) return;

    const plan = PLANS[planName];
    const container = new ContainerBuilder()
      .setAccentColor(ACCENT.success)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🎉 Nouvelle licence vendue`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Vendeur :** <@${discordUserId}>\n` +
          `**Plan :** ${plan?.emoji ?? ""} ${plan?.displayName ?? planName}\n` +
          `**Montant :** ${formatPrice(amount, currency)}`,
        ),
      );

    await channel.send(buildReply([container]));
  }

  static async logLicenseExpired(client: Client, discordUserId: string, planName: string) {
    const channel = await client.channels.fetch(CHANNELS.staffLog) as TextChannel | null;
    if (!channel) return;

    const container = new ContainerBuilder()
      .setAccentColor(ACCENT.warning)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ⏰ Licence expirée`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Vendeur :** <@${discordUserId}>\n**Plan :** ${planName}`,
        ),
      );

    await channel.send(buildReply([container]));
  }

  static async logPaymentFailed(client: Client, discordUserId: string, sessionId: string) {
    const channel = await client.channels.fetch(CHANNELS.staffLog) as TextChannel | null;
    if (!channel) return;

    const container = new ContainerBuilder()
      .setAccentColor(ACCENT.error)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ❌ Paiement échoué`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Utilisateur :** <@${discordUserId}>\n**Session :** \`${sessionId}\``,
        ),
      );

    await channel.send(buildReply([container]));
  }
}
