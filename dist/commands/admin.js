"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const license_service_1 = require("../modules/licenses/license.service");
const key_service_1 = require("../modules/licenses/key.service");
const user_service_1 = require("../modules/users/user.service");
const role_service_1 = require("../modules/admin/role.service");
const audit_service_1 = require("../modules/admin/audit.service");
const permissions_1 = require("../utils/permissions");
const cv2_1 = require("../utils/cv2");
const format_1 = require("../utils/format");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("admin")
    .setDescription("Commandes d'administration des licences")
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
    .addSubcommandGroup((group) => group
    .setName("licence")
    .setDescription("Gérer les licences")
    .addSubcommand((sub) => sub
    .setName("voir")
    .setDescription("Voir la licence d'un utilisateur")
    .addUserOption((opt) => opt.setName("user").setDescription("L'utilisateur").setRequired(true)))
    .addSubcommand((sub) => sub
    .setName("donner")
    .setDescription("Donner une licence manuellement")
    .addUserOption((opt) => opt.setName("user").setDescription("L'utilisateur").setRequired(true))
    .addIntegerOption((opt) => opt.setName("duree").setDescription("Durée en jours (défaut: 30)")))
    .addSubcommand((sub) => sub
    .setName("suspendre")
    .setDescription("Suspendre une licence")
    .addUserOption((opt) => opt.setName("user").setDescription("L'utilisateur").setRequired(true))
    .addStringOption((opt) => opt.setName("raison").setDescription("Raison").setRequired(true)))
    .addSubcommand((sub) => sub
    .setName("reactiver")
    .setDescription("Réactiver une licence suspendue")
    .addUserOption((opt) => opt.setName("user").setDescription("L'utilisateur").setRequired(true)))
    .addSubcommand((sub) => sub
    .setName("prolonger")
    .setDescription("Prolonger une licence")
    .addUserOption((opt) => opt.setName("user").setDescription("L'utilisateur").setRequired(true))
    .addIntegerOption((opt) => opt.setName("jours").setDescription("Nombre de jours à ajouter").setRequired(true))))
    .addSubcommand((sub) => sub.setName("stats").setDescription("Statistiques globales"))
    .addSubcommand((sub) => sub.setName("licences").setDescription("Lister toutes les licences"))
    .addSubcommand((sub) => sub.setName("sync").setDescription("Synchroniser rôles/licences"))
    .addSubcommand((sub) => sub.setName("logs").setDescription("Voir les derniers événements"))
    .addSubcommand((sub) => sub
    .setName("genkey")
    .setDescription("Générer des clés licence")
    .addIntegerOption((opt) => opt.setName("nombre").setDescription("Nombre de clés (défaut: 1)")));
