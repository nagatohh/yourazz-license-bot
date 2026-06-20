import { EventEmitter } from "node:events";
/**
 * Events internes de l'Automation Core. Permet aux phases suivantes
 * (stats équipe, score Owner, objectifs, alertes, leaderboards) de réagir
 * sans coupler les services entre eux.
 */
export declare const AUTOMATION_EVENTS: {
    readonly VOUCH_DETECTED: "VOUCH_DETECTED";
    readonly FEEDBACK_DETECTED: "FEEDBACK_DETECTED";
    readonly TICKET_CLOSED_DETECTED: "TICKET_CLOSED_DETECTED";
    readonly SELLER_STATS_UPDATED: "SELLER_STATS_UPDATED";
    readonly TEAM_STATS_UPDATED: "TEAM_STATS_UPDATED";
    readonly OWNER_STATS_UPDATED: "OWNER_STATS_UPDATED";
    readonly OBJECTIVE_PROGRESS_UPDATED: "OBJECTIVE_PROGRESS_UPDATED";
    readonly OWNER_ALERT_TRIGGERED: "OWNER_ALERT_TRIGGERED";
    readonly LEADERBOARD_REFRESHED: "LEADERBOARD_REFRESHED";
};
export type AutomationEventName = keyof typeof AUTOMATION_EVENTS;
declare class AutomationBus extends EventEmitter {
    /** Émet un event interne en le loggant proprement. */
    emitEvent(name: AutomationEventName, payload?: Record<string, unknown>): boolean;
    /** Écoute typée d'un event interne. */
    onEvent(name: AutomationEventName, handler: (payload: any) => void | Promise<void>): void;
}
export declare const automationBus: AutomationBus;
export {};
//# sourceMappingURL=automation-events.d.ts.map