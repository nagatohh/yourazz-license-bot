import {
  ButtonInteraction,
  GuildMember,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { OwnerService } from "../modules/owners/owner.service";
import { OwnerGoalsService } from "../modules/owners/owner-goals.service";
import { buildReply, errorCard, ACCENT } from "../utils/cv2";
import { THEME } from "../config/branding";
import { progressBar } from "../utils/premium-embed";
import { OWNER_SCORE, OWNER_ROLE_ID, MANAGER_ROLE_ID } from "../config/owners";
import { isAdmin } from "../utils/permissions";
import { getUserLang, t } from "../i18n";
import {
  showAddMemberModal,
  showRemoveMemberSelect,
  handleConfirmRemove,
  handleCancelRemove,
  withTimeout,
} from "./owner-team";
import { logger } from "../utils/logger";

/** Boutons de gestion d'équipe (➕ / ➖ / 🔄). */
function teamActionRow() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("yrz_owner_addmember").setLabel("➕ Ajouter").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("yrz_owner_removemember").setLabel("➖ Retirer").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("yrz_owner_team").setLabel("🔄 Actualiser").setStyle(ButtonStyle.Secondary),
  );
}

function tp(lang: string, key: string, vars: Record<string, string | number>): string {
  let result = t(lang, key);
  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(`{${k}}`, String(v));
  }
  return result;
}

export async function handleOwnerButton(interaction: ButtonInteraction) {
  const action = interaction.customId.replace("yrz_owner_", "");

  // Ces actions gèrent elles-mêmes leur réponse (modal / select / update).
  // Elles NE doivent PAS être déférées ici (sinon showModal échoue).
  if (action === "addmember") return showAddMemberModal(interaction);
  if (action === "removemember") return showRemoveMemberSelect(interaction);
  if (action.startsWith("confirmremove_")) return handleConfirmRemove(interaction);
  if (action === "cancelremove") return handleCancelRemove(interaction);

  await interaction.deferReply({ ephemeral: true });

  const lang = await withTimeout(getUserLang(interaction.user.id), 4000, "getUserLang").catch(() => "fr");

  // Réponses statiques (aucune DB) — instantanées.
  if (action === "help") return replyHelp(interaction, lang);
  if (action === "rewards") return replyRewards(interaction, lang);

  try {
    if (action === "leaderboard") {
      await withTimeout(replyLeaderboard(interaction, lang), 12000, "leaderboard");
      return;
    }

    const owner = await withTimeout(resolveOwner(interaction), 8000, "resolveOwner");
    if (!owner) {
      return interaction.editReply(
        buildReply([errorCard(t(lang, "owner.accessDenied"), t(lang, "owner.accessDeniedDesc"))]),
      );
    }

    switch (action) {
      case "dashboard": await withTimeout(replyDashboard(interaction, owner, lang), 12000, "dashboard"); return;
      case "team": await withTimeout(replyTeam(interaction, owner, lang), 12000, "team"); return;
      case "objectives": await withTimeout(replyObjectives(interaction, owner, lang), 12000, "objectives"); return;
    }
  } catch (err: any) {
    logger.error("OwnerButton", `${action}: ${err.message}`);
    await interaction
      .editReply(buildReply([errorCard("Base de données lente", "La base ne répond pas pour l'instant. Réessaie dans quelques secondes.")]))
      .catch(() => {});
  }
}

async function resolveOwner(interaction: ButtonInteraction) {
  const owner = await OwnerService.getLite(interaction.user.id);
  if (owner) return owner;

  const member = interaction.member as GuildMember | null;
  const eligible =
    !!member &&
    (member.roles.cache.has(OWNER_ROLE_ID) ||
      isAdmin(member) ||
      (MANAGER_ROLE_ID ? member.roles.cache.has(MANAGER_ROLE_ID) : false));

  if (eligible) {
    return OwnerService.create(interaction.user.id, interaction.user.username);
  }

  return null;
}

