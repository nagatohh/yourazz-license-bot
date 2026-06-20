"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketParserService = exports.TicketSchema = void 0;
const zod_1 = require("zod");
const embed_reader_service_1 = require("./embed-reader.service");
/**
 * Parse les embeds de fermeture de ticket. Deux formats réels gérés :
 *
 *  A) « Ticket fermé » (FR)
 *     Ticket: pp-ltc-22-sc8m
 *     Client: 0kwf 1457248515725070515
 *     Closed by: sc8m
 *     Handler: sc8m 1254736119153823776          ← STAFF crédité
 *
 *  B) « Ticket Closed » (EN)
 *     Client: 809764298 1469051943400767781 (@éngel)
 *     Category: nitro
 *     Handler: 07cr. 1224057027341582351 (@Aizenn) ← STAFF crédité
 *     Closed by: 809764298
 *     Status: 🔒 Closed
 *     Channel: #ntr-07cr · ID: 1517902863236600040
 *
 * Le staff crédité = le **Handler** (celui qui a traité le ticket).
 * Les embeds « Profit enregistré » (ventes) ne sont PAS gérés ici → renvoient
 * null (réservés à une phase ultérieure de tracking des profits).
 */
exports.TicketSchema = zod_1.z.object({
    ticketId: zod_1.z.string().nullable(),
    sellerId: zod_1.z.string().regex(/^\d{17,20}$/).nullable(),
    sellerUsername: zod_1.z.string().nullable(),
    eventType: zod_1.z.enum(["CLOSED", "CLAIMED"]),
});
class TicketParserService {
    /** Normalise le texte : retire le markdown gras et les backticks. */
    static normalize(message) {
        return embed_reader_service_1.EmbedReaderService.flattenMessage(message).replace(/\*+/g, "").replace(/`/g, "");
    }
    static detect(message) {
        const text = this.normalize(message);
        // Exclut explicitement les embeds de profit/vente.
        if (/profit\s*enregistr/i.test(text))
            return false;
        return /ticket\s*(ferm|clos|closed)|closed\s*by|claimed\s*by/i.test(text);
    }
    static parse(message) {
        const text = this.normalize(message);
        if (/profit\s*enregistr/i.test(text))
            return null; // vente, pas une fermeture
        const isClosed = /ticket\s*(ferm|clos|closed)|closed\s*by|status\s*:?\s*[^\n]*clos/i.test(text);
        const isClaimed = /claimed\s*by|ticket\s*claim/i.test(text);
        if (!isClosed && !isClaimed)
            return null;
        // Handler = staff crédité (ligne contenant l'ID).
        const handlerLine = text.match(/Handler\s*:\s*([^\n]+)/i)?.[1] ?? "";
        const sellerId = handlerLine.match(/<@!?(\d{17,20})>/)?.[1] ??
            handlerLine.match(/(\d{17,20})/)?.[1] ??
            null;
        const sellerUsername = handlerLine.match(/^\s*([^\s(]+)/)?.[1]?.trim() ?? null;
        // ticketId : slug du champ "Ticket:" (format A), sinon nom/ID du salon (format B).
        let ticketId = null;
        const ticketField = text.match(/(?:^|\n)\s*Ticket\s*:\s*([^\n]+)/i)?.[1]?.trim() ?? null;
        if (ticketField && !/inconnu|unknown|n\/a/i.test(ticketField)) {
            ticketId = ticketField.replace(/^#\s*/, "").trim();
        }
        if (!ticketId) {
            const chName = text.match(/Channel\s*:\s*#?([^\s·\n]+)/i)?.[1] ?? null;
            const chId = text.match(/Channel\s*:[^\n]*?ID\s*:?\s*(\d{17,20})/i)?.[1] ?? null;
            ticketId = chName ?? chId ?? null;
        }
        const candidate = {
            ticketId,
            sellerId,
            sellerUsername,
            eventType: isClosed ? "CLOSED" : "CLAIMED",
        };
        const result = exports.TicketSchema.safeParse(candidate);
        return result.success ? result.data : null;
    }
}
exports.TicketParserService = TicketParserService;
//# sourceMappingURL=ticket-parser.service.js.map