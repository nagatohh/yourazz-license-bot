import { ModalSubmitInteraction } from "discord.js";
import { KeyService } from "../modules/licenses/key.service";
import { UserService } from "../modules/users/user.service";
import { RoleService } from "../modules/admin/role.service";
import { successCard, errorCard, buildReply } from "../utils/cv2";

export async function handleModal(interaction: ModalSubmitInteraction) {
  if (interaction.customId === "yrz_redeem_modal") {
    return handleRedeemModal(interaction);
  }
}

async function handleRedeemModal(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const key = interaction.fields.getTextInputValue("key_input").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 19);
  const dbUser = await UserService.getOrCreate(interaction.user);

  try {
    const { license, plan } = await KeyService.redeem(key, dbUser.id, interaction.guildId!);
    await RoleService.assignSellerRole(interaction.client, interaction.guildId!, interaction.user.id, plan.name);

    await interaction.editReply(buildReply([successCard(
      "Clé activée !",
      `✅ Licence **${plan.displayName}** activée pour ${plan.durationDays} jours.\n\nBienvenue parmi les vendeurs ! 🎉`,
    )]));
  } catch (err: any) {
    await interaction.editReply(buildReply([errorCard("Erreur", err.message || "Impossible d'activer cette clé.")]));
  }
}
