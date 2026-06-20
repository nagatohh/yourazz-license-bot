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
const discord_js_1 = require("discord.js");
const bot_1 = require("./config/bot");
const licence = __importStar(require("./commands/licence"));
const key = __importStar(require("./commands/key"));
const admin = __importStar(require("./commands/admin"));
const ia = __importStar(require("./commands/ia"));
const panel = __importStar(require("./commands/panel"));
const owner = __importStar(require("./commands/owner"));
const ownerAdmin = __importStar(require("./commands/owner-admin"));
const automation = __importStar(require("./commands/automation-admin"));
const rest = new discord_js_1.REST({ version: "10" }).setToken(bot_1.env.DISCORD_TOKEN);
const commands = [
    licence.data.toJSON(),
    key.data.toJSON(),
    admin.data.toJSON(),
    ia.data.toJSON(),
    panel.data.toJSON(),
    owner.data.toJSON(),
    ownerAdmin.data.toJSON(),
    automation.data.toJSON(),
];
(async () => {
    try {
        console.log(`Déploiement de ${commands.length} commandes...`);
        await rest.put(discord_js_1.Routes.applicationGuildCommands(bot_1.env.DISCORD_CLIENT_ID, bot_1.env.DISCORD_GUILD_ID), { body: commands });
        console.log(`✅ ${commands.length} commandes déployées avec succès.`);
    }
    catch (err) {
        console.error("❌ Erreur:", err);
    }
})();
//# sourceMappingURL=deploy-commands.js.map