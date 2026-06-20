"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleOwnerButton = handleOwnerButton;
const discord_js_1 = require("discord.js");
const owner_service_1 = require("../modules/owners/owner.service");
const owner_goals_service_1 = require("../modules/owners/owner-goals.service");
const cv2_1 = require("../utils/cv2");
const branding_1 = require("../config/branding");
const premium_embed_1 = require("../utils/premium-embed");
const owners_1 = require("../config/owners");
const permissions_1 = require("../utils/permissions");
const i18n_1 = require("../i18n");
const owner_team_1 = require("./owner-team");
const logger_1 = require("../utils/logger");
/** Boutons de gestion d'équipe (➕ / ➖ / 🔄). */
function teamActionRow() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("yrz_owner_addmember").setLabel("➕ Ajouter").setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId("yrz_owner_removemember").setLabel("➖ Retirer").setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId("yrz_owner_team").setLabel("🔄 Actualiser").setStyle(discord_js_1.ButtonStyle.Secondary));
}
function tp(lang, key, vars) {
    let result = (0, i18n_1.t)(lang, key);
    for (const [k, v] of Object.entries(vars)) {
        result = result.replace(`{${k}}`, String(v));
    }
    return result;
}
async function handleOwnerButton(interaction) {
    const action = interaction.customId.replace("yrz_owner_", "");
    // Ces actions gèrent elles-mêmes leur réponse (modal / select / update).
    // Elles NE doivent PAS être déférées ici (sinon showModal échoue).
    if (action === "addmember")
        return (0, owner_team_1.showAddMemberModal)(interaction);
    if (action === "removemember")
        return (0, owner_team_1.showRemoveMemberSelect)(interaction);
    if (action.startsWith("confirmremove_"))
        return (0, owner_team_1.handleConfirmRemove)(interaction);
    if (action === "cancelremove")
        return (0, owner_team_1.handleCancelRemove)(interaction);
    await interaction.deferReply({ ephemeral: true });
    const lang = await (0, owner_team_1.withTimeout)((0, i18n_1.getUserLang)(interaction.user.id), 4000, "getUserLang").catch(() => "fr");
    // Réponses statiques (aucune DB) — instantanées.
    if (action === "help")
        return replyHelp(interaction, lang);
    if (action === "rewards")
        return replyRewards(interaction, lang);
    try {
        if (action === "leaderboard") {
            await (0, owner_team_1.withTimeout)(replyLeaderboard(interaction, lang), 12000, "leaderboard");
            return;
        }
        const owner = await (0, owner_team_1.withTimeout)(resolveOwner(interaction), 8000, "resolveOwner");
        if (!owner) {
            return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)((0, i18n_1.t)(lang, "owner.accessDenied"), (0, i18n_1.t)(lang, "owner.accessDeniedDesc"))]));
        }
        switch (action) {
            case "dashboard":
                await (0, owner_team_1.withTimeout)(replyDashboard(interaction, owner, lang), 12000, "dashboard");
                return;
            case "team":
                await (0, owner_team_1.withTimeout)(replyTeam(interaction, owner, lang), 12000, "team");
                return;
            case "objectives":
                await (0, owner_team_1.withTimeout)(replyObjectives(interaction, owner, lang), 12000, "objectives");
                return;
        }
    }
    catch (err) {
        logger_1.logger.error("OwnerButton", `${action}: ${err.message}`);
        await interaction
            .editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Base de données lente", "La base ne répond pas pour l'instant. Réessaie dans quelques secondes.")]))
            .catch(() => { });
    }
}
async function resolveOwner(interaction) {
    const owner = await owner_service_1.OwnerService.getLite(interaction.user.id);
    if (owner)
        return owner;
    const member = interaction.member;
    const eligible = !!member &&
        (member.roles.cache.has(owners_1.OWNER_ROLE_ID) ||
            (0, permissions_1.isAdmin)(member) ||
            (owners_1.MANAGER_ROLE_ID ? member.roles.cache.has(owners_1.MANAGER_ROLE_ID) : false));
    if (eligible) {
        return owner_service_1.OwnerService.create(interaction.user.id, interaction.user.username);
    }
    return null;
}
async function replyDashboard(interaction, owner, lang) {
    const stats = await owner_service_1.OwnerService.getTeamStats(owner.id);
    const tierInfo = owner_service_1.OwnerService.getTierInfo(owner.tier);
    const nextTier = owner_service_1.OwnerService.getNextTier(owner.tier);
    const leaderboard = await owner_service_1.OwnerService.getLeaderboard();
    const rank = leaderboard.findIndex((o) => o.id === owner.id) + 1;
    const goals = await owner_goals_service_1.OwnerGoalsService.getActiveGoals(owner.id);
    const monthlyGoals = goals.filter((g) => g.period === "MONTHLY");
    const completed = monthlyGoals.filter((g) => g.completed).length;
    const total = monthlyGoals.length || 1;
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(branding_1.THEME.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(tp(lang, "owner.dashboard.title", { username: interaction.user.username })))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`### ${tierInfo.emoji} ${tierInfo.label}\n` +
        tp(lang, "owner.dashboard.score", { score: owner.totalScore }) + "\n" +
        tp(lang, "owner.dashboard.rank", { rank: rank || "—" })))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.dashboard.teamTitle") + "\n" +
        tp(lang, "owner.dashboard.teamStats", { total: stats.total, active: stats.active, inactive: stats.inactive })))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.dashboard.monthlyTitle") + "\n" +
        `${(0, premium_embed_1.progressBar)(completed, total)} (${completed}/${total})` +
        (nextTier
            ? "\n\n" + tp(lang, "owner.dashboard.nextTier", { emoji: nextTier.emoji, label: nextTier.label, minRecruits: nextTier.minRecruits })
            : "\n\n" + (0, i18n_1.t)(lang, "owner.dashboard.maxTier"))))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.footer")));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
