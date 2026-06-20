import { Message } from "discord.js";
import { z } from "zod";
import { EmbedReaderService } from "./embed-reader.service";

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
export const VouchSchema = z.object({
  vouchId: z.string().nullable(),
  sellerId: z.string().regex(/^\d{17,20}$/), // Receiver — requis
  sellerUsername: z.string().nullable(),
  clientId: z.string().regex(/^\d{17,20}$/).nullable(),
  clientUsername: z.string().nullable(),
  comment: z.string().nullable(),
  time: z.string().nullable(),
  saleChannel: z.string().nullable(),
});

export type VouchParseResult = z.infer<typeof VouchSchema>;

export class VouchParserService {
  /** Détecte si un message est un vouch. */
  static detect(message: Message): boolean {
    const text = EmbedReaderService.flattenMessage(message);
    return /vouch\s*added|new\s*vouch|vouch\s*id/i.test(text);
  }

  /**
   * Retourne le vouch parsé, ou `null` si l'info essentielle (sellerId) manque.
   * Ne lève jamais : le Core marque l'event `incomplete` si null.
   */
  static parse(message: Message): VouchParseResult | null {
    const text = EmbedReaderService.flattenMessage(message);

    const vouchId = text.match(/Vouch\s*ID\s*:?\s*#?(\d+)/i)?.[1] ?? null;

    // Client = bloc Sender/From ; Vendeur = bloc Receiver/To.
    // Deux formats possibles : "Sender (From)" / "Receiver (To)" OU juste "From" / "To".
    const clientId =
      EmbedReaderService.idAfterLabel(text, "Sender", "Receiver") ??
      EmbedReaderService.idAfterLabel(text, "From", "To");
    const sellerId =
      EmbedReaderService.idAfterLabel(text, "Receiver") ??
      EmbedReaderService.idAfterLabel(text, "To");
    const clientUsername =
      EmbedReaderService.usernameAfterLabel(text, "Sender", "Receiver") ??
      EmbedReaderService.usernameAfterLabel(text, "From", "To");
    const sellerUsername =
      EmbedReaderService.usernameAfterLabel(text, "Receiver") ??
      EmbedReaderService.usernameAfterLabel(text, "To");

    // Le commentaire est souvent en blockquote cité : `Comment\n> "..."`.
    const comment =
      text.match(/Comment[\s\S]*?["“]([^"”\n]+)["”]/i)?.[1]?.trim() ??
      text
        .match(/Comment\s*:?\s*\n+\s*>?\s*([^\n]+)/i)?.[1]
        ?.replace(/^["“]|["”]$/g, "")
        .trim() ??
      null;
    const time = text.match(/Time\s*:?\s*([^\n]+)/i)?.[1]?.trim() ?? null;
    const saleChannel =
      text.match(/Channel\s*:?\s*#?\s*([^\s\n]+)/i)?.[1]?.trim() ?? null;

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

    const result = VouchSchema.safeParse(candidate);
    return result.success ? result.data : null;
  }
}
