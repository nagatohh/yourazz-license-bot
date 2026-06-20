import { Client, GatewayIntentBits, OverwriteType } from "discord.js";
import { env } from "./config/bot";

const OWNER_ROLE_ID = "1513846685615526049";
const CATEGORY_ID = "1514299090626805790";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  const guild = client.guilds.cache.get(env.DISCORD_GUILD_ID);
  if (!guild) { process.exit(1); }

  const category = guild.channels.cache.get(CATEGORY_ID);
  if (!category) { console.error("Catégorie non trouvée"); process.exit(1); }

  // Update category permissions
  await category.permissionOverwrites.set([
    { id: guild.id, deny: ["ViewChannel"] },
    { id: OWNER_ROLE_ID, allow: ["ViewChannel"], deny: ["SendMessages"] },
  ]);
  console.log("✅ Permissions catégorie mises à jour");

  // Update all children
  const children = guild.channels.cache.filter(ch => ch.parentId === CATEGORY_ID);
  for (const [, ch] of children) {
    if (ch.name.includes("support")) {
      await ch.permissionOverwrites.set([
        { id: guild.id, deny: ["ViewChannel"] },
        { id: OWNER_ROLE_ID, allow: ["ViewChannel", "SendMessages"] },
      ]);
    } else {
      await ch.permissionOverwrites.set([
        { id: guild.id, deny: ["ViewChannel"] },
        { id: OWNER_ROLE_ID, allow: ["ViewChannel"], deny: ["SendMessages"] },
      ]);
    }
    console.log(`   ✅ ${ch.name}`);
  }

  console.log("\n🎉 Permissions configurées — rôle 'own' a accès en lecture");
  client.destroy();
  process.exit(0);
});

client.login(env.DISCORD_TOKEN);
