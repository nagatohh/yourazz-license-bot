import { Message } from "discord.js";
import { z } from "zod";
import { EmbedReaderService } from "./embed-reader.service";

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
export const FeedbackSchema = z.object({
  sellerId: z.string().regex(/^\d{17,20}$/), // Staff — requis
  rating: z.number().int().min(1).max(5),
  clientId: z.string().regex(/^\d{17,20}$/).nullable(),
  clientUsername: z.string().nullable(),
  ticketId: z.string().nullable(),
  comment: z.string().nullable(),
});

export type FeedbackParseResult = z.infer<typeof FeedbackSchema>;

export class FeedbackParserService {
  static detect(message: Message): boolean {
    const text = EmbedReaderService.flattenMessage(message);
    return /avis\s*client|feedback|note\s*:.*\/\s*5|rating/i.test(text);
  }

  static parse(message: Message): FeedbackParseResult | null {
    const text = EmbedReaderService.flattenMessage(message);

    // Note : "(5/5)" prioritaire, sinon comptage d'emojis sur la ligne Note.
    let rating = Number(text.match(/\(\s*(\d)\s*\/\s*5\s*\)/)?.[1] ?? NaN);
    if (Number.isNaN(rating)) {
      const noteLine = text.match(/Note\s*:?\s*([^\n]+)/i)?.[1] ?? "";
      const stars = (noteLine.match(/[⭐🌟✅★]/gu) ?? []).length;
      if (stars >= 1 && stars <= 5) rating = stars;
    }

    // Vendeur = mention dans le champ "Staff:".
    const staffLine = text.match(/Staff\s*:?\s*([^\n]+)/i)?.[1] ?? "";
    const sellerId =
      staffLine.match(/<@!?(\d{17,20})>/)?.[1] ??
      staffLine.match(/(\d{17,20})/)?.[1] ??
      null;

    // Client = "username 1111887933201465395".
    const clientLine = text.match(/Client\s*:?\s*([^\n]+)/i)?.[1] ?? "";
    const clientId = clientLine.match(/(\d{17,20})/)?.[1] ?? null;
    const clientUsername =
      clientLine.replace(/<@!?\d{17,20}>/g, "").match(/([^\s@<]+)/)?.[1]?.trim() ?? null;

    // Ticket : <#id> sinon mot ; "inconnu"/"unknown" → null.
    const ticketLine = text.match(/Ticket\s*:?\s*([^\n]+)/i)?.[1] ?? "";
    const channelMention = EmbedReaderService.extractChannelMention(ticketLine);
    let ticketId: string | null = channelMention ?? (ticketLine.replace(/[#\s]/g, "").trim() || null);
    if (ticketId && /^(inconnu|unknown|n\/a|na|none)$/i.test(ticketId)) ticketId = null;

    const comment = text.match(/Commentaire\s*:?\s*([^\n]+)/i)?.[1]?.trim() ?? null;

    const candidate = {
      sellerId: sellerId ?? "",
      rating: Number.isNaN(rating) ? 0 : rating,
      clientId,
      clientUsername,
      ticketId,
      comment,
    };

    const result = FeedbackSchema.safeParse(candidate);
    return result.success ? result.data : null;
  }
}
