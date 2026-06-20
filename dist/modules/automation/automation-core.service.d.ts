import { Message } from "discord.js";
/**
 * Cerveau central : pour chaque message d'un salon surveillé, route vers le bon
 * parser, déduplique, persiste l'event et met à jour les stats vendeur, puis
 * émet l'event interne. Idempotent : un re-sync ne recompte jamais.
 */
export declare class AutomationCoreService {
    /**
     * Point d'entrée du listener messageCreate et du backfill.
     * @param force  retraite même si déjà marqué `processed` (commande reprocess).
     */
    static handleMessage(message: Message, opts?: {
        force?: boolean;
    }): Promise<void>;
    private static markIncomplete;
    private static processVouch;
    private static processFeedback;
    private static processTicket;
}
//# sourceMappingURL=automation-core.service.d.ts.map