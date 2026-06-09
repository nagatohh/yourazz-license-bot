"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const bot_1 = require("../../config/bot");
const logger_1 = require("../../utils/logger");
class AIService {
    static isAvailable() {
        return !!bot_1.env.OPENAI_API_KEY;
    }
    static async generateRelanceMessage(username, plan, daysLeft) {
        if (!this.isAvailable())
            return null;
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${bot_1.env.OPENAI_API_KEY}`,
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
            const data = await response.json();
            return data.choices?.[0]?.message?.content ?? null;
        }
        catch (err) {
            logger_1.logger.error("AIService", `Erreur IA: ${err.message}`);
            return null;
        }
    }
}
exports.AIService = AIService;
//# sourceMappingURL=ai.service.js.map