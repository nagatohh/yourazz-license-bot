import { Message } from "discord.js";
import { z } from "zod";
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
export declare const VouchSchema: z.ZodObject<{
    vouchId: z.ZodNullable<z.ZodString>;
    sellerId: z.ZodString;
    sellerUsername: z.ZodNullable<z.ZodString>;
    clientId: z.ZodNullable<z.ZodString>;
    clientUsername: z.ZodNullable<z.ZodString>;
    comment: z.ZodNullable<z.ZodString>;
    time: z.ZodNullable<z.ZodString>;
    saleChannel: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    time: string | null;
    vouchId: string | null;
    sellerId: string;
    sellerUsername: string | null;
    clientId: string | null;
    clientUsername: string | null;
    comment: string | null;
    saleChannel: string | null;
}, {
    time: string | null;
    vouchId: string | null;
    sellerId: string;
    sellerUsername: string | null;
    clientId: string | null;
    clientUsername: string | null;
    comment: string | null;
    saleChannel: string | null;
}>;
export type VouchParseResult = z.infer<typeof VouchSchema>;
export declare class VouchParserService {
    /** Détecte si un message est un vouch. */
    static detect(message: Message): boolean;
    /**
     * Retourne le vouch parsé, ou `null` si l'info essentielle (sellerId) manque.
     * Ne lève jamais : le Core marque l'event `incomplete` si null.
     */
    static parse(message: Message): VouchParseResult | null;
}
//# sourceMappingURL=vouch-parser.service.d.ts.map