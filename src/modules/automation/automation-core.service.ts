import { Message } from "discord.js";
import { prisma } from "../../services/database";
import { logger } from "../../utils/logger";
import { getWatchedType, WatchedEventType } from "../../config/channels";
import { EmbedReaderService } from "./embed-reader.service";
import { AntiDuplicateService } from "./anti-duplicate.service";
import { VouchParserService } from "./vouch-parser.service";
import { FeedbackParserService } from "./feedback-parser.service";
import { TicketParserService } from "./ticket-parser.service";
import { SellerStatsService } from "./seller-stats.service";
import { automationBus, AUTOMATION_EVENTS } from "./automation-events";

const SOURCE = "AutomationCore";

/**
 * Cerveau central : pour chaque message d'un salon surveillé, route vers le bon
 * parser, déduplique, persiste l'event et met à jour les stats vendeur, puis
 * émet l'event interne. Idempotent : un re-sync ne recompte jamais.
 */
export class AutomationCoreService {
  /**
   * Point d'entrée du listener messageCreate et du backfill.
   * @param force  retraite même si déjà marqué `processed` (commande reprocess).
   */
  static async handleMessage(message: Message, opts: { force?: boolean } = {}): Promise<void> {
    const type = getWatchedType(message.channelId);
    if (!type) return; // salon non surveillé

    // On ne traite pas nos propres messages (mais bien ceux du bot externe).
    if (message.author?.id === message.client.user?.id) return;

    const content = EmbedReaderService.flattenMessage(message);
    const hash = AntiDuplicateService.hash(content);

    try {
      if (!opts.force && (await AntiDuplicateService.isMessageProcessed(message.id))) {
        return; // déjà traité
      }

      switch (type) {
        case "VOUCH":
          return await this.processVouch(message, hash);
        case "FEEDBACK":
          return await this.processFeedback(message, hash);
        case "TICKET":
          return await this.processTicket(message, hash);
      }
    } catch (err: any) {
      // Un embed mal formé ne doit JAMAIS crasher le bot.
      logger.error(SOURCE, `Erreur traitement ${type} (msg ${message.id}): ${err?.message ?? err}`);
      await AntiDuplicateService.record({
        discordMessageId: message.id,
        sourceChannelId: message.channelId,
        eventType: type,
        hash,
        status: "error",
        errorMessage: String(err?.message ?? err).slice(0, 500),
      }).catch(() => {});
    }
  }

  private static async markIncomplete(message: Message, type: WatchedEventType, hash: string) {
    logger.warn(SOURCE, `Event ${type} incomplet (msg ${message.id}) — info manquante`);
    await AntiDuplicateService.record({
      discordMessageId: message.id,
      sourceChannelId: message.channelId,
      eventType: type,
      hash,
      status: "incomplete",
      errorMessage: "Champs essentiels manquants au parsing",
    });
  }

  // ── VOUCH ──────────────────────────────────────────────
  private static async processVouch(message: Message, hash: string) {
    const parsed = VouchParserService.parse(message);
    if (!parsed) return this.markIncomplete(message, "VOUCH", hash);

    // Doublon par vouchId (même vouch reposté dans un autre message).
    if (parsed.vouchId && (await AntiDuplicateService.isExternalProcessed(parsed.vouchId))) {
      const already = await prisma.vouchEvent.findFirst({ where: { vouchId: parsed.vouchId } });
      if (already && already.messageId !== message.id) {
        await AntiDuplicateService.record({
          discordMessageId: message.id,
          sourceChannelId: message.channelId,
          eventType: "VOUCH",
          externalEventId: parsed.vouchId,
          hash,
          status: "duplicate",
        });
        return;
      }
    }

    const existing = await prisma.vouchEvent.findUnique({ where: { messageId: message.id } });
    if (existing) {
      // Reprocess : on met à jour les champs sans recompter les stats.
      await prisma.vouchEvent.update({
        where: { messageId: message.id },
        data: {
          vouchId: parsed.vouchId,
          sellerId: parsed.sellerId,
          clientId: parsed.clientId,
          comment: parsed.comment,
        },
      });
    } else {
      await prisma.vouchEvent.create({
        data: {
          messageId: message.id,
          vouchId: parsed.vouchId,
          sellerId: parsed.sellerId,
          clientId: parsed.clientId,
          comment: parsed.comment,
        },
      });
      await SellerStatsService.addVouch(parsed.sellerId, parsed.sellerUsername ?? undefined);
      automationBus.emitEvent(AUTOMATION_EVENTS.VOUCH_DETECTED, {
        sellerId: parsed.sellerId,
        vouchId: parsed.vouchId,
      });
      automationBus.emitEvent(AUTOMATION_EVENTS.SELLER_STATS_UPDATED, { sellerId: parsed.sellerId });
    }

    await AntiDuplicateService.record({
      discordMessageId: message.id,
      sourceChannelId: message.channelId,
      eventType: "VOUCH",
      externalEventId: parsed.vouchId,
      hash,
      status: "processed",
    });
  }

