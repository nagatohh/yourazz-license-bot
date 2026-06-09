import { EmbedBuilder } from "discord.js";

export const COLORS = {
  primary: 0xdc2626,
  success: 0x22c55e,
  warning: 0xf59e0b,
  error: 0xef4444,
  info: 0x3b82f6,
  premium: 0x1f2937,
};

export function successEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(COLORS.success)
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function errorEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(COLORS.error)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function warningEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(COLORS.warning)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function infoEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

export function premiumEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: "Yourazz License Manager" })
    .setTimestamp();
}
