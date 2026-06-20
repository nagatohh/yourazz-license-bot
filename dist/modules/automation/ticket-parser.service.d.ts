import { Message } from "discord.js";
import { z } from "zod";
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
export declare const TicketSchema: z.ZodObject<{
    ticketId: z.ZodNullable<z.ZodString>;
    sellerId: z.ZodNullable<z.ZodString>;
    sellerUsername: z.ZodNullable<z.ZodString>;
    eventType: z.ZodEnum<["CLOSED", "CLAIMED"]>;
}, "strip", z.ZodTypeAny, {
    eventType: "CLOSED" | "CLAIMED";
    sellerId: string | null;
    sellerUsername: string | null;
    ticketId: string | null;
}, {
    eventType: "CLOSED" | "CLAIMED";
    sellerId: string | null;
    sellerUsername: string | null;
    ticketId: string | null;
}>;
export type TicketParseResult = z.infer<typeof TicketSchema>;
export declare class TicketParserService {
    /** Normalise le texte : retire le markdown gras et les backticks. */
    private static normalize;
    static detect(message: Message): boolean;
    static parse(message: Message): TicketParseResult | null;
}
//# sourceMappingURL=ticket-parser.service.d.ts.map