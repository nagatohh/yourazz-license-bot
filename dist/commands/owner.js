"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const owner_service_1 = require("../modules/owners/owner.service");
const owner_goals_service_1 = require("../modules/owners/owner-goals.service");
const cv2_1 = require("../utils/cv2");
const branding_1 = require("../config/branding");
const owners_1 = require("../config/owners");
const premium_embed_1 = require("../utils/premium-embed");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("owner")
    .setDescription("Commandes Owner Manager")
    .addSubcommand((sub) => sub.setName("dashboard").setDescription("Voir ton dashboard Owner"))
    .addSubcommand((sub) => sub.setName("team").setDescription("Voir ton équipe"))
    .addSubcommand((sub) => sub.setName("recruits").setDescription("Voir les recrutements récents"))
    .addSubcommand((sub) => sub.setName("stats").setDescription("Statistiques détaillées"))
    .addSubcommand((sub) => sub.setName("leaderboard").setDescription("Classement des Owners"))
    .addSubcommand((sub) => sub.setName("help").setDescription("Aide sur le système Owner"));
async function execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    if (sub === "leaderboard")
        return handleLeaderboard(interaction);
    if (sub === "help")
        return handleHelp(interaction);
    const owner = await owner_service_1.OwnerService.getByDiscordId(interaction.user.id);
    if (!owner) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Accès refusé", "Tu n'es pas enregistré comme Owner.")]));
    }
    switch (sub) {
        case "dashboard":
            return handleDashboard(interaction, owner);
        case "team":
            return handleTeam(interaction, owner);
        case "recruits":
            return handleRecruits(interaction, owner);
        case "stats":
            return handleStats(interaction, owner);
    }
}
async function handleDashboard(interaction, owner) {
    const stats = await owner_service_1.OwnerService.getTeamStats(owner.id);
    const tierInfo = owner_service_1.OwnerService.getTierInfo(owner.tier);
    const nextTier = owner_service_1.OwnerService.getNextTier(owner.tier);
    const leaderboard = await owner_service_1.OwnerService.getLeaderboard();
    const rank = leaderboard.findIndex((o) => o.id === owner.id) + 1;
    const goals = await owner_goals_service_1.OwnerGoalsService.getActiveGoals(owner.id);
    const monthlyGoals = goals.filter((g) => g.period === "MONTHLY");
    const goalProgress = monthlyGoals.length > 0
        ? monthlyGoals.filter((g) => g.completed).length
        : 0;
    const goalTotal = monthlyGoals.length || 1;
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("## 👑 Dashboard Owner"))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`**Équipe :** ${stats.total} membres\n` +
        `🟢 Actifs : **${stats.active}** • 🔴 Inactifs : **${stats.inactive}**\n\n` +
        `**Score :** ${owner.totalScore} pts\n` +
        `**Classement :** #${rank || "—"}\n` +
        `**Tier :** ${tierInfo.emoji} ${tierInfo.label}` +
        (nextTier ? ` → ${nextTier.emoji} ${nextTier.label} (${nextTier.minRecruits} recrues)` : " *(max)*")))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`### 🎯 Objectifs du mois\n${(0, premium_embed_1.progressBar)(goalProgress, goalTotal)} (${goalProgress}/${goalTotal})`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("-# Yourazz Owner Manager System"));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
