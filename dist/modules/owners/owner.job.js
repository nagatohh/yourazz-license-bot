"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startOwnerJobs = startOwnerJobs;
const cron_1 = require("cron");
const database_1 = require("../../services/database");
const owner_service_1 = require("./owner.service");
const owner_goals_service_1 = require("./owner-goals.service");
const owner_leaderboard_service_1 = require("./owner-leaderboard.service");
const owners_1 = require("../../config/owners");
const logger_1 = require("../../utils/logger");
function startOwnerJobs(client) {
    // Toutes les heures: détection inactivité + score activité régulière
    const activityJob = new cron_1.CronJob("0 0 * * * *", async () => {
        await checkInactivity();
        await checkRegularActivity();
    });
    // Toutes les 6h: mise à jour leaderboard
    const leaderboardJob = new cron_1.CronJob("0 0 */6 * * *", async () => {
        await owner_leaderboard_service_1.OwnerLeaderboardService.update(client);
    });
    // Tous les jours à minuit: rétention 30j + goals
    const dailyJob = new cron_1.CronJob("0 0 0 * * *", async () => {
        await checkRetention();
        await generateGoals();
        await checkTiers();
    });
    activityJob.start();
    leaderboardJob.start();
    dailyJob.start();
    logger_1.logger.info("OwnerJobs", "Jobs Owner Manager démarrés");
}
async function checkInactivity() {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - owners_1.INACTIVITY_THRESHOLD_DAYS);
    const result = await database_1.prisma.ownerTeamMember.updateMany({
        where: {
            status: "ACTIVE",
            lastActive: { lt: threshold },
        },
        data: { status: "INACTIVE" },
    });
    if (result.count > 0) {
        logger_1.logger.info("OwnerJobs", `${result.count} membres marqués inactifs`);
    }
}
async function checkRegularActivity() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const activeMembers = await database_1.prisma.ownerTeamMember.findMany({
        where: {
            status: "ACTIVE",
            lastActive: { gte: oneWeekAgo },
            totalSales: { gt: 0 },
        },
    });
    const ownerIds = [...new Set(activeMembers.map((m) => m.ownerId))];
    for (const ownerId of ownerIds) {
        const alreadyRewarded = await database_1.prisma.ownerScoreEvent.findFirst({
            where: {
                ownerId,
                type: "MEMBER_REGULAR_ACTIVITY",
                createdAt: { gte: oneWeekAgo },
            },
        });
        if (alreadyRewarded)
            continue;
        const ownerActiveCount = activeMembers.filter((m) => m.ownerId === ownerId).length;
        if (ownerActiveCount >= 3) {
            await owner_service_1.OwnerService.addScore(ownerId, "MEMBER_REGULAR_ACTIVITY", owners_1.OWNER_SCORE.MEMBER_REGULAR_ACTIVITY);
        }
    }
}
async function checkRetention() {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - owners_1.RETENTION_CHECK_DAYS);
    const retained = await database_1.prisma.ownerTeamMember.findMany({
        where: {
            status: "ACTIVE",
            joinedAt: { lte: retentionDate },
        },
    });
    for (const member of retained) {
        const alreadyRewarded = await database_1.prisma.ownerScoreEvent.findFirst({
            where: {
                ownerId: member.ownerId,
                type: "MEMBER_RETAINED_30D",
                memberId: member.discordId,
            },
        });
        if (alreadyRewarded)
            continue;
        await owner_service_1.OwnerService.addScore(member.ownerId, "MEMBER_RETAINED_30D", owners_1.OWNER_SCORE.MEMBER_RETAINED_30D, member.discordId);
    }
}
async function generateGoals() {
    const owners = await database_1.prisma.owner.findMany({ where: { isActive: true } });
    for (const owner of owners) {
        await owner_goals_service_1.OwnerGoalsService.createMonthlyGoals(owner.id);
        await owner_goals_service_1.OwnerGoalsService.createWeeklyGoals(owner.id);
    }
}
async function checkTiers() {
    const owners = await database_1.prisma.owner.findMany({ where: { isActive: true } });
    for (const owner of owners) {
        await owner_service_1.OwnerService.checkTierUpgrade(owner.id);
    }
}
//# sourceMappingURL=owner.job.js.map