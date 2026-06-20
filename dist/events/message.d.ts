import { Client } from "discord.js";
/**
 * Branche l'ingestion automatique : tout message posté dans un salon surveillé
 * (vouches / feedback-staff / ticket-logs) est analysé par l'Automation Core.
 * Les autres salons sont ignorés immédiatement (filtre channelId).
 */
export declare function onMessage(client: Client): void;
//# sourceMappingURL=message.d.ts.map