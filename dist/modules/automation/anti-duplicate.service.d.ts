export type ProcessStatus = "processed" | "incomplete" | "error" | "duplicate";
/**
 * Garantit qu'un même message / vouch / avis n'est jamais compté deux fois.
 * Clés de sécurité : discordMessageId (unique en base), hash du contenu,
 * externalEventId (vouchId / ticketId).
 */
export declare class AntiDuplicateService {
    /** Hash stable du contenu d'un message (fallback anti-doublon). */
    static hash(content: string): string;
    /** Le message a-t-il déjà été traité avec succès ? */
    static isMessageProcessed(discordMessageId: string): Promise<boolean>;
    /** Cet identifiant externe (vouchId/ticketId) a-t-il déjà été crédité ? */
    static isExternalProcessed(externalEventId: string): Promise<boolean>;
    /** Ce hash de contenu a-t-il déjà été traité ? */
    static isHashProcessed(hash: string): Promise<boolean>;
    /** Upsert l'enregistrement de traitement d'un message. */
    static record(params: {
        discordMessageId: string;
        sourceChannelId: string;
        eventType: string;
        externalEventId?: string | null;
        hash: string;
        status: ProcessStatus;
        errorMessage?: string | null;
    }): Promise<{
        status: string;
        id: string;
        discordMessageId: string;
        sourceChannelId: string;
        eventType: string;
        externalEventId: string | null;
        hash: string;
        errorMessage: string | null;
        processedAt: Date;
    }>;
    /** Compteurs par statut — utilisé par /automation status. */
    static counts(): Promise<Record<string, number>>;
}
//# sourceMappingURL=anti-duplicate.service.d.ts.map