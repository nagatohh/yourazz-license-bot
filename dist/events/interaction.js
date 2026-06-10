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
exports.onInteraction = onInteraction;
const licence = __importStar(require("../commands/licence"));
const key = __importStar(require("../commands/key"));
const admin = __importStar(require("../commands/admin"));
const ia = __importStar(require("../commands/ia"));
const panel = __importStar(require("../commands/panel"));
const plan_select_1 = require("../interactions/plan-select");
const buttons_1 = require("../interactions/buttons");
const modals_1 = require("../interactions/modals");
const panel_buttons_1 = require("../interactions/panel-buttons");
const confirm_payment_1 = require("../interactions/confirm-payment");
const lang_select_1 = require("../interactions/lang-select");
const translate_buttons_1 = require("../interactions/translate-buttons");
const logger_1 = require("../utils/logger");
const rateLimit_1 = require("../utils/rateLimit");
const cv2_1 = require("../utils/cv2");
const commands = new Map();
commands.set("licence", licence);
commands.set("key", key);
commands.set("admin", admin);
commands.set("ia", ia);
commands.set("license-panel", panel);
function onInteraction(client) {
    client.on("interactionCreate", async (interaction) => {
        try {
            if (interaction.isChatInputCommand()) {
                const sub = interaction.options.getSubcommand(false);
                const commandKey = sub ? `${interaction.commandName} ${sub}` : interaction.commandName;
                const { ok, remaining } = (0, rateLimit_1.checkCooldown)(interaction.user.id, commandKey);
                if (!ok) {
                    return interaction.reply({
                        ...(0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Trop vite !", `Attends **${remaining}s** avant de réutiliser cette commande.`)]),
                        ephemeral: true,
                    });
                }
                const command = commands.get(interaction.commandName);
                if (command)
                    await command.execute(interaction);
                return;
            }
            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === "yrz_plan_select") {
                    await (0, plan_select_1.handlePlanSelect)(interaction);
                }
                if (interaction.customId === "yrz_lang_select" || interaction.customId === "select_language") {
                    await (0, lang_select_1.handleLangSelect)(interaction);
                }
                return;
            }
            if (interaction.isButton()) {
                // Rate limit sur les boutons sensibles
                const { ok, remaining } = (0, rateLimit_1.checkCooldown)(interaction.user.id, `btn:${interaction.customId}`);
                if (!ok) {
                    return interaction.reply({
                        ...(0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Trop vite !", `Attends **${remaining}s** avant de réessayer.`)]),
                        ephemeral: true,
                    });
                }
                if (interaction.customId.startsWith("translate_")) {
                    await (0, translate_buttons_1.handleTranslateButton)(interaction);
                    return;
                }
                if (interaction.customId.startsWith("yrz_panel_")) {
                    await (0, panel_buttons_1.handlePanelButton)(interaction);
                    return;
                }
                if (interaction.customId.startsWith("yrz_confirm_payment_")) {
                    await (0, confirm_payment_1.handleConfirmPayment)(interaction);
                    return;
                }
                if (interaction.customId.startsWith("yrz_")) {
                    await (0, buttons_1.handleButton)(interaction);
                }
                return;
            }
            if (interaction.isModalSubmit()) {
                if (interaction.customId.startsWith("yrz_")) {
                    await (0, modals_1.handleModal)(interaction);
                }
                return;
            }
        }
        catch (err) {
            logger_1.logger.error("Interaction", err.message, { stack: err.stack });
            const reply = { content: "❌ Une erreur est survenue.", ephemeral: true };
            try {
                if (interaction.isRepliable()) {
                    if (interaction.deferred || interaction.replied) {
                        await interaction.editReply(reply);
                    }
                    else {
                        await interaction.reply(reply);
                    }
                }
            }
            catch { }
        }
    });
}
//# sourceMappingURL=interaction.js.map