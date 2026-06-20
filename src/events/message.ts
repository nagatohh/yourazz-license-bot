import { Client, Message } from "discord.js";
import { getWatchedType } from "../config/channels";
import { AutomationCoreService } from "../modules/automation/automation-core.service";
import { logger } from "../utils/logger";

/**
 * Branche l'ingestion automatique : tout message posté dans un salon surveillé
 * (vouches / feedback-staff / ticket-logs) est analysé par l'Automation Core.
 * Les autres salons sont ignorés immédiatement (filtre channelId).
 */
export function onMessage(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    try {
      if (!getWatchedType(message.channelId)) return;

      // Message partiel (cache froid) → on récupère le contenu complet.
      const full = message.partial ? await message.fetch().catch(() => null) : message;
      if (!full) return;

      await AutomationCoreService.handleMessage(full);
    } catch (err: any) {
      logger.error("MessageEvent", `Erreur listener: ${err?.message ?? err}`);
    }
  });
}
