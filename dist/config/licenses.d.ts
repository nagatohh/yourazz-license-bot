export interface PlanConfig {
    name: string;
    displayName: string;
    emoji: string;
    price: number;
    currency: string;
    durationDays: number;
    maxProducts: number;
    roleId: string;
    features: string[];
    color: number;
}
export declare const PLANS: Record<string, PlanConfig>;
export declare const REMINDER_DAYS: number[];
//# sourceMappingURL=licenses.d.ts.map