async function execute(interaction) {
    if (!interaction.memberPermissions?.has("Administrator") && !(0, permissions_1.isAdmin)(interaction.member)) {
        return interaction.reply({ ...(0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Accès refusé", "Vous n'avez pas les permissions admin.")]), ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();
    if (group === "licence") {
        switch (sub) {
            case "voir": return handleVoir(interaction);
            case "donner": return handleDonner(interaction);
            case "suspendre": return handleSuspendre(interaction);
            case "reactiver": return handleReactiver(interaction);
            case "prolonger": return handleProlonger(interaction);
        }
    }
    switch (sub) {
        case "stats": return handleStats(interaction);
        case "licences": return handleLicences(interaction);
        case "sync": return handleSync(interaction);
        case "logs": return handleLogs(interaction);
        case "genkey": return handleGenKey(interaction);
    }
}
async function handleVoir(interaction) {
    const target = interaction.options.getUser("user", true);
    const dbUser = await user_service_1.UserService.getByDiscordId(target.id);
    if (!dbUser)
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Inconnu", "Cet utilisateur n'est pas enregistré.")]));
    const license = await license_service_1.LicenseService.getActive(dbUser.id, interaction.guildId);
    if (!license)
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Pas de licence", `${target.username} n'a pas de licence active.`)]));
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.info)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## 📋 Licence de ${target.username}`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`**Plan :** ${license.plan.displayName}\n` +
        `**Statut :** ${license.status}\n` +
        `**Expire :** ${(0, format_1.formatDate)(license.expiresAt)}`));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
async function handleDonner(interaction) {
    const target = interaction.options.getUser("user", true);
    const duree = interaction.options.getInteger("duree") ?? 30;
    const dbUser = await user_service_1.UserService.getOrCreate(target);
    await license_service_1.LicenseService.create(dbUser.id, interaction.guildId, "vendeur", duree);
    await role_service_1.RoleService.assignSellerRole(interaction.client, interaction.guildId, target.id, "vendeur");
    await audit_service_1.AuditService.log((await user_service_1.UserService.getOrCreate(interaction.user)).id, "LICENSE_GRANTED", dbUser.id, { plan: "vendeur", duree });
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Licence donnée", `Licence **Vendeur** donnée à ${target} pour ${duree} jours.`)]));
}
async function handleSuspendre(interaction) {
    const target = interaction.options.getUser("user", true);
    const raison = interaction.options.getString("raison", true);
    const dbUser = await user_service_1.UserService.getByDiscordId(target.id);
    if (!dbUser)
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Inconnu", "Utilisateur non trouvé.")]));
    const license = await license_service_1.LicenseService.getActive(dbUser.id, interaction.guildId);
    if (!license)
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Pas de licence", "Aucune licence active.")]));
    await license_service_1.LicenseService.suspend(license.id, raison);
    await role_service_1.RoleService.removeSellerRoles(interaction.client, interaction.guildId, target.id);
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Licence suspendue", `Licence de ${target} suspendue.\nRaison : ${raison}`)]));
}
async function handleReactiver(interaction) {
    const target = interaction.options.getUser("user", true);
    const dbUser = await user_service_1.UserService.getByDiscordId(target.id);
    if (!dbUser)
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Inconnu", "Utilisateur non trouvé.")]));
    const licenses = await license_service_1.LicenseService.getByUser(dbUser.id);
    const suspended = licenses.find((l) => l.status === "SUSPENDED");
    if (!suspended)
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Aucune", "Pas de licence suspendue.")]));
    await license_service_1.LicenseService.reactivate(suspended.id);
    await role_service_1.RoleService.assignSellerRole(interaction.client, interaction.guildId, target.id, suspended.plan.name);
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Licence réactivée", `Licence de ${target} réactivée.`)]));
}
async function handleProlonger(interaction) {
    const target = interaction.options.getUser("user", true);
    const jours = interaction.options.getInteger("jours", true);
    const dbUser = await user_service_1.UserService.getByDiscordId(target.id);
    if (!dbUser)
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Inconnu", "Utilisateur non trouvé.")]));
    const license = await license_service_1.LicenseService.getActive(dbUser.id, interaction.guildId);
    if (!license)
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Pas de licence", "Aucune licence active.")]));
    await license_service_1.LicenseService.extend(license.id, jours);
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Licence prolongée", `+${jours} jours ajoutés à la licence de ${target}.`)]));
}
async function handleStats(interaction) {
    const stats = await license_service_1.LicenseService.getStats(interaction.guildId);
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## 📊 Statistiques Licences`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`🟢 **Actives :** ${stats.active}　⚫ **Expirées :** ${stats.expired}　🔴 **Suspendues :** ${stats.suspended}\n\n` +
        `💰 **Revenu total :** ${(0, format_1.formatPrice)(stats.totalRevenue)}\n` +
        `📅 **Revenu ce mois :** ${(0, format_1.formatPrice)(stats.monthRevenue)}`));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
async function handleLicences(interaction) {
    const licenses = await license_service_1.LicenseService.getAllByGuild(interaction.guildId);
    if (licenses.length === 0) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.primaryCard)("📋 Licences", ["Aucune licence pour le moment."])]));
    }
    const list = licenses.slice(0, 15).map((l) => {
        const icon = l.status === "ACTIVE" ? "🟢" : l.status === "SUSPENDED" ? "🔴" : "⚫";
        return `${icon} <@${l.user.discordId}> — **${l.plan.displayName}** — ${l.status}`;
    });
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## 📋 Licences (${licenses.length})`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(list.join("\n")));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
async function handleSync(interaction) {
    const licenses = await license_service_1.LicenseService.getAllByGuild(interaction.guildId, "ACTIVE");
    let synced = 0;
    for (const license of licenses) {
        try {
            await role_service_1.RoleService.assignSellerRole(interaction.client, interaction.guildId, license.user.discordId, license.plan.name);
            synced++;
        }
        catch { }
    }
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Sync terminée", `${synced}/${licenses.length} licences synchronisées.`)]));
}
async function handleLogs(interaction) {
    const logs = await audit_service_1.AuditService.getRecent(10);
    if (logs.length === 0) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.primaryCard)("📜 Logs", ["Aucun log."])]));
    }
    const list = logs.map((l) => {
        const time = `<t:${Math.floor(l.createdAt.getTime() / 1000)}:R>`;
        return `${time} **${l.action}** ${l.actor ? `par ${l.actor.username}` : ""}`;
    });
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.dark)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## 📜 Derniers événements`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(list.join("\n")));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
async function handleGenKey(interaction) {
    const nombre = interaction.options.getInteger("nombre") ?? 1;
    const keys = await key_service_1.KeyService.generate("vendeur", nombre);
    const list = keys.map((k) => `\`${k.key}\``).join("\n");
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)(`🔑 ${nombre} clé(s) générée(s)`, `Plan **Vendeur** (25€/mois)\n\n${list}`)]));
}
//# sourceMappingURL=admin.js.map