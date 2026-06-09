import { EmbedBuilder } from "discord.js";
import { BRANDING, THEME, EMOJI } from "../config/branding";

type EmbedType = "success" | "error" | "warning" | "info" | "primary" | "dark";

const colorMap: Record<EmbedType, number> = {
  success: THEME.success,
  error: THEME.error,
  warning: THEME.warning,
  info: THEME.info,
  primary: THEME.primary,
  dark: THEME.dark,
};

export function premiumEmbed(type: EmbedType = "primary") {
  const embed = new EmbedBuilder()
    .setColor(colorMap[type])
    .setFooter({ text: BRANDING.footer, iconURL: BRANDING.logoUrl || undefined })
    .setTimestamp();

  if (BRANDING.logoUrl) {
    embed.setThumbnail(BRANDING.logoUrl);
  }

  return embed;
}

export function panelEmbed() {
  return new EmbedBuilder()
    .setColor(THEME.primary)
    .setAuthor({ name: BRANDING.author, iconURL: BRANDING.logoUrl || undefined })
    .setFooter({ text: BRANDING.footer, iconURL: BRANDING.logoUrl || undefined })
    .setTimestamp();
}

export function progressBar(current: number, max: number, length = 10): string {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  const percent = Math.round((current / max) * 100);
  return `\`${bar}\` ${percent}%`;
}

export function statusBadge(status: string): string {
  switch (status) {
    case "ACTIVE":
      return `${EMOJI.greenCircle} **Actif**`;
    case "EXPIRED":
      return `${EMOJI.redCircle} **Expiré**`;
    case "SUSPENDED":
      return `${EMOJI.redCircle} **Suspendu**`;
    default:
      return `${EMOJI.yellowCircle} **${status}**`;
  }
}

export function planBadge(): string {
  return `${EMOJI.fire} **Vendeur Yourazz**`;
}
