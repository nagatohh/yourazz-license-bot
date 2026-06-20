"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTimeout = withTimeout;
exports.showAddMemberModal = showAddMemberModal;
exports.handleAddMemberModal = handleAddMemberModal;
exports.showRemoveMemberSelect = showRemoveMemberSelect;
exports.handleRemoveMemberSelect = handleRemoveMemberSelect;
exports.handleConfirmRemove = handleConfirmRemove;
exports.handleCancelRemove = handleCancelRemove;
const discord_js_1 = require("discord.js");
const owner_service_1 = require("../modules/owners/owner.service");
const owner_team_service_1 = require("../modules/owners/owner-team.service");
const audit_service_1 = require("../modules/admin/audit.service");
const cv2_1 = require("../utils/cv2");
const branding_1 = require("../config/branding");
const channels_1 = require("../config/channels");
const roles_1 = require("../config/roles");
const permissions_1 = require("../utils/permissions");
const owners_1 = require("../config/owners");
const rateLimit_1 = require("../utils/rateLimit");
const logger_1 = require("../utils/logger");
// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────
/** L'utilisateur a-t-il le droit de gérer une équipe (Owner / Manager / Admin) ? */
function canManageTeam(member) {
    if (!member)
        return false;
    if ((0, permissions_1.isAdmin)(member))
        return true;
    if (member.roles.cache.has(owners_1.OWNER_ROLE_ID))
        return true;
    if (owners_1.MANAGER_ROLE_ID && member.roles.cache.has(owners_1.MANAGER_ROLE_ID))
        return true;
    return false;
}
/** Récupère l'Owner du cliqueur (requête légère), le crée s'il est éligible, sinon null. */
async function resolveOwner(interaction) {
    const owner = await owner_service_1.OwnerService.getLite(interaction.user.id);
    if (owner)
        return owner;
    const member = interaction.member;
    if (canManageTeam(member)) {
        return owner_service_1.OwnerService.create(interaction.user.id, interaction.user.username);
    }
    return null;
}
/** Extrait un ID Discord valide depuis une mention `<@id>` ou un ID brut. */
function parseMemberId(raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 17 || digits.length > 20)
        return null;
    return digits;
}
/** Neutralise une note libre (anti-injection markdown / mentions). */
function sanitizeNote(raw) {
    if (!raw)
        return null;
    const clean = raw
        .replace(/[`@]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, owners_1.TEAM_NOTE_MAX);
    return clean.length > 0 ? clean : null;
}
/** Envoie un log dans le salon staff (mentions désactivées). */
async function sendStaffLog(client, title, body, accent) {
    if (!channels_1.CHANNELS.staffLog)
        return;
    try {
        const channel = (await client.channels.fetch(channels_1.CHANNELS.staffLog));
        if (!channel)
            return;
        const container = new discord_js_1.ContainerBuilder()
            .setAccentColor(cv2_1.ACCENT[accent])
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(title))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(body));
        await channel.send({ ...(0, cv2_1.buildReply)([container]), allowedMentions: { parse: [] } });
    }
    catch (err) {
        logger_1.logger.error("OwnerTeam", `Log staff impossible: ${err.message}`);
    }
}
/** Notifie le membre ajouté en DM (silencieux si DM fermés). */
async function dmMemberAdded(client, memberId, ownerDiscordId) {
    try {
        const user = await client.users.fetch(memberId);
        const container = new discord_js_1.ContainerBuilder()
            .setAccentColor(branding_1.THEME.primary)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("## 👑 Bienvenue dans une équipe Yourazz"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`Vous avez été ajouté à l'équipe de <@${ownerDiscordId}> sur **Yourazz**.\n\n` +
            "Restez actif pour faire progresser votre équipe ! 🚀"));
        await user.send({ ...(0, cv2_1.buildReply)([container]), allowedMentions: { parse: [] } });
    }
    catch {
        logger_1.logger.warn("OwnerTeam", `DM impossible au membre ${memberId}`);
    }
}
/**
 * Garantit qu'une promesse (ex : requête DB transatlantique) ne bloque pas
 * indéfiniment l'interaction. Rejette après `ms` si elle n'a pas abouti.
 */
