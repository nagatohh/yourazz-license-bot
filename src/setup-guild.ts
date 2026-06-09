import "dotenv/config";
import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } from "discord.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID!);
  console.log(`Connecté à: ${guild.name}`);

  // Créer le rôle Vendeur
  let sellerRole = guild.roles.cache.find((r) => r.name === "Vendeur Yourazz");
  if (!sellerRole) {
    sellerRole = await guild.roles.create({
      name: "Vendeur Yourazz",
      color: 0xdc2626,
      hoist: true,
      reason: "Yourazz License Manager — rôle vendeur automatique",
    });
    console.log(`✅ Rôle créé: ${sellerRole.name} (${sellerRole.id})`);
  } else {
    console.log(`⚡ Rôle existant: ${sellerRole.name} (${sellerRole.id})`);
  }

  // Créer le canal de logs licences
  let logChannel = guild.channels.cache.find(
    (c) => c.name === "license-logs" && c.type === ChannelType.GuildText,
  );
  if (!logChannel) {
    logChannel = await guild.channels.create({
      name: "license-logs",
      type: ChannelType.GuildText,
      topic: "Logs automatiques des licences vendeur — Yourazz License Manager",
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: sellerRole.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
      ],
      reason: "Yourazz License Manager — canal logs staff",
    });
    console.log(`✅ Canal créé: #${logChannel.name} (${logChannel.id})`);
  } else {
    console.log(`⚡ Canal existant: #${logChannel.name} (${logChannel.id})`);
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Ajoute ces valeurs dans ton .env :`);
  console.log(`SELLER_BASIC_ROLE_ID=${sellerRole.id}`);
  console.log(`LICENSE_LOG_CHANNEL_ID=${logChannel.id}`);
  console.log(`STAFF_LOG_CHANNEL_ID=${logChannel.id}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━`);

  client.destroy();
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
