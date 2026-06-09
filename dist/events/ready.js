"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onReady = onReady;
const discord_js_1 = require("discord.js");
const expiration_job_1 = require("../modules/licenses/expiration.job");
const server_1 = require("../webhook/server");
const stripe_poller_1 = require("../modules/payments/stripe-poller");
const logger_1 = require("../utils/logger");
function onReady(client) {
    client.once("ready", () => {
        logger_1.logger.info("Bot", `Connecté en tant que ${client.user?.tag}`);
        logger_1.logger.info("Bot", `Serveurs: ${client.guilds.cache.size}`);
        client.user?.setActivity("🏷️ /licence", { type: discord_js_1.ActivityType.Watching });
        (0, server_1.setClient)(client);
        (0, server_1.startWebhookServer)();
        (0, expiration_job_1.startExpirationJob)(client);
        (0, stripe_poller_1.startStripePoller)(client);
        console.log(`
  ╔══════════════════════════════════════════╗
  ║  🏷️  YOURAZZ LICENSE MANAGER — ONLINE   ║
  ║  ${(client.user?.tag ?? "").padEnd(38)}║
  ║  Serveurs: ${String(client.guilds.cache.size).padEnd(28)}║
  ╚══════════════════════════════════════════╝
    `);
    });
}
//# sourceMappingURL=ready.js.map