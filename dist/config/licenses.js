"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REMINDER_DAYS = exports.PLANS = void 0;
const bot_1 = require("./bot");
exports.PLANS = {
    vendeur: {
        name: "vendeur",
        displayName: "Vendeur",
        emoji: "🏷️",
        price: 2500,
        currency: "EUR",
        durationDays: 30,
        maxProducts: -1,
        roleId: bot_1.env.SELLER_BASIC_ROLE_ID,
        features: [
            "Accès vendeur complet",
            "Produits illimités",
            "Licence 30 jours",
            "Support prioritaire",
        ],
        color: 0xdc2626,
    },
};
exports.REMINDER_DAYS = [7, 3, 1];
//# sourceMappingURL=licenses.js.map