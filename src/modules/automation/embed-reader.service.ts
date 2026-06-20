import { Message, Embed } from "discord.js";

/**
 * Lecture flexible des embeds Discord. Les formats peuvent changer : on aplatit
 * tout le texte (title/description/fields/footer/author + content du message)
 * en une seule chaîne sur laquelle les parsers appliquent leurs regexes.
 *
 * ⚠️ Pour lire les embeds d'un AUTRE bot, l'intent privilégié MESSAGE CONTENT
 * doit être activé, sinon `message.embeds` / `content` reviennent vides.
 */
export class EmbedReaderService {
  /** Concatène le texte d'un embed (title, description, fields, footer, author). */
  static flattenEmbed(embed: Embed): string {
    const parts: string[] = [];
    if (embed.title) parts.push(embed.title);
    if (embed.author?.name) parts.push(embed.author.name);
    if (embed.description) parts.push(embed.description);
    for (const f of embed.fields ?? []) {
      parts.push(`${f.name}\n${f.value}`);
    }
    if (embed.footer?.text) parts.push(embed.footer.text);
    return parts.join("\n");
  }

  /** Texte complet d'un message : content + tous les embeds aplatis. */
  static flattenMessage(message: Message): string {
    const parts: string[] = [];
    if (message.content) parts.push(message.content);
    for (const embed of message.embeds ?? []) {
      parts.push(this.flattenEmbed(embed));
    }
    return parts.join("\n");
  }

  /** Métadonnées utiles présentes dans un embed (timestamp brut, premier titre). */
  static meta(message: Message) {
    const first = message.embeds?.[0];
    return {
      messageId: message.id,
      channelId: message.channelId,
      title: first?.title ?? null,
      timestamp: first?.timestamp ?? null,
      authorName: first?.author?.name ?? null,
    };
  }

  /** Tous les IDs Discord (17-20 chiffres) trouvés dans un texte, dans l'ordre. */
  static extractIds(text: string): string[] {
    return [...text.matchAll(/(\d{17,20})/g)].map((m) => m[1]);
  }

  /** IDs mentionnés au format <@id> / <@!id>. */
  static extractUserMentions(text: string): string[] {
    return [...text.matchAll(/<@!?(\d{17,20})>/g)].map((m) => m[1]);
  }

  /** ID de salon mentionné au format <#id>. */
  static extractChannelMention(text: string): string | null {
    const m = text.match(/<#(\d{17,20})>/);
    return m ? m[1] : null;
  }

  /**
   * Premier ID (entre parenthèses ou nu) trouvé après un label donné, en se
   * limitant éventuellement à la portion de texte avant un autre label.
   */
  static idAfterLabel(text: string, label: string, stopLabel?: string): string | null {
    const start = text.indexOf(label);
    if (start === -1) return null;
    let slice = text.slice(start + label.length);
    if (stopLabel) {
      const stop = slice.indexOf(stopLabel);
      if (stop !== -1) slice = slice.slice(0, stop);
    }
    const m = slice.match(/(\d{17,20})/);
    return m ? m[1] : null;
  }

  /** Username affiché juste avant un ID entre parenthèses, après un label. */
  static usernameAfterLabel(text: string, label: string, stopLabel?: string): string | null {
    const start = text.indexOf(label);
    if (start === -1) return null;
    let slice = text.slice(start + label.length);
    if (stopLabel) {
      const stop = slice.indexOf(stopLabel);
      if (stop !== -1) slice = slice.slice(0, stop);
    }
    // "… — heaven2wish (1163239654527619103)"
    const dash = slice.match(/[—-]\s*([^\s(]+)\s*\(\d{17,20}\)/);
    if (dash) return dash[1];
    return null;
  }
}
