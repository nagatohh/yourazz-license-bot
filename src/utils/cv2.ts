import {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { BRANDING, THEME } from "../config/branding";

// Raw number to satisfy BitFieldResolvable typing in discord.js v14
export const CV2_FLAG = 32768; // MessageFlags.IsComponentsV2 (1 << 15)

// Color accents (container border colors)
export const ACCENT = {
  success: THEME.success,
  error: THEME.error,
  warning: THEME.warning,
  info: THEME.info,
  primary: THEME.primary,
  dark: THEME.dark,
};

type AccentType = keyof typeof ACCENT;

/** Wrap the reply options with the CV2 flag */
export function cv2Reply(options: Record<string, any>) {
  return { ...options, flags: CV2_FLAG };
}

/** Small separator line */
export function sep(spacing: SeparatorSpacingSize = SeparatorSpacingSize.Small) {
  return new SeparatorBuilder().setSpacing(spacing).setDivider(true);
}

/**
 * Build a simple titled card with optional description lines.
 * Returns a ContainerBuilder with colour accent + footer text.
 */
export function card(
  accent: AccentType,
  title: string,
  lines: string[],
  opts?: { thumbnail?: string; image?: string },
) {
  const container = new ContainerBuilder().setAccentColor(ACCENT[accent]);

  if (opts?.thumbnail) {
    const section = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${title}\n${lines.join("\n")}`),
      )
      .setThumbnailAccessory(new ThumbnailBuilder().setURL(opts.thumbnail));
    container.addSectionComponents(section);
  } else {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${title}`));
    if (lines.length > 0) {
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join("\n")));
    }
  }

  container.addSeparatorComponents(sep());
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ${BRANDING.footer}`),
  );

  return container;
}

/** Success card */
export function successCard(title: string, description: string) {
  return card("success", `✅ ${title}`, [description]);
}

/** Error card */
export function errorCard(title: string, description: string) {
  return card("error", `❌ ${title}`, [description]);
}

/** Warning card */
export function warningCard(title: string, description: string) {
  return card("warning", `⚠️ ${title}`, [description]);
}

/** Info card */
export function infoCard(title: string, description: string) {
  return card("info", `ℹ️ ${title}`, [description]);
}

/** Primary branded card */
export function primaryCard(title: string, lines: string[], opts?: { thumbnail?: string }) {
  return card("primary", title, lines, opts);
}

/** MediaGallery with a single GIF/image URL */
export function mediaGif(url: string) {
  return new MediaGalleryBuilder().addItems(
    new MediaGalleryItemBuilder().setURL(url),
  );
}

/** Assemble final reply payload with CV2 flag + optional action rows */
export function buildReply(
  containers: ContainerBuilder[],
  rows: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] = [],
) {
  return cv2Reply({
    components: [...containers, ...rows],
  });
}