function withTimeout(promise, ms, label) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${label} (${ms}ms)`)), ms)),
    ]);
}
// ───────────────────────────────────────────────────────────────
// ➕ Ajouter un membre — ouverture du modal
// ───────────────────────────────────────────────────────────────
async function showAddMemberModal(interaction) {
    const member = interaction.member;
    if (!canManageTeam(member)) {
        return interaction.reply({
            ...(0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Accès refusé", "Vous n'êtes pas autorisé à ajouter un membre.")]),
            ephemeral: true,
        });
    }
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId("yrz_owner_addmember_modal")
        .setTitle("➕ Ajouter un membre");
    const memberInput = new discord_js_1.TextInputBuilder()
        .setCustomId("member_input")
        .setLabel("ID Discord ou mention du membre")
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(40)
        .setPlaceholder("@membre ou 123456789012345678");
    const noteInput = new discord_js_1.TextInputBuilder()
        .setCustomId("note_input")
        .setLabel("Note interne / rôle (optionnel)")
        .setStyle(discord_js_1.TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(owners_1.TEAM_NOTE_MAX)
        .setPlaceholder("Ex : Nouveau vendeur recruté");
    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(memberInput), new discord_js_1.ActionRowBuilder().addComponents(noteInput));
    await interaction.showModal(modal);
}
// ───────────────────────────────────────────────────────────────
// ➕ Ajouter un membre — soumission du modal
// ───────────────────────────────────────────────────────────────
async function handleAddMemberModal(interaction) {
    await interaction.deferReply({ ephemeral: true });
    // Anti-spam dédié à l'action d'ajout
    const { ok, remaining } = (0, rateLimit_1.checkCooldown)(interaction.user.id, "owner addmember");
    if (!ok) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Trop vite !", `Attendez **${remaining}s** avant un nouvel ajout.`)]));
    }
    if (!interaction.guild) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Erreur", "Action indisponible ici.")]));
    }
    const actor = interaction.member;
    if (!canManageTeam(actor)) {
        await logUnauthorized(interaction.user.id, "add");
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Accès refusé", "Vous n'êtes pas autorisé à ajouter un membre.")]));
    }
    let owner;
    try {
        owner = await withTimeout(resolveOwner(interaction), 8000, "resolveOwner");
    }
    catch (err) {
        logger_1.logger.error("OwnerTeam", `resolveOwner: ${err.message}`);
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Base de données lente", "La base ne répond pas pour l'instant. Réessaie dans quelques secondes.")]));
    }
    if (!owner) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Accès refusé", "Vous ne possédez pas d'équipe Owner.")]));
    }
    // Parsing & validation de l'entrée
    const rawMember = interaction.fields.getTextInputValue("member_input");
    const memberId = parseMemberId(rawMember);
    if (!memberId) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Entrée invalide", "Fournissez un ID Discord valide ou une mention.")]));
    }
    const note = sanitizeNote(interaction.fields.getTextInputValue("note_input"));
    // Vérifications Discord (présence serveur, bot, soi-même, staff)
    const target = await interaction.guild.members.fetch(memberId).catch(() => null);
    if (!target) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Introuvable", "Ce membre n'est pas sur le serveur.")]));
    }
    if (target.user.bot) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Action refusée", "Vous ne pouvez pas ajouter un bot.")]));
    }
    if (target.id === interaction.user.id) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Action refusée", "Vous ne pouvez pas vous ajouter vous-même.")]));
    }
    const targetIsStaff = target.roles.cache.has(roles_1.ROLES.admin) ||
        target.roles.cache.has(owners_1.OWNER_ROLE_ID) ||
        (owners_1.MANAGER_ROLE_ID ? target.roles.cache.has(owners_1.MANAGER_ROLE_ID) : false);
    if (targetIsStaff && !(0, permissions_1.isAdmin)(actor)) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Action refusée", "Vous ne pouvez pas ajouter un admin ou un owner à votre équipe.")]));
    }
    if (owners_1.TEAM_REQUIRED_ROLE_ID && !target.roles.cache.has(owners_1.TEAM_REQUIRED_ROLE_ID)) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Rôle requis manquant", "Ce membre ne possède pas le rôle requis pour rejoindre une équipe.")]));
    }
    // Ajout (vérifications base de données dans le service)
    try {
        await withTimeout(owner_team_service_1.OwnerTeamService.addMember({
            owner: { id: owner.id, tier: owner.tier },
            memberId,
            memberUsername: target.user.username,
            addedById: interaction.user.id,
            note,
        }), 9000, "addMember");
    }
    catch (err) {
        if (err instanceof owner_team_service_1.TeamError) {
            void audit_service_1.AuditService.log(null, "owner_team.add_failed", null, {
                code: err.code,
                ownerDiscordId: interaction.user.id,
                memberId,
            }).catch(() => { });
            return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Ajout impossible", err.message)]));
        }
        logger_1.logger.error("OwnerTeam", `Ajout échoué: ${err.message}`, { stack: err.stack });
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Base de données lente", "L'ajout n'a pas pu être confirmé (base lente). Vérifie « 👥 Mon Équipe » dans quelques secondes avant de réessayer.")]));
    }
    // ✅ Réponse IMMÉDIATE à l'utilisateur — ne jamais la bloquer derrière les effets de bord.
    await interaction.editReply((0, cv2_1.buildReply)([
        (0, cv2_1.successCard)("Membre ajouté", `✅ Membre ajouté avec succès à votre équipe.\n\n` +
            `**Membre :** <@${memberId}>\n` +
            `**Ajouté par :** <@${interaction.user.id}>` +
            (note ? `\n**Note :** ${note}` : "")),
    ]));
    // Effets de bord NON bloquants (audit, log staff, DM) — exécutés en arrière-plan.
    void audit_service_1.AuditService.log(null, "owner_team.member_added", null, {
        ownerId: owner.id,
        ownerDiscordId: interaction.user.id,
        memberId,
        note: note ?? undefined,
    }).catch((e) => logger_1.logger.error("OwnerTeam", `Audit add: ${e.message}`));
    void sendStaffLog(interaction.client, "## ➕ Nouveau membre ajouté à une équipe", `**Owner :** <@${interaction.user.id}>\n` +
        `**Membre :** <@${memberId}>\n` +
        (note ? `**Note :** ${note}\n` : "") +
        `**Date :** <t:${Math.floor(Date.now() / 1000)}:F>`, "primary");
    void dmMemberAdded(interaction.client, memberId, interaction.user.id);
}
// ───────────────────────────────────────────────────────────────
// ➖ Retirer un membre — affiche le menu de sélection
// ───────────────────────────────────────────────────────────────
async function showRemoveMemberSelect(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const actor = interaction.member;
    if (!canManageTeam(actor)) {
        await logUnauthorized(interaction.user.id, "remove");
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Accès refusé", "Vous n'êtes pas autorisé à retirer un membre.")]));
    }
    let owner;
    let team;
    try {
        owner = await withTimeout(resolveOwner(interaction), 8000, "resolveOwner");
        if (!owner) {
            return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Accès refusé", "Vous ne possédez pas d'équipe Owner.")]));
        }
        team = await withTimeout(owner_service_1.OwnerService.getTeam(owner.id), 8000, "getTeam");
    }
    catch (err) {
        logger_1.logger.error("OwnerTeam", `showRemove: ${err.message}`);
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Base de données lente", "La base ne répond pas pour l'instant. Réessaie dans quelques secondes.")]));
    }
    if (team.length === 0) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.infoCard)("Équipe vide", "Vous n'avez aucun membre à retirer.")]));
    }
    const select = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId("yrz_owner_removeselect")
        .setPlaceholder("Sélectionnez le membre à retirer")
        .addOptions(team.slice(0, 25).map((m) => ({
        label: m.username.slice(0, 100),
        value: m.discordId,
        description: `${m.status === "ACTIVE" ? "Actif" : "Inactif"} • ${m.totalSales} ventes`.slice(0, 100),
    })));
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.warning)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("## ➖ Retirer un membre"))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("Choisissez le membre à retirer de votre équipe.\nL'historique est conservé."));
    await interaction.editReply((0, cv2_1.buildReply)([container], [new discord_js_1.ActionRowBuilder().addComponents(select)]));
}
// ───────────────────────────────────────────────────────────────
// ➖ Retirer un membre — sélection → demande de confirmation
// ───────────────────────────────────────────────────────────────
async function handleRemoveMemberSelect(interaction) {
    await interaction.deferUpdate();
    const actor = interaction.member;
    if (!canManageTeam(actor)) {
        await logUnauthorized(interaction.user.id, "remove");
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Accès refusé", "Vous n'êtes pas autorisé à retirer un membre.")]));
    }
    const memberId = parseMemberId(interaction.values[0] ?? "");
    if (!memberId) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Erreur", "Membre invalide.")]));
    }
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.warning)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("## ⚠️ Confirmer le retrait"))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`Voulez-vous vraiment retirer <@${memberId}> de votre équipe ?\nL'historique sera conservé.`));
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`yrz_owner_confirmremove_${memberId}`)
        .setLabel("✅ Confirmer le retrait")
        .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
        .setCustomId("yrz_owner_cancelremove")
        .setLabel("❌ Annuler")
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    await interaction.editReply((0, cv2_1.buildReply)([container], [row]));
}
// ───────────────────────────────────────────────────────────────
// ➖ Retirer un membre — confirmation → retrait effectif
// ───────────────────────────────────────────────────────────────
async function handleConfirmRemove(interaction) {
    await interaction.deferUpdate();
    const { ok } = (0, rateLimit_1.checkCooldown)(interaction.user.id, "owner removemember");
    if (!ok) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Trop vite !", "Patientez quelques secondes avant de réessayer.")]));
    }
    const actor = interaction.member;
    if (!canManageTeam(actor)) {
        await logUnauthorized(interaction.user.id, "remove");
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Accès refusé", "Vous n'êtes pas autorisé à retirer un membre.")]));
    }
    let owner;
    try {
        owner = await withTimeout(resolveOwner(interaction), 8000, "resolveOwner");
    }
    catch (err) {
        logger_1.logger.error("OwnerTeam", `resolveOwner: ${err.message}`);
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Base de données lente", "La base ne répond pas pour l'instant. Réessaie dans quelques secondes.")]));
    }
    if (!owner) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Accès refusé", "Vous ne possédez pas d'équipe Owner.")]));
    }
    const memberId = parseMemberId(interaction.customId.replace("yrz_owner_confirmremove_", ""));
    if (!memberId) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Erreur", "Membre invalide.")]));
    }
    try {
        await withTimeout(owner_team_service_1.OwnerTeamService.removeMember({ ownerId: owner.id, memberId }), 9000, "removeMember");
    }
    catch (err) {
        if (err instanceof owner_team_service_1.TeamError) {
            void audit_service_1.AuditService.log(null, "owner_team.remove_failed", null, {
                code: err.code,
                ownerDiscordId: interaction.user.id,
                memberId,
            }).catch(() => { });
            return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Retrait impossible", err.message)]));
        }
        logger_1.logger.error("OwnerTeam", `Retrait échoué: ${err.message}`, { stack: err.stack });
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Base de données lente", "Le retrait n'a pas pu être confirmé (base lente). Réessaie dans quelques secondes.")]));
    }
    // ✅ Réponse immédiate — effets de bord en arrière-plan.
    await interaction.editReply((0, cv2_1.buildReply)([
        (0, cv2_1.successCard)("Membre retiré", `✅ <@${memberId}> a été retiré de votre équipe.\nL'historique est conservé.`),
    ]));
    void audit_service_1.AuditService.log(null, "owner_team.member_removed", null, {
        ownerId: owner.id,
        ownerDiscordId: interaction.user.id,
        memberId,
    }).catch((e) => logger_1.logger.error("OwnerTeam", `Audit remove: ${e.message}`));
    void sendStaffLog(interaction.client, "## ➖ Membre retiré d'une équipe", `**Owner :** <@${interaction.user.id}>\n` +
        `**Membre :** <@${memberId}>\n` +
        `**Date :** <t:${Math.floor(Date.now() / 1000)}:F>`, "warning");
}
// ───────────────────────────────────────────────────────────────
// ➖ Retirer un membre — annulation
// ───────────────────────────────────────────────────────────────
async function handleCancelRemove(interaction) {
    await interaction.deferUpdate();
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.infoCard)("Annulé", "Aucun membre n'a été retiré de votre équipe.")]));
}
// ───────────────────────────────────────────────────────────────
// Audit d'une tentative non autorisée
// ───────────────────────────────────────────────────────────────
async function logUnauthorized(discordId, action) {
    await audit_service_1.AuditService.log(null, "owner_team.unauthorized", null, { discordId, action }).catch(() => { });
}
//# sourceMappingURL=owner-team.js.map