async function replyTeam(interaction, owner, lang) {
    const team = await owner_service_1.OwnerService.getTeam(owner.id);
    if (team.length === 0) {
        const empty = new discord_js_1.ContainerBuilder()
            .setAccentColor(cv2_1.ACCENT.info)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${(0, i18n_1.t)(lang, "owner.team.empty")}`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.team.emptyDesc")))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.footer")));
        return interaction.editReply((0, cv2_1.buildReply)([empty], [teamActionRow()]));
    }
    const lines = team.slice(0, 20).map((m) => {
        const icon = m.status === "ACTIVE" ? "🟢" : "🔴";
        const sales = m.totalSales > 0 ? ` • 💰 ${tp(lang, "owner.team.sales", { count: m.totalSales })}` : "";
        const note = m.note ? ` • 📝 ${m.note}` : "";
        return `${icon} <@${m.discordId}> — <t:${Math.floor(m.joinedAt.getTime() / 1000)}:R>${sales}${note}`;
    });
    const stats = await owner_service_1.OwnerService.getTeamStats(owner.id);
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.info)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(tp(lang, "owner.team.title", { count: team.length })))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(tp(lang, "owner.team.stats", { active: stats.active, inactive: stats.inactive })))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(lines.join("\n")))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.footer")));
    await interaction.editReply((0, cv2_1.buildReply)([container], [teamActionRow()]));
}
async function replyLeaderboard(interaction, lang) {
    const leaderboard = await owner_service_1.OwnerService.getLeaderboard(10);
    if (leaderboard.length === 0) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)((0, i18n_1.t)(lang, "owner.leaderboard.empty"), (0, i18n_1.t)(lang, "owner.leaderboard.emptyDesc"))]));
    }
    const medals = ["🥇", "🥈", "🥉"];
    const lines = leaderboard.map((owner, i) => {
        const medal = medals[i] ?? `\`${i + 1}.\``;
        const tierInfo = owner_service_1.OwnerService.getTierInfo(owner.tier);
        return tp(lang, "owner.leaderboard.entry", {
            medal,
            discordId: owner.discordId,
            score: owner.totalScore,
            emoji: tierInfo.emoji,
            tier: tierInfo.label,
            active: owner.team.length,
        });
    });
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(branding_1.THEME.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.leaderboard.title")))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(lines.join("\n")))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.footer")));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
async function replyObjectives(interaction, owner, lang) {
    const goals = await owner_goals_service_1.OwnerGoalsService.getActiveGoals(owner.id);
    const monthly = goals.filter((g) => g.period === "MONTHLY");
    const weekly = goals.filter((g) => g.period === "WEEKLY");
    const formatGoals = (list) => list.length > 0
        ? list.map((g) => {
            const icon = g.completed ? "✅" : "⬜";
            return `${icon} ${g.description} — **${g.current}/${g.target}**`;
        }).join("\n")
        : (0, i18n_1.t)(lang, "owner.objectives.none");
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(branding_1.THEME.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.objectives.title")))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`${(0, i18n_1.t)(lang, "owner.objectives.monthly")}\n${formatGoals(monthly)}\n\n${(0, i18n_1.t)(lang, "owner.objectives.weekly")}\n${formatGoals(weekly)}`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.objectives.tipsTitle") + "\n" +
        (0, i18n_1.t)(lang, "owner.objectives.tip1") + "\n" +
        (0, i18n_1.t)(lang, "owner.objectives.tip2") + "\n" +
        (0, i18n_1.t)(lang, "owner.objectives.tip3")))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.footer")));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
