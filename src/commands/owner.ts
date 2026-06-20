import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from "discord.js";
import { OwnerService } from "../modules/owners/owner.service";
import { OwnerGoalsService } from "../modules/owners/owner-goals.service";
import { buildReply, errorCard, ACCENT } from "../utils/cv2";
import { THEME } from "../config/branding";
import { OWNER_SCORE } from "../config/owners";
import { progressBar } from "../utils/premium-embed";

export const data = new SlashCommandBuilder()
  .setName("owner")
  .setDescription("Commandes Owner Manager")
  .addSubcommand((sub) => sub.setName("dashboard").setDescription("Voir ton dashboard Owner"))
  .addSubcommand((sub) => sub.setName("team").setDescription("Voir ton équipe"))
  .addSubcommand((sub) => sub.setName("recruits").setDescription("Voir les recrutements récents"))
  .addSubcommand((sub) => sub.setName("stats").setDescription("Statistiques détaillées"))
  .addSubcommand((sub) => sub.setName("leaderboard").setDescription("Classement des Owners"))
  .addSubcommand((sub) => sub.setName("help").setDescription("Aide sur le système Owner"));

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const sub = interaction.options.getSubcommand();

  if (sub === "leaderboard") return handleLeaderboard(interaction);
  if (sub === "help") return handleHelp(interaction);

  const owner = await OwnerService.getByDiscordId(interaction.user.id);
  if (!owner) {
    return interaction.editReply(
      buildReply([errorCard("Accès refusé", "Tu n'es pas enregistré comme Owner.")]),
    );
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

async function handleDashboard(interaction: ChatInputCommandInteraction, owner: any) {
  const stats = await OwnerService.getTeamStats(owner.id);
  const tierInfo = OwnerService.getTierInfo(owner.tier);
  const nextTier = OwnerService.getNextTier(owner.tier);
  const leaderboard = await OwnerService.getLeaderboard();
  const rank = leaderboard.findIndex((o) => o.id === owner.id) + 1;
  const goals = await OwnerGoalsService.getActiveGoals(owner.id);

  const monthlyGoals = goals.filter((g) => g.period === "MONTHLY");
  const goalProgress = monthlyGoals.length > 0
    ? monthlyGoals.filter((g) => g.completed).length
    : 0;
  const goalTotal = monthlyGoals.length || 1;

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.primary)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## 👑 Dashboard Owner"),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Équipe :** ${stats.total} membres\n` +
        `🟢 Actifs : **${stats.active}** • 🔴 Inactifs : **${stats.inactive}**\n\n` +
        `**Score :** ${owner.totalScore} pts\n` +
        `**Classement :** #${rank || "—"}\n` +
        `**Tier :** ${tierInfo.emoji} ${tierInfo.label}` +
        (nextTier ? ` → ${nextTier.emoji} ${nextTier.label} (${nextTier.minRecruits} recrues)` : " *(max)*"),
      ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎯 Objectifs du mois\n${progressBar(goalProgress, goalTotal)} (${goalProgress}/${goalTotal})`,
      ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("-# Yourazz Owner Manager System"),
    );

  await interaction.editReply(buildReply([container]));
}

async function handleTeam(interaction: ChatInputCommandInteraction, owner: any) {
  const team = await OwnerService.getTeam(owner.id);

  if (team.length === 0) {
    return interaction.editReply(buildReply([errorCard("Équipe vide", "Tu n'as encore recruté personne.")]));
  }

  const lines = team.slice(0, 20).map((m) => {
    const status = m.status === "ACTIVE" ? "🟢" : "🔴";
    const sales = m.totalSales > 0 ? ` • 💰 ${m.totalSales}` : "";
    return `${status} <@${m.discordId}> — depuis <t:${Math.floor(m.joinedAt.getTime() / 1000)}:R>${sales}`;
  });

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.info)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## 👥 Ton équipe (${team.length})`),
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

