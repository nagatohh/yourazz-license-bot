"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntiDuplicateService = void 0;
const node_crypto_1 = require("node:crypto");
const database_1 = require("../../services/database");
/**
 * Garantit qu'un même message / vouch / avis n'est jamais compté deux fois.
 * Clés de sécurité : discordMessageId (unique en base), hash du contenu,
 * externalEventId (vouchId / ticketId).
 */
class AntiDuplicateService {
    /** Hash stable du contenu d'un message (fallback anti-doublon). */
    static hash(content) {
        return (0, node_crypto_1.createHash)("sha256").update(content.trim()).digest("hex");
    }
    /** Le message a-t-il déjà été traité avec succès ? */
    static async isMessageProcessed(discordMessageId) {
        const existing = await database_1.prisma.processedEvent.findUnique({
            where: { discordMessageId },
        });
        return existing?.status === "processed";
    }
    /** Cet identifiant externe (vouchId/ticketId) a-t-il déjà été crédité ? */
    static async isExternalProcessed(externalEventId) {
        if (!externalEventId)
            return false;
        const existing = await database_1.prisma.processedEvent.findFirst({
            where: { externalEventId, status: "processed" },
        });
        return !!existing;
    }
    /** Ce hash de contenu a-t-il déjà été traité ? */
    static async isHashProcessed(hash) {
        const existing = await database_1.prisma.processedEvent.findFirst({
            where: { hash, status: "processed" },
        });
        return !!existing;
    }
    /** Upsert l'enregistrement de traitement d'un message. */
    static async record(params) {
        const { discordMessageId, sourceChannelId, eventType, externalEventId, hash, status, errorMessage } = params;
        return database_1.prisma.processedEvent.upsert({
            where: { discordMessageId },
            create: {
                discordMessageId,
                sourceChannelId,
                eventType,
                externalEventId: externalEventId ?? null,
                hash,
                status,
                errorMessage: errorMessage ?? null,
            },
            update: {
                eventType,
                externalEventId: externalEventId ?? null,
                hash,
                status,
                errorMessage: errorMessage ?? null,
                processedAt: new Date(),
            },
        });
    }
    /** Compteurs par statut — utilisé par /automation status. */
    static async counts() {
        const grouped = await database_1.prisma.processedEvent.groupBy({
            by: ["status"],
            _count: { _all: true },
        });
        const out = { processed: 0, incomplete: 0, error: 0, duplicate: 0 };
        for (const g of grouped)
            out[g.status] = g._count._all;
        return out;
    }
}
exports.AntiDuplicateService = AntiDuplicateService;
//# sourceMappingURL=anti-duplicate.service.js.map