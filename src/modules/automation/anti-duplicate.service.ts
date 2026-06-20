import { createHash } from "node:crypto";
import { prisma } from "../../services/database";

export type ProcessStatus = "processed" | "incomplete" | "error" | "duplicate";

/**
 * Garantit qu'un même message / vouch / avis n'est jamais compté deux fois.
 * Clés de sécurité : discordMessageId (unique en base), hash du contenu,
 * externalEventId (vouchId / ticketId).
 */
export class AntiDuplicateService {
  /** Hash stable du contenu d'un message (fallback anti-doublon). */
  static hash(content: string): string {
    return createHash("sha256").update(content.trim()).digest("hex");
  }

  /** Le message a-t-il déjà été traité avec succès ? */
  static async isMessageProcessed(discordMessageId: string): Promise<boolean> {
    const existing = await prisma.processedEvent.findUnique({
      where: { discordMessageId },
    });
    return existing?.status === "processed";
  }

  /** Cet identifiant externe (vouchId/ticketId) a-t-il déjà été crédité ? */
  static async isExternalProcessed(externalEventId: string): Promise<boolean> {
    if (!externalEventId) return false;
    const existing = await prisma.processedEvent.findFirst({
      where: { externalEventId, status: "processed" },
    });
    return !!existing;
  }

  /** Ce hash de contenu a-t-il déjà été traité ? */
  static async isHashProcessed(hash: string): Promise<boolean> {
    const existing = await prisma.processedEvent.findFirst({
      where: { hash, status: "processed" },
    });
    return !!existing;
  }

  /** Upsert l'enregistrement de traitement d'un message. */
  static async record(params: {
    discordMessageId: string;
    sourceChannelId: string;
    eventType: string;
    externalEventId?: string | null;
    hash: string;
    status: ProcessStatus;
    errorMessage?: string | null;
  }) {
    const { discordMessageId, sourceChannelId, eventType, externalEventId, hash, status, errorMessage } =
      params;
    return prisma.processedEvent.upsert({
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
    const grouped = await prisma.processedEvent.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const out: Record<string, number> = { processed: 0, incomplete: 0, error: 0, duplicate: 0 };
    for (const g of grouped) out[g.status] = g._count._all;
    return out;
  }
}