async function handleRecruits(interaction: ChatInputCommandInteraction, owner: any) {
  const team = await OwnerService.getTeam(owner.id);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recent = team.filter((m) => m.joinedAt >= thirtyDaysAgo);

  if (recent.length === 0) {
    return interaction.editReply(
      buildReply([errorCard("Aucun recrutement récent", "Aucun recrutement dans les 30 derniers jours.")]),
    );
  }

  const lines = recent.map((m) => {
    const status = m.status === "ACTIVE" ? "✅" : "⚠️";
    return `${status} **${m.username}** — <t:${Math.floor(m.joinedAt.getTime() / 1000)}:R>`;
  });

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.success)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## 🚀 Recrutements récents (${recent.length})`),
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

async function handleStats(interaction: ChatInputCommandInteraction, owner: any) {
  const stats = await OwnerService.getTeamStats(owner.id);
  const tierInfo = OwnerService.getTierInfo(owner.tier);
  const goals = await OwnerGoalsService.getActiveGoals(owner.id);

  const retentionRate = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;

  const goalLines = goals.length > 0
    ? goals.map((g) => {
        const check = g.completed ? "✅" : "⬜";
        return `${check} ${g.description} — ${g.current}/${g.target}`;
      }).join("\n")
    : "Aucun objectif actif";

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.primary)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## 📊 Statistiques Owner"),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${tierInfo.emoji} **${tierInfo.label}** — ${owner.totalScore} pts\n\n` +
        `👥 **Équipe :** ${stats.total} membres\n` +
        `🟢 Actifs : ${stats.active} • 🔴 Inactifs : ${stats.inactive}\n` +
        `📈 **Taux de rétention :** ${retentionRate}%\n\n` +
        `### 🎯 Objectifs\n${goalLines}`,
      ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("-# Yourazz Owner Manager System"),
    );

  await interaction.editReply(buildReply([container]));
}

async function handleLeaderboard(interaction: ChatInputCommandInteraction) {
  const leaderboard = await OwnerService.getLeaderboard(10);

  if (leaderboard.length === 0) {
    return interaction.editReply(buildReply([errorCard("Vide", "Aucun Owner enregistré.")]));
  }

  const medals = ["🥇", "🥈", "🥉"];
  const lines = leaderboard.map((o, i) => {
    const medal = medals[i] ?? `\`${i + 1}.\``;
    const tierInfo = OwnerService.getTierInfo(o.tier);
    return `${medal} <@${o.discordId}> — **${o.totalScore} pts** • ${tierInfo.emoji} • ${o.team.length} actifs`;
  });

  const container = new ContainerBuilder()
    .setAccentColor(THEME.primary)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## 🏆 Classement Owners"),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join("\n")))
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("-# 👑 Yourazz Owner Manager System"),
    );

  await interaction.editReply(buildReply([container]));
}

async function handleHelp(interaction: ChatInputCommandInteraction) {
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.info)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## ❓ Aide — Owner Manager"),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "### 🔑 Comment ça marche\n" +
        "Tu es un **Owner** — un recruteur/manager Yourazz.\n" +
        "Tu recrutes des membres, tu les accompagnes, et tu gagnes des points.\n\n" +
        "### 📈 Points\n" +
        `▸ Recrue active → **+${OWNER_SCORE.RECRUIT_ACTIVE}**\n` +
        `▸ Activité régulière → **+${OWNER_SCORE.MEMBER_REGULAR_ACTIVITY}**\n` +
        `▸ Rétention 30j → **+${OWNER_SCORE.MEMBER_RETAINED_30D}**\n` +
        `▸ Vente membre → **+${OWNER_SCORE.MEMBER_SALE}**\n` +
        `▸ Sanction → **${OWNER_SCORE.MEMBER_SANCTIONED}**\n` +
        `▸ Départ → **${OWNER_SCORE.MEMBER_LEFT}**\n\n` +
        "### 📋 Commandes\n" +
        "▸ `/owner dashboard` — Tableau de bord\n" +
        "▸ `/owner team` — Ton équipe\n" +
        "▸ `/owner stats` — Statistiques\n" +
        "▸ `/owner recruits` — Recrutements récents\n" +
        "▸ `/owner leaderboard` — Classement",
      ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("-# 👑 Yourazz Owner Manager System"),
    );

  await interaction.editReply(buildReply([container]));
}
