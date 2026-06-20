import { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from "discord.js";
/**
 * Garantit qu'une promesse (ex : requête DB transatlantique) ne bloque pas
 * indéfiniment l'interaction. Rejette après `ms` si elle n'a pas abouti.
 */
export declare function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T>;
export declare function showAddMemberModal(interaction: ButtonInteraction): Promise<import("discord.js").InteractionResponse<boolean> | undefined>;
export declare function handleAddMemberModal(interaction: ModalSubmitInteraction): Promise<import("discord.js").Message<boolean> | undefined>;
export declare function showRemoveMemberSelect(interaction: ButtonInteraction): Promise<import("discord.js").Message<boolean> | undefined>;
export declare function handleRemoveMemberSelect(interaction: StringSelectMenuInteraction): Promise<import("discord.js").Message<boolean> | undefined>;
export declare function handleConfirmRemove(interaction: ButtonInteraction): Promise<import("discord.js").Message<boolean> | undefined>;
export declare function handleCancelRemove(interaction: ButtonInteraction): Promise<void>;
//# sourceMappingURL=owner-team.d.ts.map