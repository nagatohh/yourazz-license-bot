"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMessage = onMessage;
const channels_1 = require("../config/channels");
const automation_core_service_1 = require("../modules/automation/automation-core.service");
const logger_1 = require("../utils/logger");
/**
 * Branche l'ingestion automatique : tout message posté dans un salon surveillé
 * (vouches / feedback-staff / ticket-logs) est analysé par l'Automation Core.
 * Les autres salons sont ignorés immédiatement (filtre channelId).
 */
function onMessage(client) {
    client.on("messageCreate", async (message) => {
        try {
            if (!(0, channels_1.getWatchedType)(message.channelId))
                return;
            // Message partiel (cache froid) → on récupère le contenu complet.
            const full = message.partial ? await message.fetch().catch(() => null) : message;
            if (!full)
                return;
            await automation_core_service_1.AutomationCoreService.handleMessage(full);
        }
        catch (err) {
            logger_1.logger.error("MessageEvent", `Erreur listener: ${err?.message ?? err}`);
        }
    });
}
//# sourceMappingURL=message.js.map