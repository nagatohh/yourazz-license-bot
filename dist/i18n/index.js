"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.t = t;
exports.getUserLang = getUserLang;
exports.setUserLang = setUserLang;
const fr_1 = require("./fr");
const en_1 = require("./en");
const es_1 = require("./es");
const locales = { fr: fr_1.fr, en: en_1.en, es: es_1.es };
function t(lang, key) {
    return locales[lang]?.[key] ?? locales.fr[key] ?? key;
}
async function getUserLang(userId) {
    const { prisma } = await Promise.resolve().then(() => __importStar(require("../services/database")));
    const user = await prisma.discordUser.findUnique({ where: { discordId: userId } });
    return user?.language ?? "fr";
}
async function setUserLang(userId, lang) {
    const { prisma } = await Promise.resolve().then(() => __importStar(require("../services/database")));
    await prisma.discordUser.updateMany({
        where: { discordId: userId },
        data: { language: lang },
    });
}
//# sourceMappingURL=index.js.map