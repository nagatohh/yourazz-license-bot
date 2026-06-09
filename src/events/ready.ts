import { Client, ActivityType } from "discord.js";
import { startExpirationJob } from "../modules/licenses/expiration.job";
import { startWebhookServer, setClient } from "../webhook/server";
import { startStripePoller } from "../modules/payments/stripe-poller";
import { logger } from "../utils/logger";

export function onReady(client: Client) {
  client.once("ready", () => {
    logger.info("Bot", `Connecté en tant que ${client.user?.tag}`);
    logger.info("Bot", `Serveurs: ${client.guilds.cache.size}`);

    client.user?.setActivity("🏷️ /licence", { type: ActivityType.Watching });

    setClient(client);
    startWebhookServer();
    startExpirationJob(client);
    startStripePoller(client);

    console.log(`
  ╔══════════════════════════════════════════╗
  ║  🏷️  YOURAZZ LICENSE MANAGER — ONLINE   ║
  ║  ${(client.user?.tag ?? "").padEnd(38)}║
  ║  Serveurs: ${String(client.guilds.cache.size).padEnd(28)}║
  ╚══════════════════════════════════════════╝
    `);
  });
}
