import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import { env } from "./config/bot";
import { OwnerPanelService } from "./modules/owners/owner-panel.service";

// Channel cible (passé en argument ou valeur par défaut)
const CHANNEL_ID = process.argv[2] ?? "1514299095097806950";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`✅ Connecté: ${client.user?.tag}`);

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      console.error(`❌ Channel ${CHANNEL_ID} introuvable ou non textuel.`);
      client.destroy();
      process.exit(1);
    }

    const panel = OwnerPanelService.buildDashboardPanel();
    const msg = await (channel as TextChannel).send(panel as any);

    console.log(`✅ Panel Owner envoyé dans #${(channel as TextChannel).name} (message ${msg.id})`);
  } catch (err: any) {
    console.error(`❌ Erreur: ${err.message}`);
    console.error(err.stack);
    client.destroy();
    process.exit(1);
  }

  client.destroy();
  process.exit(0);
});

client.login(env.DISCORD_TOKEN);
