import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import { KeyService } from "../modules/licenses/key.service";
import { UserService } from "../modules/users/user.service";
import { RoleService } from "../modules/admin/role.service";
import { successCard, errorCard, buildReply } from "../utils/cv2";
import { isSeller } from "../utils/permissions";
import { GuildMember } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("key")
  .setDescription("Gérer les clés licence")
  .addSubcommand((sub) =>
    sub
      .setName("redeem")
      .setDescription("Activer une clé licence")
      .addStringOption((opt) =>
        opt.setName("cle").setDescription("Votre clé (ex: YRZ-XXXX-XXXX-XXXX)").setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("status")
      .setDescription("Vérifier le statut d'une clé")
      .addStringOption((opt) =>
        opt.setName("cle").setDescription("La clé à vérifier").setRequired(true),
      ),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!isSeller(interaction.member as GuildMember)) {
    return interaction.reply({ ...buildReply([errorCard("Accès refusé", "Cette commande est réservée aux vendeurs Yourazz.")]), ephemeral: true });
  }

  const sub = interaction.options.getSubcommand();

  switch (sub) {
    case "redeem": return handleRedeem(interaction);
    case "status": return handleStatus(interaction);
  }
}

async function handleRedeem(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const key = interaction.options.getString("cle", true).trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 19);
  const dbUser = await UserService.getOrCreate(interaction.user);

  try {
    const { license, plan } = await KeyService.redeem(key, dbUser.id, interaction.guildId!);
    await RoleService.assignSellerRole(interaction.client, interaction.guildId!, interaction.user.id, plan.name);

    await interaction.editReply(buildReply([successCard(
      "Clé activée !",
      `Votre clé **${key}** a été activée avec succès.\n\n` +
      `📋 Plan : **${plan.displayName}**\n` +
      `⏳ Durée : **${plan.durationDays} jours**\n\n` +
      `Bienvenue parmi les vendeurs ! 🎉`,
    )]));
  } catch (err: any) {
    await interaction.editReply(buildReply([errorCard("Erreur", err.message || "Impossible d'activer cette clé.")]));
  }
}

async function handleStatus(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const key = interaction.options.getString("cle", true).trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 19);

  const keyData = await KeyService.getStatus(key);
  if (!keyData) {
    return interaction.editReply(buildReply([errorCard("Clé inconnue", "Cette clé n'existe pas.")]));
  }

  const statusMap: Record<string, string> = {
    AVAILABLE: "🟢 Disponible",
    REDEEMED: "🔵 Utilisée",
    EXPIRED: "🟡 Expirée",
    BLACKLISTED: "🔴 Blacklistée",
  };

  await interaction.editReply(buildReply([successCard(
    `Clé : ${key}`,
    `**Statut :** ${statusMap[keyData.status]}\n` +
    `**Plan :** ${keyData.plan.displayName}\n` +
    `**Durée :** ${keyData.durationDays} jours\n` +
    (keyData.redeemedBy ? `**Utilisée par :** ${keyData.redeemedBy.username}` : ""),
  )]));
}
