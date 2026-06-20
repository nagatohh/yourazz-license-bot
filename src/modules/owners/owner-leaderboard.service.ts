import { Client, TextChannel, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } from "discord.js";
import { OwnerService } from "./owner.service";
import { ACCENT } from "../../utils/cv2";
import { LEADERBOARD_SIZE } from "../../config/owners";
import { logger } from "../../utils/logger";

export class OwnerLeaderboardService {
  private static channelId: string | null = null;
  private static messageId: string | null = null;

  static setChannel(channelId: string) {
    this.channelId = channelId;
  }

  static async update(client: Client) {
    if (!this.channelId) return;

    const channel = client.channels.cache.get(this.channelId) as TextChannel | undefined;
    if (!channel) return;

    const leaderboard = await OwnerService.getLeaderboard(LEADERBOARD_SIZE);
    if (leaderboard.length === 0) return;

    const medals = ["🥇", "🥈", "🥉"];
    const lines = leaderboard.map((owner, i) => {
      const medal = medals[i] ?? `\`${i + 1}.\``;
      const tierInfo = OwnerService.getTierInfo(owner.tier);
      return `${medal} <@${owner.discordId}> — **${owner.totalScore} pts** ${tierInfo.emoji} • ${owner.team.length} recrues`;
    });

    const container = new ContainerBuilder()
      .setAccentColor(ACCENT.primary)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("## 👑 Classement Owners"),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(lines.join("\n")),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("-# Mis à jour automatiquement • Yourazz Owner System"),
      );

    const payload = { components: [container], flags: 32768 as any };

    try {
      if (this.messageId) {
        const msg = await channel.messages.fetch(this.messageId).catch(() => null);
        if (msg) {
          await msg.edit(payload);
          return;
        }
      }

      const sent = await channel.send(payload);
      this.messageId = sent.id;
    } catch (err: any) {
      logger.error("OwnerLeaderboard", `Erreur mise à jour: ${err.message}`);
    }
  }
}
