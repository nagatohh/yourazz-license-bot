import { Client, GatewayIntentBits } from "discord.js";
import { env } from "./config/bot";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  const guild = client.guilds.cache.get(env.DISCORD_GUILD_ID);
  if (!guild) { console.error("Guild not found"); process.exit(1); }

  console.log(`Serveur: ${guild.name}`);
  console.log(`Owner du serveur: ${guild.ownerId}`);

  const roles = guild.roles.cache
    .filter(r => r.name.toLowerCase().includes("own") || r.name.toLowerCase().includes("admin"))
    .sort((a, b) => b.position - a.position);

  console.log("\nRoles trouvés:");
  roles.forEach(r => console.log(`  - "${r.name}" → ID: ${r.id}`));

  client.destroy();
  process.exit(0);
});

client.login(env.DISCORD_TOKEN);
