import { Client, ActivityType } from "discord.js";
import { startExpirationJob } from "../modules/licenses/expiration.job";
import { startWebhookServer, setClient } from "../webhook/server";
import { startStripePoller } from "../modules/payments/stripe-poller";
import { startOwnerJobs } from "../modules/owners/owner.job";
import { OwnerSetupService } from "../modules/owners/owner-setup.service";
import { OwnerLeaderboardService } from "../modules/owners/owner-leaderboard.service";
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
    startOwnerJobs(client);

    OwnerSetupService.getConfig().then((config) => {
      if (config?.leaderboardChannelId) {
        OwnerLeaderboardService.setChannel(config.leaderboardChannelId);
      }
    });

    console.log(`
  ╔══════════════════════════════════════════╗
  ║  🏷️  YOURAZZ LICENSE MANAGER — ONLINE   ║
  ║  ${(client.user?.tag ?? "").padEnd(38)}║
  ║  Serveurs: ${String(client.guilds.cache.size).padEnd(28)}║
  ╚══════════════════════════════════════════╝
    `);
  });
}
