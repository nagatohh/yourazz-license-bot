"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationBus = exports.AUTOMATION_EVENTS = void 0;
const node_events_1 = require("node:events");
const logger_1 = require("../../utils/logger");
/**
 * Events internes de l'Automation Core. Permet aux phases suivantes
 * (stats équipe, score Owner, objectifs, alertes, leaderboards) de réagir
 * sans coupler les services entre eux.
 */
exports.AUTOMATION_EVENTS = {
    VOUCH_DETECTED: "VOUCH_DETECTED",
    FEEDBACK_DETECTED: "FEEDBACK_DETECTED",
    TICKET_CLOSED_DETECTED: "TICKET_CLOSED_DETECTED",
    SELLER_STATS_UPDATED: "SELLER_STATS_UPDATED",
    TEAM_STATS_UPDATED: "TEAM_STATS_UPDATED",
    OWNER_STATS_UPDATED: "OWNER_STATS_UPDATED",
    OBJECTIVE_PROGRESS_UPDATED: "OBJECTIVE_PROGRESS_UPDATED",
    OWNER_ALERT_TRIGGERED: "OWNER_ALERT_TRIGGERED",
    LEADERBOARD_REFRESHED: "LEADERBOARD_REFRESHED",
};
class AutomationBus extends node_events_1.EventEmitter {
    /** Émet un event interne en le loggant proprement. */
    emitEvent(name, payload) {
        logger_1.logger.info("AutomationBus", `Event ${name}`, payload);
        this.emit(name, payload);
        return true;
    }
    /** Écoute typée d'un event interne. */
    onEvent(name, handler) {
        this.on(name, (payload) => {
            Promise.resolve(handler(payload)).catch((err) => logger_1.logger.error("AutomationBus", `Handler ${name} a échoué: ${err?.message ?? err}`));
        });
    }
}
exports.automationBus = new AutomationBus();
// Le bus peut avoir de nombreux abonnés (1 par phase) — on évite le warning Node.
exports.automationBus.setMaxListeners(50);
//# sourceMappingURL=automation-events.js.map