async function replyDashboard(interaction: ButtonInteraction, owner: any, lang: string) {
  const stats = await OwnerService.getTeamStats(owner.id);
  const tierInfo = OwnerService.getTierInfo(owner.tier);
  const nextTier = OwnerService.getNextTier(owner.tier);
  const leaderboard = await OwnerService.getLeaderboard();
  const rank = leaderboard.findIndex((o) => o.id === owner.id) + 1;
  const goals = await OwnerGoalsService.getActiveGoals(owner.id);

  const monthlyGoals = goals.filter((g) => g.period === "MONTHLY");
  const completed = monthlyGoals.filter((g) => g.completed).length;
  const total = monthlyGoals.length || 1;

  const container = new ContainerBuilder()
    .setAccentColor(THEME.primary)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(tp(lang, "owner.dashboard.title", { username: interaction.user.username })),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${tierInfo.emoji} ${tierInfo.label}\n` +
        tp(lang, "owner.dashboard.score", { score: owner.totalScore }) + "\n" +
        tp(lang, "owner.dashboard.rank", { rank: rank || "—" }),
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        t(lang, "owner.dashboard.teamTitle") + "\n" +
        tp(lang, "owner.dashboard.teamStats", { total: stats.total, active: stats.active, inactive: stats.inactive }),
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        t(lang, "owner.dashboard.monthlyTitle") + "\n" +
        `${progressBar(completed, total)} (${completed}/${total})` +
        (nextTier
          ? "\n\n" + tp(lang, "owner.dashboard.nextTier", { emoji: nextTier.emoji, label: nextTier.label, minRecruits: nextTier.minRecruits })
          : "\n\n" + t(lang, "owner.dashboard.maxTier")),
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(t(lang, "owner.footer")));

  await interaction.editReply(buildReply([container]));
}

async function replyTeam(interaction: ButtonInteraction, owner: any, lang: string) {
  const team = await OwnerService.getTeam(owner.id);

  if (team.length === 0) {
    const empty = new ContainerBuilder()
      .setAccentColor(ACCENT.info)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${t(lang, "owner.team.empty")}`))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(t(lang, "owner.team.emptyDesc")))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(t(lang, "owner.footer")));
    return interaction.editReply(buildReply([empty], [teamActionRow()]));
  }

  const lines = team.slice(0, 20).map((m) => {
    const icon = m.status === "ACTIVE" ? "🟢" : "🔴";
    const sales = m.totalSales > 0 ? ` • 💰 ${tp(lang, "owner.team.sales", { count: m.totalSales })}` : "";
    const note = m.note ? ` • 📝 ${m.note}` : "";
    return `${icon} <@${m.discordId}> — <t:${Math.floor(m.joinedAt.getTime() / 1000)}:R>${sales}${note}`;
  });

  const stats = await OwnerService.getTeamStats(owner.id);

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.info)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(tp(lang, "owner.team.title", { count: team.length })))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(tp(lang, "owner.team.stats", { active: stats.active, inactive: stats.inactive })),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join("\n")))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(t(lang, "owner.footer")));

  await interaction.editReply(buildReply([container], [teamActionRow()]));
}

async function replyLeaderboard(interaction: ButtonInteraction, lang: string) {
  const leaderboard = await OwnerService.getLeaderboard(10);

  if (leaderboard.length === 0) {
    return interaction.editReply(
      buildReply([errorCard(t(lang, "owner.leaderboard.empty"), t(lang, "owner.leaderboard.emptyDesc"))]),
    );
  }

  const medals = ["🥇", "🥈", "🥉"];
  const lines = leaderboard.map((owner, i) => {
    const medal = medals[i] ?? `\`${i + 1}.\``;
    const tierInfo = OwnerService.getTierInfo(owner.tier);
    return tp(lang, "owner.leaderboard.entry", {
      medal,
      discordId: owner.discordId,
      score: owner.totalScore,
      emoji: tierInfo.emoji,
      tier: tierInfo.label,
      active: owner.team.length,
    });
  });

  const container = new ContainerBuilder()
    .setAccentColor(THEME.primary)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(t(lang, "owner.leaderboard.title")))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join("\n")))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(t(lang, "owner.footer")));

  await interaction.editReply(buildReply([container]));
}