  // ── FEEDBACK ───────────────────────────────────────────
  private static async processFeedback(message: Message, hash: string) {
    const parsed = FeedbackParserService.parse(message);
    if (!parsed) return this.markIncomplete(message, "FEEDBACK", hash);

    const existing = await prisma.feedbackEvent.findUnique({ where: { messageId: message.id } });
    if (existing) {
      await prisma.feedbackEvent.update({
        where: { messageId: message.id },
        data: {
          sellerId: parsed.sellerId,
          clientId: parsed.clientId,
          rating: parsed.rating,
          comment: parsed.comment,
          ticketId: parsed.ticketId,
        },
      });
    } else {
      await prisma.feedbackEvent.create({
        data: {
          messageId: message.id,
          sellerId: parsed.sellerId,
          clientId: parsed.clientId,
          rating: parsed.rating,
          comment: parsed.comment,
          ticketId: parsed.ticketId,
        },
      });
      await SellerStatsService.addRating(parsed.sellerId, parsed.rating, parsed.clientUsername ?? undefined);
      automationBus.emitEvent(AUTOMATION_EVENTS.FEEDBACK_DETECTED, {
        sellerId: parsed.sellerId,
        rating: parsed.rating,
      });
      automationBus.emitEvent(AUTOMATION_EVENTS.SELLER_STATS_UPDATED, { sellerId: parsed.sellerId });
    }

    await AntiDuplicateService.record({
      discordMessageId: message.id,
      sourceChannelId: message.channelId,
      eventType: "FEEDBACK",
      externalEventId: parsed.ticketId,
      hash,
      status: "processed",
    });
  }

  // ── TICKET (ossature) ──────────────────────────────────
  private static async processTicket(message: Message, hash: string) {
    const parsed = TicketParserService.parse(message);
    // Si le parser renvoie null ET que c'est un profit → ignorer silencieusement.
    if (!parsed) {
      const text = EmbedReaderService.flattenMessage(message);
      if (/profit\s*enregistr/i.test(text)) return; // pas un ticket, pas d'alerte
      return this.markIncomplete(message, "TICKET", hash);
    }

    const existing = await prisma.ticketEvent.findUnique({ where: { messageId: message.id } });
    if (existing) return; // déjà traité

    // Déduplique par ticketId+sellerId (le bot externe poste 2 msgs par fermeture : FR + EN).
    if (parsed.ticketId && parsed.sellerId) {
      const dup = await prisma.ticketEvent.findFirst({
        where: { ticketId: parsed.ticketId, sellerId: parsed.sellerId, eventType: parsed.eventType },
      });
      if (dup) {
        await AntiDuplicateService.record({
          discordMessageId: message.id,
          sourceChannelId: message.channelId,
          eventType: "TICKET_DUPLICATE",
          externalEventId: parsed.ticketId,
          hash,
          status: "duplicate",
        });
        return;
      }
    }

    await prisma.ticketEvent.create({
      data: {
        messageId: message.id,
        ticketId: parsed.ticketId,
        sellerId: parsed.sellerId,
        eventType: parsed.eventType,
      },
    });
    if (parsed.eventType === "CLOSED" && parsed.sellerId) {
      await SellerStatsService.addTicket(parsed.sellerId, parsed.sellerUsername ?? undefined);
      automationBus.emitEvent(AUTOMATION_EVENTS.TICKET_CLOSED_DETECTED, { sellerId: parsed.sellerId });
    }

    await AntiDuplicateService.record({
      discordMessageId: message.id,
      sourceChannelId: message.channelId,
      eventType: parsed.eventType === "CLOSED" ? "TICKET_CLOSED" : "TICKET_CLAIMED",
      externalEventId: parsed.ticketId,
      hash,
      status: "processed",
    });
  }
}
