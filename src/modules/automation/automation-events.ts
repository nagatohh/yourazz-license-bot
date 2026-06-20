import { EventEmitter } from "node:events";
import { logger } from "../../utils/logger";

/**
 * Events internes de l'Automation Core. Permet aux phases suivantes
 * (stats équipe, score Owner, objectifs, alertes, leaderboards) de réagir
 * sans coupler les services entre eux.
 */
export const AUTOMATION_EVENTS = {
  VOUCH_DETECTED: "VOUCH_DETECTED",
  FEEDBACK_DETECTED: "FEEDBACK_DETECTED",
  TICKET_CLOSED_DETECTED: "TICKET_CLOSED_DETECTED",
  SELLER_STATS_UPDATED: "SELLER_STATS_UPDATED",
  TEAM_STATS_UPDATED: "TEAM_STATS_UPDATED",
  OWNER_STATS_UPDATED: "OWNER_STATS_UPDATED",
  OBJECTIVE_PROGRESS_UPDATED: "OBJECTIVE_PROGRESS_UPDATED",
  OWNER_ALERT_TRIGGERED: "OWNER_ALERT_TRIGGERED",
  LEADERBOARD_REFRESHED: "LEADERBOARD_REFRESHED",
} as const;

export type AutomationEventName = keyof typeof AUTOMATION_EVENTS;

class AutomationBus extends EventEmitter {
  /** Émet un event interne en le loggant proprement. */
  emitEvent(name: AutomationEventName, payload?: Record<string, unknown>) {
    logger.info("AutomationBus", `Event ${name}`, payload);
    this.emit(name, payload);
    return true;
  }

  /** Écoute typée d'un event interne. */
  onEvent(name: AutomationEventName, handler: (payload: any) => void | Promise<void>) {
    this.on(name, (payload) => {
      Promise.resolve(handler(payload)).catch((err) =>
        logger.error("AutomationBus", `Handler ${name} a échoué: ${err?.message ?? err}`),
      );
    });
  }
}

export const automationBus = new AutomationBus();
// Le bus peut avoir de nombreux abonnés (1 par phase) — on évite le warning Node.
automationBus.setMaxListeners(50);
