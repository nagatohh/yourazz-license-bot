"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const owner_service_1 = require("../modules/owners/owner.service");
const owner_leaderboard_service_1 = require("../modules/owners/owner-leaderboard.service");
const owner_setup_service_1 = require("../modules/owners/owner-setup.service");
const permissions_1 = require("../utils/permissions");
const cv2_1 = require("../utils/cv2");
const bot_1 = require("../config/bot");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("owner-admin")
    .setDescription("Administration du système Owner Manager")
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
    .addSubcommand((sub) => sub
    .setName("create")
    .setDescription("Créer un Owner")
    .addUserOption((opt) => opt.setName("user").setDescription("L'utilisateur à promouvoir Owner").setRequired(true)))
    .addSubcommand((sub) => sub
    .setName("remove")
    .setDescription("Retirer un Owner")
    .addUserOption((opt) => opt.setName("user").setDescription("L'Owner à retirer").setRequired(true)))
    .addSubcommand((sub) => sub
    .setName("score")
    .setDescription("Modifier le score d'un Owner")
    .addUserOption((opt) => opt.setName("user").setDescription("L'Owner").setRequired(true))
    .addIntegerOption((opt) => opt.setName("points").setDescription("Points à ajouter (négatif pour retirer)").setRequired(true))
    .addStringOption((opt) => opt.setName("raison").setDescription("Raison").setRequired(true)))
    .addSubcommand((sub) => sub.setName("leaderboard").setDescription("Forcer la mise à jour du leaderboard"))
    .addSubcommand((sub) => sub.setName("list").setDescription("Voir tous les Owners"))
    .addSubcommand((sub) => sub
    .setName("add-recruit")
    .setDescription("Ajouter une recrue à un Owner")
    .addUserOption((opt) => opt.setName("owner").setDescription("L'Owner").setRequired(true))
    .addUserOption((opt) => opt.setName("member").setDescription("Le membre à recruter").setRequired(true)))
    .addSubcommand((sub) => sub
    .setName("remove-recruit")
    .setDescription("Retirer une recrue d'un Owner")
    .addUserOption((opt) => opt.setName("owner").setDescription("L'Owner").setRequired(true))
    .addUserOption((opt) => opt.setName("member").setDescription("Le membre à retirer").setRequired(true)))
    .addSubcommand((sub) => sub
    .setName("transfer")
    .setDescription("Transférer une recrue d'un Owner à un autre")
    .addUserOption((opt) => opt.setName("from").setDescription("Owner source").setRequired(true))
    .addUserOption((opt) => opt.setName("to").setDescription("Owner destination").setRequired(true))
    .addUserOption((opt) => opt.setName("member").setDescription("Le membre à transférer").setRequired(true)))
    .addSubcommand((sub) => sub
    .setName("setup")
    .setDescription("Créer la catégorie Owner Management avec tous les channels")
    .addRoleOption((opt) => opt.setName("owner-role").setDescription("Rôle Owner (accès aux channels)")))
    .addSubcommand((sub) => sub.setName("refresh-panel").setDescription("Rafraîchir tous les panels Owner"))
    .addSubcommand((sub) => sub.setName("destroy").setDescription("Supprimer la catégorie Owner Management"));
