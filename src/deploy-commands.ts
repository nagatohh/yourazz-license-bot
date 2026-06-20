import { REST, Routes } from "discord.js";
import { env } from "./config/bot";
import * as licence from "./commands/licence";
import * as key from "./commands/key";
import * as admin from "./commands/admin";
import * as ia from "./commands/ia";
import * as panel from "./commands/panel";
import * as owner from "./commands/owner";
import * as ownerAdmin from "./commands/owner-admin";
import * as automation from "./commands/automation-admin";

const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);

const commands = [
  licence.data.toJSON(),
  key.data.toJSON(),
  admin.data.toJSON(),
  ia.data.toJSON(),
  panel.data.toJSON(),
  owner.data.toJSON(),
  ownerAdmin.data.toJSON(),
  automation.data.toJSON(),
];

(async () => {
  try {
    console.log(`Déploiement de ${commands.length} commandes...`);
    await rest.put(
      Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID),
      { body: commands },
    );
    console.log(`✅ ${commands.length} commandes déployées avec succès.`);
  } catch (err) {
    console.error("❌ Erreur:", err);
  }
})();
