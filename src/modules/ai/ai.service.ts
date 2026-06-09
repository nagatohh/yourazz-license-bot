import { env } from "../../config/bot";
import { logger } from "../../utils/logger";

export class AIService {
  static isAvailable(): boolean {
    return !!env.OPENAI_API_KEY;
  }

  static async generateRelanceMessage(username: string, plan: string, daysLeft: number): Promise<string | null> {
    if (!this.isAvailable()) return null;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Tu es un assistant pour une plateforme de vente. Génère un court message de relance amical (2-3 phrases max) pour un vendeur dont la licence expire bientôt. Sois professionnel mais chaleureux.",
            },
            {
              role: "user",
              content: `Le vendeur ${username} a un plan ${plan} qui expire dans ${daysLeft} jours. Génère un message de relance.`,
            },
          ],
          max_tokens: 150,
        }),
      });

      const data = await response.json() as any;
      return data.choices?.[0]?.message?.content ?? null;
    } catch (err: any) {
      logger.error("AIService", `Erreur IA: ${err.message}`);
      return null;
    }
  }
}