async function replyObjectives(interaction: ButtonInteraction, owner: any, lang: string) {
  const goals = await OwnerGoalsService.getActiveGoals(owner.id);

  const monthly = goals.filter((g) => g.period === "MONTHLY");
  const weekly = goals.filter((g) => g.period === "WEEKLY");

  const formatGoals = (list: typeof goals) =>
    list.length > 0
      ? list.map((g) => {
          const icon = g.completed ? "✅" : "⬜";
          return `${icon} ${g.description} — **${g.current}/${g.target}**`;
        }).join("\n")
      : t(lang, "owner.objectives.none");

  const container = new ContainerBuilder()
    .setAccentColor(THEME.primary)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(t(lang, "owner.objectives.title")))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${t(lang, "owner.objectives.monthly")}\n${formatGoals(monthly)}\n\n${t(lang, "owner.objectives.weekly")}\n${formatGoals(weekly)}`,
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        t(lang, "owner.objectives.tipsTitle") + "\n" +
        t(lang, "owner.objectives.tip1") + "\n" +
        t(lang, "owner.objectives.tip2") + "\n" +
        t(lang, "owner.objectives.tip3"),
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(t(lang, "owner.footer")));

  await interaction.editReply(buildReply([container]));
}

async function replyRewards(interaction: ButtonInteraction, lang: string) {
  const container = new ContainerBuilder()
    .setAccentColor(THEME.primary)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(t(lang, "owner.rewards.title")))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        t(lang, "owner.rewards.tierTitle") + "\n\n" +
        t(lang, "owner.rewards.bronze") + "\n\n" +
        t(lang, "owner.rewards.silver") + "\n\n" +
        t(lang, "owner.rewards.gold") + "\n\n" +
        t(lang, "owner.rewards.diamond") + "\n\n" +
        t(lang, "owner.rewards.legend"),
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(t(lang, "owner.footer")));

  await interaction.editReply(buildReply([container]));
}

async function replyHelp(interaction: ButtonInteraction, lang: string) {
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.info)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(t(lang, "owner.help.title")))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        t(lang, "owner.help.howTitle") + "\n" +
        t(lang, "owner.help.howDesc") + "\n\n" +
        t(lang, "owner.help.earnTitle") + "\n" +
        tp(lang, "owner.help.earnRecruit", { pts: OWNER_SCORE.RECRUIT_ACTIVE }) + "\n" +
        tp(lang, "owner.help.earnActivity", { pts: OWNER_SCORE.MEMBER_REGULAR_ACTIVITY }) + "\n" +
        tp(lang, "owner.help.earnRetention", { pts: OWNER_SCORE.MEMBER_RETAINED_30D }) + "\n" +
        tp(lang, "owner.help.earnSale", { pts: OWNER_SCORE.MEMBER_SALE }) + "\n\n" +
        t(lang, "owner.help.noPointsTitle") + "\n" +
        t(lang, "owner.help.noPointsDesc") + "\n\n" +
        t(lang, "owner.help.costTitle") + "\n" +
        tp(lang, "owner.help.costSanction", { pts: OWNER_SCORE.MEMBER_SANCTIONED }) + "\n" +
        tp(lang, "owner.help.costLeft", { pts: OWNER_SCORE.MEMBER_LEFT }) + "\n\n" +
        t(lang, "owner.help.commandsTitle") + "\n" +
        t(lang, "owner.help.commandsList"),
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(t(lang, "owner.footer")));

  await interaction.editReply(buildReply([container]));
}