async function handleTeam(interaction, owner) {
    const team = await owner_service_1.OwnerService.getTeam(owner.id);
    if (team.length === 0) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Équipe vide", "Tu n'as encore recruté personne.")]));
    }
    const lines = team.slice(0, 20).map((m) => {
        const status = m.status === "ACTIVE" ? "🟢" : "🔴";
        const sales = m.totalSales > 0 ? ` • 💰 ${m.totalSales}` : "";
        return `${status} <@${m.discordId}> — depuis <t:${Math.floor(m.joinedAt.getTime() / 1000)}:R>${sales}`;
    });
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.info)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## 👥 Ton équipe (${team.length})`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(lines.join("\n")))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("-# Yourazz Owner Manager System"));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
async function handleRecruits(interaction, owner) {
    const team = await owner_service_1.OwnerService.getTeam(owner.id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = team.filter((m) => m.joinedAt >= thirtyDaysAgo);
    if (recent.length === 0) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Aucun recrutement récent", "Aucun recrutement dans les 30 derniers jours.")]));
    }
    const lines = recent.map((m) => {
        const status = m.status === "ACTIVE" ? "✅" : "⚠️";
        return `${status} **${m.username}** — <t:${Math.floor(m.joinedAt.getTime() / 1000)}:R>`;
    });
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.success)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## 🚀 Recrutements récents (${recent.length})`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(lines.join("\n")))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("-# Yourazz Owner Manager System"));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
async function handleStats(interaction, owner) {
    const stats = await owner_service_1.OwnerService.getTeamStats(owner.id);
    const tierInfo = owner_service_1.OwnerService.getTierInfo(owner.tier);
    const goals = await owner_goals_service_1.OwnerGoalsService.getActiveGoals(owner.id);
    const retentionRate = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
    const goalLines = goals.length > 0
        ? goals.map((g) => {
            const check = g.completed ? "✅" : "⬜";
            return `${check} ${g.description} — ${g.current}/${g.target}`;
        }).join("\n")
        : "Aucun objectif actif";
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("## 📊 Statistiques Owner"))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`${tierInfo.emoji} **${tierInfo.label}** — ${owner.totalScore} pts\n\n` +
        `👥 **Équipe :** ${stats.total} membres\n` +
        `🟢 Actifs : ${stats.active} • 🔴 Inactifs : ${stats.inactive}\n` +
        `📈 **Taux de rétention :** ${retentionRate}%\n\n` +
        `### 🎯 Objectifs\n${goalLines}`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("-# Yourazz Owner Manager System"));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
async function handleLeaderboard(interaction) {
    const leaderboard = await owner_service_1.OwnerService.getLeaderboard(10);
    if (leaderboard.length === 0) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Vide", "Aucun Owner enregistré.")]));
    }
    const medals = ["🥇", "🥈", "🥉"];
    const lines = leaderboard.map((o, i) => {
        const medal = medals[i] ?? `\`${i + 1}.\``;
        const tierInfo = owner_service_1.OwnerService.getTierInfo(o.tier);
        return `${medal} <@${o.discordId}> — **${o.totalScore} pts** • ${tierInfo.emoji} • ${o.team.length} actifs`;
    });
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(branding_1.THEME.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("## 🏆 Classement Owners"))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(lines.join("\n")))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("-# 👑 Yourazz Owner Manager System"));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
async function handleHelp(interaction) {
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.info)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("## ❓ Aide — Owner Manager"))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("### 🔑 Comment ça marche\n" +
        "Tu es un **Owner** — un recruteur/manager Yourazz.\n" +
        "Tu recrutes des membres, tu les accompagnes, et tu gagnes des points.\n\n" +
        "### 📈 Points\n" +
        `▸ Recrue active → **+${owners_1.OWNER_SCORE.RECRUIT_ACTIVE}**\n` +
        `▸ Activité régulière → **+${owners_1.OWNER_SCORE.MEMBER_REGULAR_ACTIVITY}**\n` +
        `▸ Rétention 30j → **+${owners_1.OWNER_SCORE.MEMBER_RETAINED_30D}**\n` +
        `▸ Vente membre → **+${owners_1.OWNER_SCORE.MEMBER_SALE}**\n` +
        `▸ Sanction → **${owners_1.OWNER_SCORE.MEMBER_SANCTIONED}**\n` +
        `▸ Départ → **${owners_1.OWNER_SCORE.MEMBER_LEFT}**\n\n` +
        "### 📋 Commandes\n" +
        "▸ `/owner dashboard` — Tableau de bord\n" +
        "▸ `/owner team` — Ton équipe\n" +
        "▸ `/owner stats` — Statistiques\n" +
        "▸ `/owner recruits` — Recrutements récents\n" +
        "▸ `/owner leaderboard` — Classement"))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("-# 👑 Yourazz Owner Manager System"));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
//# sourceMappingURL=owner.js.map