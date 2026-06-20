import { Message } from "discord.js";
import { z } from "zod";
/**
 * Parse un embed « Avis client ».
 * Format réel (cf. bot externe Yourazz) :
 *   ✅ Avis client
 *   Note: ⭐⭐⭐⭐⭐ (5/5)
 *   Staff: @soso100baraka                 ← VENDEUR noté (mention <@id>)
 *   Client: zbifittabouche 1111887933201465395
 *   Ticket: # inconnu                      ← souvent "inconnu" → null
 *   Commentaire: ...
 */
export declare const FeedbackSchema: z.ZodObject<{
    sellerId: z.ZodString;
    rating: z.ZodNumber;
    clientId: z.ZodNullable<z.ZodString>;
    clientUsername: z.ZodNullable<z.ZodString>;
    ticketId: z.ZodNullable<z.ZodString>;
    comment: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sellerId: string;
    clientId: string | null;
    clientUsername: string | null;
    comment: string | null;
    rating: number;
    ticketId: string | null;
}, {
    sellerId: string;
    clientId: string | null;
    clientUsername: string | null;
    comment: string | null;
    rating: number;
    ticketId: string | null;
}>;
export type FeedbackParseResult = z.infer<typeof FeedbackSchema>;
export declare class FeedbackParserService {
    static detect(message: Message): boolean;
    static parse(message: Message): FeedbackParseResult | null;
}
//# sourceMappingURL=feedback-parser.service.d.ts.map