async function replyRewards(interaction, lang) {
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(branding_1.THEME.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.rewards.title")))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.rewards.tierTitle") + "\n\n" +
        (0, i18n_1.t)(lang, "owner.rewards.bronze") + "\n\n" +
        (0, i18n_1.t)(lang, "owner.rewards.silver") + "\n\n" +
        (0, i18n_1.t)(lang, "owner.rewards.gold") + "\n\n" +
        (0, i18n_1.t)(lang, "owner.rewards.diamond") + "\n\n" +
        (0, i18n_1.t)(lang, "owner.rewards.legend")))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.footer")));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
async function replyHelp(interaction, lang) {
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.info)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.help.title")))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.help.howTitle") + "\n" +
        (0, i18n_1.t)(lang, "owner.help.howDesc") + "\n\n" +
        (0, i18n_1.t)(lang, "owner.help.earnTitle") + "\n" +
        tp(lang, "owner.help.earnRecruit", { pts: owners_1.OWNER_SCORE.RECRUIT_ACTIVE }) + "\n" +
        tp(lang, "owner.help.earnActivity", { pts: owners_1.OWNER_SCORE.MEMBER_REGULAR_ACTIVITY }) + "\n" +
        tp(lang, "owner.help.earnRetention", { pts: owners_1.OWNER_SCORE.MEMBER_RETAINED_30D }) + "\n" +
        tp(lang, "owner.help.earnSale", { pts: owners_1.OWNER_SCORE.MEMBER_SALE }) + "\n\n" +
        (0, i18n_1.t)(lang, "owner.help.noPointsTitle") + "\n" +
        (0, i18n_1.t)(lang, "owner.help.noPointsDesc") + "\n\n" +
        (0, i18n_1.t)(lang, "owner.help.costTitle") + "\n" +
        tp(lang, "owner.help.costSanction", { pts: owners_1.OWNER_SCORE.MEMBER_SANCTIONED }) + "\n" +
        tp(lang, "owner.help.costLeft", { pts: owners_1.OWNER_SCORE.MEMBER_LEFT }) + "\n\n" +
        (0, i18n_1.t)(lang, "owner.help.commandsTitle") + "\n" +
        (0, i18n_1.t)(lang, "owner.help.commandsList")))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent((0, i18n_1.t)(lang, "owner.footer")));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
//# sourceMappingURL=owner-buttons.js.map