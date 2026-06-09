"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.premiumEmbed = premiumEmbed;
exports.panelEmbed = panelEmbed;
exports.progressBar = progressBar;
exports.statusBadge = statusBadge;
exports.planBadge = planBadge;
const discord_js_1 = require("discord.js");
const branding_1 = require("../config/branding");
const colorMap = {
    success: branding_1.THEME.success,
    error: branding_1.THEME.error,
    warning: branding_1.THEME.warning,
    info: branding_1.THEME.info,
    primary: branding_1.THEME.primary,
    dark: branding_1.THEME.dark,
};
function premiumEmbed(type = "primary") {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(colorMap[type])
        .setFooter({ text: branding_1.BRANDING.footer, iconURL: branding_1.BRANDING.logoUrl || undefined })
        .setTimestamp();
    if (branding_1.BRANDING.logoUrl) {
        embed.setThumbnail(branding_1.BRANDING.logoUrl);
    }
    return embed;
}
function panelEmbed() {
    return new discord_js_1.EmbedBuilder()
        .setColor(branding_1.THEME.primary)
        .setAuthor({ name: branding_1.BRANDING.author, iconURL: branding_1.BRANDING.logoUrl || undefined })
        .setFooter({ text: branding_1.BRANDING.footer, iconURL: branding_1.BRANDING.logoUrl || undefined })
        .setTimestamp();
}
function progressBar(current, max, length = 10) {
    const filled = Math.round((current / max) * length);
    const empty = length - filled;
    const bar = "█".repeat(filled) + "░".repeat(empty);
    const percent = Math.round((current / max) * 100);
    return `\`${bar}\` ${percent}%`;
}
function statusBadge(status) {
    switch (status) {
        case "ACTIVE":
            return `${branding_1.EMOJI.greenCircle} **Actif**`;
        case "EXPIRED":
            return `${branding_1.EMOJI.redCircle} **Expiré**`;
        case "SUSPENDED":
            return `${branding_1.EMOJI.redCircle} **Suspendu**`;
        default:
            return `${branding_1.EMOJI.yellowCircle} **${status}**`;
    }
}
function planBadge() {
    return `${branding_1.EMOJI.fire} **Vendeur Yourazz**`;
}
//# sourceMappingURL=premium-embed.js.map