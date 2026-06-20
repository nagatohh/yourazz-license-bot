import { CronJob } from "cron";
import { Client } from "discord.js";
import { prisma } from "../../services/database";
import { OwnerService } from "./owner.service";
import { OwnerGoalsService } from "./owner-goals.service";
import { OwnerLeaderboardService } from "./owner-leaderboard.service";
import { INACTIVITY_THRESHOLD_DAYS, RETENTION_CHECK_DAYS, OWNER_SCORE } from "../../config/owners";
import { logger } from "../../utils/logger";

export function startOwnerJobs(client: Client) {
  // Toutes les heures: détection inactivité + score activité régulière
  const activityJob = new CronJob("0 0 * * * *", async () => {
    await checkInactivity();
    await checkRegularActivity();
  });

  // Toutes les 6h: mise à jour leaderboard
  const leaderboardJob = new CronJob("0 0 */6 * * *", async () => {
    await OwnerLeaderboardService.update(client);
  });

  // Tous les jours à minuit: rétention 30j + goals
  const dailyJob = new CronJob("0 0 0 * * *", async () => {
    await checkRetention();
    await generateGoals();
    await checkTiers();
  });

  activityJob.start();
  leaderboardJob.start();
  dailyJob.start();

  logger.info("OwnerJobs", "Jobs Owner Manager démarrés");
}

async function checkInactivity() {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - INACTIVITY_THRESHOLD_DAYS);

  const result = await prisma.ownerTeamMember.updateMany({
    where: {
      status: "ACTIVE",
      lastActive: { lt: threshold },
    },
    data: { status: "INACTIVE" },
  });

  if (result.count > 0) {
    logger.info("OwnerJobs", `${result.count} membres marqués inactifs`);
  }
}

async function checkRegularActivity() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const activeMembers = await prisma.ownerTeamMember.findMany({
    where: {
      status: "ACTIVE",
      lastActive: { gte: oneWeekAgo },
      totalSales: { gt: 0 },
    },
  });

  const ownerIds = [...new Set(activeMembers.map((m) => m.ownerId))];

  for (const ownerId of ownerIds) {
    const alreadyRewarded = await prisma.ownerScoreEvent.findFirst({
      where: {
        ownerId,
        type: "MEMBER_REGULAR_ACTIVITY",
        createdAt: { gte: oneWeekAgo },
      },
    });
    if (alreadyRewarded) continue;

    const ownerActiveCount = activeMembers.filter((m) => m.ownerId === ownerId).length;
    if (ownerActiveCount >= 3) {
      await OwnerService.addScore(ownerId, "MEMBER_REGULAR_ACTIVITY", OWNER_SCORE.MEMBER_REGULAR_ACTIVITY);
    }
  }
}

async function checkRetention() {
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - RETENTION_CHECK_DAYS);

  const retained = await prisma.ownerTeamMember.findMany({
    where: {
      status: "ACTIVE",
      joinedAt: { lte: retentionDate },
    },
  });

  for (const member of retained) {
    const alreadyRewarded = await prisma.ownerScoreEvent.findFirst({
      where: {
        ownerId: member.ownerId,
        type: "MEMBER_RETAINED_30D",
        memberId: member.discordId,
      },
    });
    if (alreadyRewarded) continue;

    await OwnerService.addScore(
      member.ownerId,
      "MEMBER_RETAINED_30D",
      OWNER_SCORE.MEMBER_RETAINED_30D,
      member.discordId,
    );
  }
}

async function generateGoals() {
  const owners = await prisma.owner.findMany({ where: { isActive: true } });
  for (const owner of owners) {
    await OwnerGoalsService.createMonthlyGoals(owner.id);
    await OwnerGoalsService.createWeeklyGoals(owner.id);
  }
}

async function checkTiers() {
  const owners = await prisma.owner.findMany({ where: { isActive: true } });
  for (const owner of owners) {
    await OwnerService.checkTierUpgrade(owner.id);
  }
}
