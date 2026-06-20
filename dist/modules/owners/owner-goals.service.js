"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnerGoalsService = void 0;
const database_1 = require("../../services/database");
const owners_1 = require("../../config/owners");
class OwnerGoalsService {
    static async createMonthlyGoals(ownerId) {
        const now = new Date();
        const startsAt = new Date(now.getFullYear(), now.getMonth(), 1);
        const endsAt = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const existing = await database_1.prisma.ownerGoal.findFirst({
            where: { ownerId, period: "MONTHLY", startsAt: { gte: startsAt } },
        });
        if (existing)
            return;
        await database_1.prisma.ownerGoal.createMany({
            data: [
                {
                    ownerId,
                    period: "MONTHLY",
                    description: `Recruter ${owners_1.MONTHLY_GOALS.recruits} profils actifs`,
                    target: owners_1.MONTHLY_GOALS.recruits,
                    startsAt,
                    endsAt,
                },
                {
                    ownerId,
                    period: "MONTHLY",
                    description: `Maintenir ${owners_1.MONTHLY_GOALS.retentionRate}% d'activité`,
                    target: owners_1.MONTHLY_GOALS.retentionRate,
                    startsAt,
                    endsAt,
                },
                {
                    ownerId,
                    period: "MONTHLY",
                    description: "Aucune sanction grave dans l'équipe",
                    target: 0,
                    startsAt,
                    endsAt,
                },
            ],
        });
    }
    static async createWeeklyGoals(ownerId) {
        const now = new Date();
        const day = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59);
        const existing = await database_1.prisma.ownerGoal.findFirst({
            where: { ownerId, period: "WEEKLY", startsAt: { gte: monday } },
        });
        if (existing)
            return;
        await database_1.prisma.ownerGoal.createMany({
            data: [
                {
                    ownerId,
                    period: "WEEKLY",
                    description: "Suivre son équipe",
                    target: 1,
                    startsAt: monday,
                    endsAt: sunday,
                },
                {
                    ownerId,
                    period: "WEEKLY",
                    description: "Accompagner les nouveaux",
                    target: 1,
                    startsAt: monday,
                    endsAt: sunday,
                },
            ],
        });
    }
    static async getActiveGoals(ownerId) {
        const now = new Date();
        return database_1.prisma.ownerGoal.findMany({
            where: {
                ownerId,
                endsAt: { gte: now },
                completed: false,
            },
            orderBy: { endsAt: "asc" },
        });
    }
    static async updateGoalProgress(goalId, current) {
        const goal = await database_1.prisma.ownerGoal.findUnique({ where: { id: goalId } });
        if (!goal)
            return;
        const completed = current >= goal.target;
        await database_1.prisma.ownerGoal.update({
            where: { id: goalId },
            data: { current, completed },
        });
    }
    static async incrementGoal(ownerId, description) {
        const now = new Date();
        const goal = await database_1.prisma.ownerGoal.findFirst({
            where: {
                ownerId,
                description: { contains: description },
                endsAt: { gte: now },
                completed: false,
            },
        });
        if (!goal)
            return;
        const newCurrent = goal.current + 1;
        await database_1.prisma.ownerGoal.update({
            where: { id: goal.id },
            data: { current: newCurrent, completed: newCurrent >= goal.target },
        });
    }
}
exports.OwnerGoalsService = OwnerGoalsService;
//# sourceMappingURL=owner-goals.service.js.map