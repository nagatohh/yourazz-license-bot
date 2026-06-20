import { Client, GatewayIntentBits, Partials } from "discord.js";
import { env } from "./config/bot";
import { onReady } from "./events/ready";
import { onInteraction } from "./events/interaction";
import { onMessage } from "./events/message";
import { prisma } from "./services/database";
import { logger } from "./utils/logger";

const client = new Client({
  // GuildMessages + MessageContent requis pour lire les embeds postés par le
  // bot externe dans les salons logs (MESSAGE CONTENT = intent privilégié, à
  // activer dans le Discord Developer Portal).
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

onReady(client);
onInteraction(client);
onMessage(client);

async function start() {
  try {
    await prisma.$connect();
    logger.info("Database", "Connecté à PostgreSQL");
    await client.login(env.DISCORD_TOKEN);
  } catch (err: any) {
    logger.error("Boot", `Erreur au démarrage: ${err.message}`);
    process.exit(1);
  }
}

start();

process.on("unhandledRejection", (err: any) => {
  logger.error("Process", `Unhandled rejection: ${err?.message ?? err}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  client.destroy();
  process.exit(0);
});
