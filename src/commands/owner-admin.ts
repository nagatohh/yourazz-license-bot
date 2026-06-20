import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from "discord.js";
import { OwnerService } from "../modules/owners/owner.service";
import { OwnerLeaderboardService } from "../modules/owners/owner-leaderboard.service";
import { OwnerSetupService } from "../modules/owners/owner-setup.service";
import { isAdmin } from "../utils/permissions";
import { buildReply, successCard, errorCard, ACCENT } from "../utils/cv2";
import { env } from "../config/bot";

export const data = new SlashCommandBuilder()
  .setName("owner-admin")
  .setDescription("Administration du système Owner Manager")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sub) =>
    sub
      .setName("create")
      .setDescription("Créer un Owner")
      .addUserOption((opt) => opt.setName("user").setDescription("L'utilisateur à promouvoir Owner").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove")
      .setDescription("Retirer un Owner")
      .addUserOption((opt) => opt.setName("user").setDescription("L'Owner à retirer").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("score")
      .setDescription("Modifier le score d'un Owner")
      .addUserOption((opt) => opt.setName("user").setDescription("L'Owner").setRequired(true))
      .addIntegerOption((opt) => opt.setName("points").setDescription("Points à ajouter (négatif pour retirer)").setRequired(true))
      .addStringOption((opt) => opt.setName("raison").setDescription("Raison").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub.setName("leaderboard").setDescription("Forcer la mise à jour du leaderboard"),
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("Voir tous les Owners"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("add-recruit")
      .setDescription("Ajouter une recrue à un Owner")
      .addUserOption((opt) => opt.setName("owner").setDescription("L'Owner").setRequired(true))
      .addUserOption((opt) => opt.setName("member").setDescription("Le membre à recruter").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove-recruit")
      .setDescription("Retirer une recrue d'un Owner")
      .addUserOption((opt) => opt.setName("owner").setDescription("L'Owner").setRequired(true))
      .addUserOption((opt) => opt.setName("member").setDescription("Le membre à retirer").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("transfer")
      .setDescription("Transférer une recrue d'un Owner à un autre")
      .addUserOption((opt) => opt.setName("from").setDescription("Owner source").setRequired(true))
      .addUserOption((opt) => opt.setName("to").setDescription("Owner destination").setRequired(true))
      .addUserOption((opt) => opt.setName("member").setDescription("Le membre à transférer").setRequired(true)),
  )
  .addSubcommand((sub) =>
    sub
      .setName("setup")
      .setDescription("Créer la catégorie Owner Management avec tous les channels")
      .addRoleOption((opt) => opt.setName("owner-role").setDescription("Rôle Owner (accès aux channels)"))
  )
  .addSubcommand((sub) =>
    sub.setName("refresh-panel").setDescription("Rafraîchir tous les panels Owner"),
  )
  .addSubcommand((sub) =>
    sub.setName("destroy").setDescription("Supprimer la catégorie Owner Management"),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has("Administrator") && !isAdmin(interaction.member as any)) {
    return interaction.reply({
      ...buildReply([errorCard("Accès refusé", "Permissions admin requises.")]),
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });
  const sub = interaction.options.getSubcommand();

  switch (sub) {
    case "create":
      return handleCreate(interaction);
    case "remove":
      return handleRemove(interaction);
    case "score":
      return handleScore(interaction);
    case "leaderboard":
      return handleLeaderboard(interaction);
    case "list":
      return handleList(interaction);
    case "add-recruit":
      return handleAddRecruit(interaction);
    case "remove-recruit":
      return handleRemoveRecruit(interaction);
    case "transfer":
      return handleTransfer(interaction);
    case "setup":
      return handleSetup(interaction);
    case "refresh-panel":
      return handleRefreshPanel(interaction);
    case "destroy":
      return handleDestroy(interaction);
  }
}

async function handleCreate(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user", true);
  const existing = await OwnerService.getByDiscordId(user.id);
  if (existing) {
    return interaction.editReply(buildReply([errorCard("Déjà Owner", `${user} est déjà un Owner.`)]));
  }

  await OwnerService.create(user.id, user.username);
  await interaction.editReply(buildReply([successCard("Owner créé", `${user} est maintenant un Owner ! 👑`)]));
}

async function handleRemove(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user", true);
  const existing = await OwnerService.getByDiscordId(user.id);
  if (!existing) {
    return interaction.editReply(buildReply([errorCard("Introuvable", `${user} n'est pas un Owner.`)]));
  }

  await OwnerService.remove(user.id);
  await interaction.editReply(buildReply([successCard("Owner retiré", `${user} n'est plus un Owner.`)]));
}

async function handleScore(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user", true);
  const points = interaction.options.getInteger("points", true);
  const raison = interaction.options.getString("raison", true);

  const owner = await OwnerService.getByDiscordId(user.id);
  if (!owner) {
    return interaction.editReply(buildReply([errorCard("Introuvable", `${user} n'est pas un Owner.`)]));
  }

  await OwnerService.manualScore(owner.id, points, raison);
  const sign = points > 0 ? "+" : "";
  await interaction.editReply(
    buildReply([successCard("Score modifié", `${sign}${points} pts pour ${user}\nRaison : ${raison}`)]),
  );
}

async function handleLeaderboard(interaction: ChatInputCommandInteraction) {
  await OwnerLeaderboardService.update(interaction.client);
  await interaction.editReply(buildReply([successCard("Leaderboard", "Classement mis à jour ! ✅")]));
}

async function handleList(interaction: ChatInputCommandInteraction) {
  const owners = await OwnerService.getAll();

  if (owners.length === 0) {
    return interaction.editReply(buildReply([errorCard("Vide", "Aucun Owner enregistré.")]));
  }

  const lines = owners.map((o, i) => {
    const tierInfo = OwnerService.getTierInfo(o.tier);
    const activeTeam = o.team.filter((m) => m.status === "ACTIVE").length;
    return `\`${i + 1}.\` ${tierInfo.emoji} <@${o.discordId}> — **${o.totalScore} pts** • ${activeTeam} actifs`;
  });

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.primary)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## 👑 Owners (${owners.length})`),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join("\n")))
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("-# Yourazz Owner Manager System"),
    );

  await interaction.editReply(buildReply([container]));
}

async function handleAddRecruit(interaction: ChatInputCommandInteraction) {
  const ownerUser = interaction.options.getUser("owner", true);
  const memberUser = interaction.options.getUser("member", true);

  const owner = await OwnerService.getByDiscordId(ownerUser.id);
  if (!owner) {
    return interaction.editReply(buildReply([errorCard("Introuvable", `${ownerUser} n'est pas un Owner.`)]));
  }

  await OwnerService.addRecruit(owner.id, memberUser.id, memberUser.username);
  await interaction.editReply(
    buildReply([successCard("Recrue ajoutée", `${memberUser} ajouté à l'équipe de ${ownerUser}.`)]),
  );
}

async function handleRemoveRecruit(interaction: ChatInputCommandInteraction) {
  const ownerUser = interaction.options.getUser("owner", true);
  const memberUser = interaction.options.getUser("member", true);

  const owner = await OwnerService.getByDiscordId(ownerUser.id);
  if (!owner) {
    return interaction.editReply(buildReply([errorCard("Introuvable", `${ownerUser} n'est pas un Owner.`)]));
  }

  await OwnerService.removeRecruit(owner.id, memberUser.id);
  await interaction.editReply(
    buildReply([successCard("Recrue retirée", `${memberUser} retiré de l'équipe de ${ownerUser}.`)]),
  );
}

async function handleTransfer(interaction: ChatInputCommandInteraction) {
  const fromUser = interaction.options.getUser("from", true);
  const toUser = interaction.options.getUser("to", true);
  const memberUser = interaction.options.getUser("member", true);

  const fromOwner = await OwnerService.getByDiscordId(fromUser.id);
  const toOwner = await OwnerService.getByDiscordId(toUser.id);

  if (!fromOwner || !toOwner) {
    return interaction.editReply(buildReply([errorCard("Erreur", "Un des Owners n'existe pas.")]));
  }

  await OwnerService.transferRecruit(fromOwner.id, toOwner.id, memberUser.id);
  await interaction.editReply(
    buildReply([successCard("Transfert effectué", `${memberUser} transféré de ${fromUser} vers ${toUser}.`)]),
  );
}

async function handleSetup(interaction: ChatInputCommandInteraction) {
  const ownerRole = interaction.options.getRole("owner-role");
  const guild = interaction.guild!;

  await OwnerSetupService.setup(guild, ownerRole?.id, env.ADMIN_ROLE_ID);
  await interaction.editReply(
    buildReply([successCard("Setup terminé", "Catégorie **👑 OWNER MANAGEMENT** créée avec tous les channels et panels.")]),
  );
}

async function handleRefreshPanel(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  await OwnerSetupService.refreshAllPanels(interaction.client, guild);
  await interaction.editReply(
    buildReply([successCard("Panels rafraîchis", "Tous les panels Owner ont été mis à jour.")]),
  );
}

async function handleDestroy(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild!;
  await OwnerSetupService.destroy(guild);
  await interaction.editReply(
    buildReply([successCard("Supprimé", "Catégorie Owner Management supprimée.")]),
  );
}
