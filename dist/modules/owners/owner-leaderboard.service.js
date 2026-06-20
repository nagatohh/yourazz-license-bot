"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnerLeaderboardService = void 0;
const discord_js_1 = require("discord.js");
const owner_service_1 = require("./owner.service");
const cv2_1 = require("../../utils/cv2");
const owners_1 = require("../../config/owners");
const logger_1 = require("../../utils/logger");
class OwnerLeaderboardService {
    static channelId = null;
    static messageId = null;
    static setChannel(channelId) {
        this.channelId = channelId;
    }
    static async update(client) {
        if (!this.channelId)
            return;
        const channel = client.channels.cache.get(this.channelId);
        if (!channel)
            return;
        const leaderboard = await owner_service_1.OwnerService.getLeaderboard(owners_1.LEADERBOARD_SIZE);
        if (leaderboard.length === 0)
            return;
        const medals = ["🥇", "🥈", "🥉"];
        const lines = leaderboard.map((owner, i) => {
            const medal = medals[i] ?? `\`${i + 1}.\``;
            const tierInfo = owner_service_1.OwnerService.getTierInfo(owner.tier);
            return `${medal} <@${owner.discordId}> — **${owner.totalScore} pts** ${tierInfo.emoji} • ${owner.team.length} recrues`;
        });
        const container = new discord_js_1.ContainerBuilder()
            .setAccentColor(cv2_1.ACCENT.primary)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("## 👑 Classement Owners"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(lines.join("\n")))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("-# Mis à jour automatiquement • Yourazz Owner System"));
        const payload = { components: [container], flags: 32768 };
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
        }
        catch (err) {
            logger_1.logger.error("OwnerLeaderboard", `Erreur mise à jour: ${err.message}`);
        }
    }
}
exports.OwnerLeaderboardService = OwnerLeaderboardService;
//# sourceMappingURL=owner-leaderboard.service.js.map