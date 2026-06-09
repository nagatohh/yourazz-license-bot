import { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, MediaGalleryBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } from "discord.js";
export declare const CV2_FLAG = 32768;
export declare const ACCENT: {
    success: number;
    error: number;
    warning: number;
    info: number;
    primary: number;
    dark: number;
};
type AccentType = keyof typeof ACCENT;
/** Wrap the reply options with the CV2 flag */
export declare function cv2Reply(options: Record<string, any>): {
    flags: number;
};
/** Small separator line */
export declare function sep(spacing?: SeparatorSpacingSize): SeparatorBuilder;
/**
 * Build a simple titled card with optional description lines.
 * Returns a ContainerBuilder with colour accent + footer text.
 */
export declare function card(accent: AccentType, title: string, lines: string[], opts?: {
    thumbnail?: string;
    image?: string;
}): ContainerBuilder;
/** Success card */
export declare function successCard(title: string, description: string): ContainerBuilder;
/** Error card */
export declare function errorCard(title: string, description: string): ContainerBuilder;
/** Warning card */
export declare function warningCard(title: string, description: string): ContainerBuilder;
/** Info card */
export declare function infoCard(title: string, description: string): ContainerBuilder;
/** Primary branded card */
export declare function primaryCard(title: string, lines: string[], opts?: {
    thumbnail?: string;
}): ContainerBuilder;
/** MediaGallery with a single GIF/image URL */
export declare function mediaGif(url: string): MediaGalleryBuilder;
/** Assemble final reply payload with CV2 flag + optional action rows */
export declare function buildReply(containers: ContainerBuilder[], rows?: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[]): {
    flags: number;
};
export {};
//# sourceMappingURL=cv2.d.ts.map