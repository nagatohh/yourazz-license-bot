"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACCENT = exports.CV2_FLAG = void 0;
exports.cv2Reply = cv2Reply;
exports.sep = sep;
exports.card = card;
exports.successCard = successCard;
exports.errorCard = errorCard;
exports.warningCard = warningCard;
exports.infoCard = infoCard;
exports.primaryCard = primaryCard;
exports.mediaGif = mediaGif;
exports.buildReply = buildReply;
const discord_js_1 = require("discord.js");
const branding_1 = require("../config/branding");
// Raw number to satisfy BitFieldResolvable typing in discord.js v14
exports.CV2_FLAG = 32768; // MessageFlags.IsComponentsV2 (1 << 15)
// Color accents (container border colors)
exports.ACCENT = {
    success: branding_1.THEME.success,
    error: branding_1.THEME.error,
    warning: branding_1.THEME.warning,
    info: branding_1.THEME.info,
    primary: branding_1.THEME.primary,
    dark: branding_1.THEME.dark,
};
/** Wrap the reply options with the CV2 flag */
function cv2Reply(options) {
    return { ...options, flags: exports.CV2_FLAG };
}
/** Small separator line */
function sep(spacing = discord_js_1.SeparatorSpacingSize.Small) {
    return new discord_js_1.SeparatorBuilder().setSpacing(spacing).setDivider(true);
}
/**
 * Build a simple titled card with optional description lines.
 * Returns a ContainerBuilder with colour accent + footer text.
 */
function card(accent, title, lines, opts) {
    const container = new discord_js_1.ContainerBuilder().setAccentColor(exports.ACCENT[accent]);
    if (opts?.thumbnail) {
        const section = new discord_js_1.SectionBuilder()
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${title}\n${lines.join("\n")}`))
            .setThumbnailAccessory(new discord_js_1.ThumbnailBuilder().setURL(opts.thumbnail));
        container.addSectionComponents(section);
    }
    else {
        container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${title}`));
        if (lines.length > 0) {
            container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(lines.join("\n")));
        }
    }
    container.addSeparatorComponents(sep());
    container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# ${branding_1.BRANDING.footer}`));
    return container;
}
/** Success card */
function successCard(title, description) {
    return card("success", `✅ ${title}`, [description]);
}
/** Error card */
function errorCard(title, description) {
    return card("error", `❌ ${title}`, [description]);
}
/** Warning card */
function warningCard(title, description) {
    return card("warning", `⚠️ ${title}`, [description]);
}
/** Info card */
function infoCard(title, description) {
    return card("info", `ℹ️ ${title}`, [description]);
}
/** Primary branded card */
function primaryCard(title, lines, opts) {
    return card("primary", title, lines, opts);
}
/** MediaGallery with a single GIF/image URL */
function mediaGif(url) {
    return new discord_js_1.MediaGalleryBuilder().addItems(new discord_js_1.MediaGalleryItemBuilder().setURL(url));
}
/** Assemble final reply payload with CV2 flag + optional action rows */
function buildReply(containers, rows = []) {
    return cv2Reply({
        components: [...containers, ...rows],
    });
}
//# sourceMappingURL=cv2.js.map