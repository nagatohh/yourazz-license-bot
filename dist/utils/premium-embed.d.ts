import { EmbedBuilder } from "discord.js";
type EmbedType = "success" | "error" | "warning" | "info" | "primary" | "dark";
export declare function premiumEmbed(type?: EmbedType): EmbedBuilder;
export declare function panelEmbed(): EmbedBuilder;
export declare function progressBar(current: number, max: number, length?: number): string;
export declare function statusBadge(status: string): string;
export declare function planBadge(): string;
export {};
//# sourceMappingURL=premium-embed.d.ts.map