"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLORS = void 0;
exports.successEmbed = successEmbed;
exports.errorEmbed = errorEmbed;
exports.warningEmbed = warningEmbed;
exports.infoEmbed = infoEmbed;
exports.premiumEmbed = premiumEmbed;
const discord_js_1 = require("discord.js");
exports.COLORS = {
    primary: 0xdc2626,
    success: 0x22c55e,
    warning: 0xf59e0b,
    error: 0xef4444,
    info: 0x3b82f6,
    premium: 0x1f2937,
};
function successEmbed(title, description) {
    return new discord_js_1.EmbedBuilder()
        .setColor(exports.COLORS.success)
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setTimestamp();
}
function errorEmbed(title, description) {
    return new discord_js_1.EmbedBuilder()
        .setColor(exports.COLORS.error)
        .setTitle(`❌ ${title}`)
        .setDescription(description)
        .setTimestamp();
}
function warningEmbed(title, description) {
    return new discord_js_1.EmbedBuilder()
        .setColor(exports.COLORS.warning)
        .setTitle(`⚠️ ${title}`)
        .setDescription(description)
        .setTimestamp();
}
function infoEmbed(title, description) {
    return new discord_js_1.EmbedBuilder()
        .setColor(exports.COLORS.info)
        .setTitle(`ℹ️ ${title}`)
        .setDescription(description)
        .setTimestamp();
}
function premiumEmbed(title, description) {
    return new discord_js_1.EmbedBuilder()
        .setColor(exports.COLORS.primary)
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: "Yourazz License Manager" })
        .setTimestamp();
}
//# sourceMappingURL=embeds.js.map