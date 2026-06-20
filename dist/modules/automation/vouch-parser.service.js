"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VouchParserService = exports.VouchSchema = void 0;
const zod_1 = require("zod");
const embed_reader_service_1 = require("./embed-reader.service");
/**
 * Parse un embed « Vouch Added ».
 * Format réel (cf. bot externe Yourazz) :
 *   ✅ Vouch Added
 *   🕐 Time: 20 Jun 2026, 15:51:43
 *   🆔 Vouch ID: #108745
 *   👤 Sender (From) • @X — username (1163239654527619103)   ← CLIENT
 *   🛡️ Receiver (To) • @Y — username (534988745733046272)    ← VENDEUR crédité
 *   👥 Comment: ...
 *   📌 Channel: # youchs
 */
exports.VouchSchema = zod_1.z.object({
    vouchId: zod_1.z.string().nullable(),
    sellerId: zod_1.z.string().regex(/^\d{17,20}$/), // Receiver — requis
    sellerUsername: zod_1.z.string().nullable(),
    clientId: zod_1.z.string().regex(/^\d{17,20}$/).nullable(),
    clientUsername: zod_1.z.string().nullable(),
    comment: zod_1.z.string().nullable(),
    time: zod_1.z.string().nullable(),
    saleChannel: zod_1.z.string().nullable(),
});
class VouchParserService {
    /** Détecte si un message est un vouch. */
    static detect(message) {
        const text = embed_reader_service_1.EmbedReaderService.flattenMessage(message);
        return /vouch\s*added|new\s*vouch|vouch\s*id/i.test(text);
    }
    /**
     * Retourne le vouch parsé, ou `null` si l'info essentielle (sellerId) manque.
     * Ne lève jamais : le Core marque l'event `incomplete` si null.
     */
    static parse(message) {
        const text = embed_reader_service_1.EmbedReaderService.flattenMessage(message);
        const vouchId = text.match(/Vouch\s*ID\s*:?\s*#?(\d+)/i)?.[1] ?? null;
        // Client = bloc Sender (From) ; Vendeur = bloc Receiver (To).
        const clientId = embed_reader_service_1.EmbedReaderService.idAfterLabel(text, "Sender", "Receiver");
        const sellerId = embed_reader_service_1.EmbedReaderService.idAfterLabel(text, "Receiver");
        const clientUsername = embed_reader_service_1.EmbedReaderService.usernameAfterLabel(text, "Sender", "Receiver");
        const sellerUsername = embed_reader_service_1.EmbedReaderService.usernameAfterLabel(text, "Receiver");
        const comment = text.match(/Comment\s*:?\s*\n?\s*["“]?([^\n"”]+)["”]?/i)?.[1]?.trim() ?? null;
        const time = text.match(/Time\s*:?\s*([^\n]+)/i)?.[1]?.trim() ?? null;
        const saleChannel = text.match(/Channel\s*:?\s*#?\s*([^\s\n]+)/i)?.[1]?.trim() ?? null;
        const candidate = {
            vouchId,
            sellerId: sellerId ?? "",
            sellerUsername: sellerUsername ?? null,
            clientId: clientId ?? null,
            clientUsername: clientUsername ?? null,
            comment,
            time,
            saleChannel,
        };
        const result = exports.VouchSchema.safeParse(candidate);
        return result.success ? result.data : null;
    }
}
exports.VouchParserService = VouchParserService;
//# sourceMappingURL=vouch-parser.service.js.map