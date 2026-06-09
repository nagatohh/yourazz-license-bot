"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const bot_1 = require("./config/bot");
const ready_1 = require("./events/ready");
const interaction_1 = require("./events/interaction");
const database_1 = require("./services/database");
const logger_1 = require("./utils/logger");
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds],
    partials: [discord_js_1.Partials.Channel],
});
(0, ready_1.onReady)(client);
(0, interaction_1.onInteraction)(client);
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