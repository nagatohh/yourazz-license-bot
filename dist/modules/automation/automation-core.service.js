"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationCoreService = void 0;
const database_1 = require("../../services/database");
const logger_1 = require("../../utils/logger");
const channels_1 = require("../../config/channels");
const embed_reader_service_1 = require("./embed-reader.service");
const anti_duplicate_service_1 = require("./anti-duplicate.service");
const vouch_parser_service_1 = require("./vouch-parser.service");
const feedback_parser_service_1 = require("./feedback-parser.service");
const ticket_parser_service_1 = require("./ticket-parser.service");
const seller_stats_service_1 = require("./seller-stats.service");
const automation_events_1 = require("./automation-events");
const SOURCE = "AutomationCore";
/**
 * Cerveau central : pour chaque message d'un salon surveillé, route vers le bon
 * parser, déduplique, persiste l'event et met à jour les stats vendeur, puis
 * émet l'event interne. Idempotent : un re-sync ne recompte jamais.
 */
class AutomationCoreService {
    /**
     * Point d'entrée du listener messageCreate et du backfill.
     * @param force  retraite même si déjà marqué `processed` (commande reprocess).
     */
    static async handleMessage(message, opts = {}) {
        const type = (0, channels_1.getWatchedType)(message.channelId);
        if (!type)
            return; // salon non surveillé
        // On ne traite pas nos propres messages (mais bien ceux du bot externe).
        if (message.author?.id === message.client.user?.id)
            return;
        const content = embed_reader_service_1.EmbedReaderService.flattenMessage(message);
        const hash = anti_duplicate_service_1.AntiDuplicateService.hash(content);
        try {
            if (!opts.force && (await anti_duplicate_service_1.AntiDuplicateService.isMessageProcessed(message.id))) {
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
        }
        catch (err) {
            // Un embed mal formé ne doit JAMAIS crasher le bot.
            logger_1.logger.error(SOURCE, `Erreur traitement ${type} (msg ${message.id}): ${err?.message ?? err}`);
            await anti_duplicate_service_1.AntiDuplicateService.record({
                discordMessageId: message.id,
                sourceChannelId: message.channelId,
                eventType: type,
                hash,
                status: "error",
                errorMessage: String(err?.message ?? err).slice(0, 500),
            }).catch(() => { });
        }
    }
    static async markIncomplete(message, type, hash) {
        logger_1.logger.warn(SOURCE, `Event ${type} incomplet (msg ${message.id}) — info manquante`);
        await anti_duplicate_service_1.AntiDuplicateService.record({
            discordMessageId: message.id,
            sourceChannelId: message.channelId,
            eventType: type,
            hash,
            status: "incomplete",
            errorMessage: "Champs essentiels manquants au parsing",
        });
    }
    // ── VOUCH ──────────────────────────────────────────────
    static async processVouch(message, hash) {
        const parsed = vouch_parser_service_1.VouchParserService.parse(message);
        if (!parsed)
            return this.markIncomplete(message, "VOUCH", hash);
        // Doublon par vouchId (même vouch reposté dans un autre message).
        if (parsed.vouchId && (await anti_duplicate_service_1.AntiDuplicateService.isExternalProcessed(parsed.vouchId))) {
            const already = await database_1.prisma.vouchEvent.findFirst({ where: { vouchId: parsed.vouchId } });
            if (already && already.messageId !== message.id) {
                await anti_duplicate_service_1.AntiDuplicateService.record({
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
        const existing = await database_1.prisma.vouchEvent.findUnique({ where: { messageId: message.id } });
        if (existing) {
            // Reprocess : on met à jour les champs sans recompter les stats.
            await database_1.prisma.vouchEvent.update({
                where: { messageId: message.id },
                data: {
                    vouchId: parsed.vouchId,
                    sellerId: parsed.sellerId,
                    clientId: parsed.clientId,
                    comment: parsed.comment,
                },
            });
        }
        else {
            await database_1.prisma.vouchEvent.create({
                data: {
                    messageId: message.id,
                    vouchId: parsed.vouchId,
                    sellerId: parsed.sellerId,
                    clientId: parsed.clientId,
                    comment: parsed.comment,
                },
            });
            await seller_stats_service_1.SellerStatsService.addVouch(parsed.sellerId, parsed.sellerUsername ?? undefined);
            automation_events_1.automationBus.emitEvent(automation_events_1.AUTOMATION_EVENTS.VOUCH_DETECTED, {
                sellerId: parsed.sellerId,
                vouchId: parsed.vouchId,
            });
            automation_events_1.automationBus.emitEvent(automation_events_1.AUTOMATION_EVENTS.SELLER_STATS_UPDATED, { sellerId: parsed.sellerId });
        }
        await anti_duplicate_service_1.AntiDuplicateService.record({
            discordMessageId: message.id,
            sourceChannelId: message.channelId,
            eventType: "VOUCH",
            externalEventId: parsed.vouchId,
            hash,
            status: "processed",
        });
    }
    // ── FEEDBACK ───────────────────────────────────────────
    static async processFeedback(message, hash) {
        const parsed = feedback_parser_service_1.FeedbackParserService.parse(message);
        if (!parsed)
            return this.markIncomplete(message, "FEEDBACK", hash);
        const existing = await database_1.prisma.feedbackEvent.findUnique({ where: { messageId: message.id } });
        if (existing) {
            await database_1.prisma.feedbackEvent.update({
                where: { messageId: message.id },
                data: {
                    sellerId: parsed.sellerId,
                    clientId: parsed.clientId,
                    rating: parsed.rating,
                    comment: parsed.comment,
                    ticketId: parsed.ticketId,
                },
            });
        }
        else {
            await database_1.prisma.feedbackEvent.create({
                data: {
                    messageId: message.id,
                    sellerId: parsed.sellerId,
                    clientId: parsed.clientId,
                    rating: parsed.rating,
                    comment: parsed.comment,
                    ticketId: parsed.ticketId,
                },
            });
            await seller_stats_service_1.SellerStatsService.addRating(parsed.sellerId, parsed.rating, parsed.clientUsername ?? undefined);
            automation_events_1.automationBus.emitEvent(automation_events_1.AUTOMATION_EVENTS.FEEDBACK_DETECTED, {
                sellerId: parsed.sellerId,
                rating: parsed.rating,
            });
            automation_events_1.automationBus.emitEvent(automation_events_1.AUTOMATION_EVENTS.SELLER_STATS_UPDATED, { sellerId: parsed.sellerId });
        }
        await anti_duplicate_service_1.AntiDuplicateService.record({
            discordMessageId: message.id,
            sourceChannelId: message.channelId,
            eventType: "FEEDBACK",
            externalEventId: parsed.ticketId,
            hash,
            status: "processed",
        });
    }
    // ── TICKET (ossature) ──────────────────────────────────
    static async processTicket(message, hash) {
        const parsed = ticket_parser_service_1.TicketParserService.parse(message);
        if (!parsed)
            return this.markIncomplete(message, "TICKET", hash);
        const existing = await database_1.prisma.ticketEvent.findUnique({ where: { messageId: message.id } });
        if (!existing) {
            await database_1.prisma.ticketEvent.create({
                data: {
                    messageId: message.id,
                    ticketId: parsed.ticketId,
                    sellerId: parsed.sellerId,
                    eventType: parsed.eventType,
                },
            });
            if (parsed.eventType === "CLOSED" && parsed.sellerId) {
                await seller_stats_service_1.SellerStatsService.addTicket(parsed.sellerId, parsed.sellerUsername ?? undefined);
                automation_events_1.automationBus.emitEvent(automation_events_1.AUTOMATION_EVENTS.TICKET_CLOSED_DETECTED, { sellerId: parsed.sellerId });
            }
        }
        await anti_duplicate_service_1.AntiDuplicateService.record({
            discordMessageId: message.id,
            sourceChannelId: message.channelId,
            eventType: parsed.eventType === "CLOSED" ? "TICKET_CLOSED" : "TICKET_CLAIMED",
            externalEventId: parsed.ticketId,
            hash,
            status: "processed",
        });
    }
}
exports.AutomationCoreService = AutomationCoreService;
//# sourceMappingURL=automation-core.service.js.map