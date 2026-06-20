"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const bot_1 = require("./config/bot");
const ready_1 = require("./events/ready");
const interaction_1 = require("./events/interaction");
const message_1 = require("./events/message");
const database_1 = require("./services/database");
const logger_1 = require("./utils/logger");
const client = new discord_js_1.Client({
    // GuildMessages + MessageContent requis pour lire les embeds postés par le
    // bot externe dans les salons logs (MESSAGE CONTENT = intent privilégié, à
    // activer dans le Discord Developer Portal).
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
    partials: [discord_js_1.Partials.Channel, discord_js_1.Partials.Message],
});
(0, ready_1.onReady)(client);
(0, interaction_1.onInteraction)(client);
(0, message_1.onMessage)(client);
async function start() {
    try {
        await database_1.prisma.$connect();
        logger_1.logger.info("Database", "Connecté à PostgreSQL");
        await client.login(bot_1.env.DISCORD_TOKEN);
    }
    catch (err) {
        logger_1.logger.error("Boot", `Erreur au démarrage: ${err.message}`);
        process.exit(1);
    }
}
start();
process.on("unhandledRejection", (err) => {
    logger_1.logger.error("Process", `Unhandled rejection: ${err?.message ?? err}`);
});
process.on("SIGINT", async () => {
    await database_1.prisma.$disconnect();
    client.destroy();
    process.exit(0);
});
//# sourceMappingURL=index.js.map