import { Message, Embed } from "discord.js";
/**
 * Lecture flexible des embeds Discord. Les formats peuvent changer : on aplatit
 * tout le texte (title/description/fields/footer/author + content du message)
 * en une seule chaîne sur laquelle les parsers appliquent leurs regexes.
 *
 * ⚠️ Pour lire les embeds d'un AUTRE bot, l'intent privilégié MESSAGE CONTENT
 * doit être activé, sinon `message.embeds` / `content` reviennent vides.
 */
export declare class EmbedReaderService {
    /** Concatène le texte d'un embed (title, description, fields, footer, author). */
    static flattenEmbed(embed: Embed): string;
    /**
     * Récupère récursivement le texte des Text Display (Components V2).
     * Le bot externe Yourazz poste en containers/text displays (flags 32768),
     * pas en embeds → le texte vit dans `message.components`, pas `message.embeds`.
     * Gère les instances discord.js (`.content`/`.components`) ET le brut (`.data.*`).
     */
    static collectComponentText(components: any[]): string[];
    /** Texte complet d'un message : content + embeds + Components V2, markdown nettoyé. */
    static flattenMessage(message: Message): string;
    /** Métadonnées utiles présentes dans un embed (timestamp brut, premier titre). */
    static meta(message: Message): {
        messageId: string;
        channelId: string;
        title: string | null;
        timestamp: string | null;
        authorName: string | null;
    };
    /** Tous les IDs Discord (17-20 chiffres) trouvés dans un texte, dans l'ordre. */
    static extractIds(text: string): string[];
    /** IDs mentionnés au format <@id> / <@!id>. */
    static extractUserMentions(text: string): string[];
    /** ID de salon mentionné au format <#id>. */
    static extractChannelMention(text: string): string | null;
    /**
     * Premier ID (entre parenthèses ou nu) trouvé après un label donné, en se
     * limitant éventuellement à la portion de texte avant un autre label.
     */
    static idAfterLabel(text: string, label: string, stopLabel?: string): string | null;
    /** Username affiché juste avant un ID entre parenthèses, après un label. */
    static usernameAfterLabel(text: string, label: string, stopLabel?: string): string | null;
}
//# sourceMappingURL=embed-reader.service.d.ts.map