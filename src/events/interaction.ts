import { Client, Interaction } from "discord.js";
import * as licence from "../commands/licence";
import * as key from "../commands/key";
import * as admin from "../commands/admin";
import * as ia from "../commands/ia";
import * as panel from "../commands/panel";
import { handlePlanSelect } from "../interactions/plan-select";
import { handleButton } from "../interactions/buttons";
import { handleModal } from "../interactions/modals";
import { handlePanelButton } from "../interactions/panel-buttons";
import { handleConfirmPayment } from "../interactions/confirm-payment";
import { handleLangSelect } from "../interactions/lang-select";
import { handleTranslateButton } from "../interactions/translate-buttons";
import { logger } from "../utils/logger";
import { checkCooldown } from "../utils/rateLimit";
import { buildReply, errorCard } from "../utils/cv2";

const commands = new Map<string, { execute: (i: any) => Promise<any> }>();
commands.set("licence", licence);
commands.set("key", key);
commands.set("admin", admin);
commands.set("ia", ia);
commands.set("license-panel", panel);

export function onInteraction(client: Client) {
  client.on("interactionCreate", async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        const sub = interaction.options.getSubcommand(false);
        const commandKey = sub ? `${interaction.commandName} ${sub}` : interaction.commandName;
        const { ok, remaining } = checkCooldown(interaction.user.id, commandKey);

        if (!ok) {
          return interaction.reply({
            ...buildReply([errorCard("Trop vite !", `Attends **${remaining}s** avant de réutiliser cette commande.`)]),
            ephemeral: true,
          });
        }

        const command = commands.get(interaction.commandName);
        if (command) await command.execute(interaction);
        return;
      }

      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === "yrz_plan_select") {
          await handlePlanSelect(interaction);
        }
        if (interaction.customId === "yrz_lang_select" || interaction.customId === "select_language") {
          await handleLangSelect(interaction);
        }
        return;
      }

      if (interaction.isButton()) {
        // Rate limit sur les boutons sensibles
        const { ok, remaining } = checkCooldown(interaction.user.id, `btn:${interaction.customId}`);
        if (!ok) {
          return interaction.reply({
            ...buildReply([errorCard("Trop vite !", `Attends **${remaining}s** avant de réessayer.`)]),
            ephemeral: true,
          });
        }

        if (interaction.customId.startsWith("translate_")) {
          await handleTranslateButton(interaction);
          return;
        }
        if (interaction.customId.startsWith("yrz_panel_")) {
          await handlePanelButton(interaction);
          return;
        }
        if (interaction.customId.startsWith("yrz_confirm_payment_")) {
          await handleConfirmPayment(interaction);
          return;
        }
        if (interaction.customId.startsWith("yrz_")) {
          await handleButton(interaction);
        }
        return;
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith("yrz_")) {
          await handleModal(interaction);
        }
        return;
      }
    } catch (err: any) {
      logger.error("Interaction", err.message, { stack: err.stack });
      const reply = { content: "❌ Une erreur est survenue.", ephemeral: true };
      try {
        if (interaction.isRepliable()) {
          if ((interaction as any).deferred || (interaction as any).replied) {
            await (interaction as any).editReply(reply);
          } else {
            await (interaction as any).reply(reply);
          }
        }
      } catch {}
    }
  });
}
