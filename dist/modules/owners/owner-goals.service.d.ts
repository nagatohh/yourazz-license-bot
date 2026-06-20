export declare class OwnerGoalsService {
    static createMonthlyGoals(ownerId: string): Promise<void>;
    static createWeeklyGoals(ownerId: string): Promise<void>;
    static getActiveGoals(ownerId: string): Promise<{
        id: string;
        createdAt: Date;
        description: string;
        ownerId: string;
        target: number;
        completed: boolean;
        endsAt: Date;
        period: import(".prisma/client").$Enums.GoalPeriod;
        metric: string | null;
        current: number;
        startsAt: Date;
    }[]>;
    static updateGoalProgress(goalId: string, current: number): Promise<void>;
    static incrementGoal(ownerId: string, description: string): Promise<void>;
}
//# sourceMappingURL=owner-goals.service.d.ts.map