async function execute(interaction) {
    if (!interaction.memberPermissions?.has("Administrator") && !(0, permissions_1.isAdmin)(interaction.member)) {
        return interaction.reply({
            ...(0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Accès refusé", "Permissions admin requises.")]),
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
async function handleCreate(interaction) {
    const user = interaction.options.getUser("user", true);
    const existing = await owner_service_1.OwnerService.getByDiscordId(user.id);
    if (existing) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Déjà Owner", `${user} est déjà un Owner.`)]));
    }
    await owner_service_1.OwnerService.create(user.id, user.username);
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Owner créé", `${user} est maintenant un Owner ! 👑`)]));
}
async function handleRemove(interaction) {
    const user = interaction.options.getUser("user", true);
    const existing = await owner_service_1.OwnerService.getByDiscordId(user.id);
    if (!existing) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Introuvable", `${user} n'est pas un Owner.`)]));
    }
    await owner_service_1.OwnerService.remove(user.id);
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Owner retiré", `${user} n'est plus un Owner.`)]));
}
async function handleScore(interaction) {
    const user = interaction.options.getUser("user", true);
    const points = interaction.options.getInteger("points", true);
    const raison = interaction.options.getString("raison", true);
    const owner = await owner_service_1.OwnerService.getByDiscordId(user.id);
    if (!owner) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Introuvable", `${user} n'est pas un Owner.`)]));
    }
    await owner_service_1.OwnerService.manualScore(owner.id, points, raison);
    const sign = points > 0 ? "+" : "";
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Score modifié", `${sign}${points} pts pour ${user}\nRaison : ${raison}`)]));
}
async function handleLeaderboard(interaction) {
    await owner_leaderboard_service_1.OwnerLeaderboardService.update(interaction.client);
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Leaderboard", "Classement mis à jour ! ✅")]));
}
async function handleList(interaction) {
    const owners = await owner_service_1.OwnerService.getAll();
    if (owners.length === 0) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Vide", "Aucun Owner enregistré.")]));
    }
    const lines = owners.map((o, i) => {
        const tierInfo = owner_service_1.OwnerService.getTierInfo(o.tier);
        const activeTeam = o.team.filter((m) => m.status === "ACTIVE").length;
        return `\`${i + 1}.\` ${tierInfo.emoji} <@${o.discordId}> — **${o.totalScore} pts** • ${activeTeam} actifs`;
    });
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## 👑 Owners (${owners.length})`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(lines.join("\n")))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("-# Yourazz Owner Manager System"));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
async function handleAddRecruit(interaction) {
    const ownerUser = interaction.options.getUser("owner", true);
    const memberUser = interaction.options.getUser("member", true);
    const owner = await owner_service_1.OwnerService.getByDiscordId(ownerUser.id);
    if (!owner) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Introuvable", `${ownerUser} n'est pas un Owner.`)]));
    }
    await owner_service_1.OwnerService.addRecruit(owner.id, memberUser.id, memberUser.username);
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Recrue ajoutée", `${memberUser} ajouté à l'équipe de ${ownerUser}.`)]));
}
async function handleRemoveRecruit(interaction) {
    const ownerUser = interaction.options.getUser("owner", true);
    const memberUser = interaction.options.getUser("member", true);
    const owner = await owner_service_1.OwnerService.getByDiscordId(ownerUser.id);
    if (!owner) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Introuvable", `${ownerUser} n'est pas un Owner.`)]));
    }
    await owner_service_1.OwnerService.removeRecruit(owner.id, memberUser.id);
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Recrue retirée", `${memberUser} retiré de l'équipe de ${ownerUser}.`)]));
}
async function handleTransfer(interaction) {
    const fromUser = interaction.options.getUser("from", true);
    const toUser = interaction.options.getUser("to", true);
    const memberUser = interaction.options.getUser("member", true);
    const fromOwner = await owner_service_1.OwnerService.getByDiscordId(fromUser.id);
    const toOwner = await owner_service_1.OwnerService.getByDiscordId(toUser.id);
    if (!fromOwner || !toOwner) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Erreur", "Un des Owners n'existe pas.")]));
    }
    await owner_service_1.OwnerService.transferRecruit(fromOwner.id, toOwner.id, memberUser.id);
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Transfert effectué", `${memberUser} transféré de ${fromUser} vers ${toUser}.`)]));
}
async function handleSetup(interaction) {
    const ownerRole = interaction.options.getRole("owner-role");
    const guild = interaction.guild;
    await owner_setup_service_1.OwnerSetupService.setup(guild, ownerRole?.id, bot_1.env.ADMIN_ROLE_ID);
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Setup terminé", "Catégorie **👑 OWNER MANAGEMENT** créée avec tous les channels et panels.")]));
}
async function handleRefreshPanel(interaction) {
    const guild = interaction.guild;
    await owner_setup_service_1.OwnerSetupService.refreshAllPanels(interaction.client, guild);
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Panels rafraîchis", "Tous les panels Owner ont été mis à jour.")]));
}
async function handleDestroy(interaction) {
    const guild = interaction.guild;
    await owner_setup_service_1.OwnerSetupService.destroy(guild);
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Supprimé", "Catégorie Owner Management supprimée.")]));
}
//# sourceMappingURL=owner-admin.js.map