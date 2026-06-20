"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.t = t;
exports.getUserLang = getUserLang;
exports.setUserLang = setUserLang;
const fr_1 = require("./fr");
const en_1 = require("./en");
const es_1 = require("./es");
const database_1 = require("../services/database");
const locales = { fr: fr_1.fr, en: en_1.en, es: es_1.es };
function t(lang, key) {
    return locales[lang]?.[key] ?? locales.fr[key] ?? key;
}
async function getUserLang(userId) {
    const user = await database_1.prisma.discordUser.findUnique({ where: { discordId: userId } });
    return user?.language ?? "fr";
}
async function setUserLang(userId, lang) {
    await database_1.prisma.discordUser.updateMany({
        where: { discordId: userId },
        data: { language: lang },
    });
}
//# sourceMappingURL=index.js.map