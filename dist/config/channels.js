"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WATCHED_CHANNELS = exports.CHANNELS = void 0;
exports.getWatchedType = getWatchedType;
const bot_1 = require("./bot");
exports.CHANNELS = {
    staffLog: bot_1.env.STAFF_LOG_CHANNEL_ID,
    licenseLog: bot_1.env.LICENSE_LOG_CHANNEL_ID,
    // Automation Core — salons surveillés (lecture)
    vouch: bot_1.env.VOUCH_CHANNEL_ID,
    feedbackStaff: bot_1.env.FEEDBACK_STAFF_CHANNEL_ID,
    ticketLog: bot_1.env.TICKET_LOG_CHANNEL_ID,
    ranks: bot_1.env.RANKS_CHANNEL_ID,
    objectives: bot_1.env.OBJECTIVES_CHANNEL_ID,
    // Automation Core — salons de sortie
    ownerLog: bot_1.env.OWNER_LOG_CHANNEL_ID,
    ownerAlert: bot_1.env.OWNER_ALERT_CHANNEL_ID,
    ownerDashboard: bot_1.env.OWNER_DASHBOARD_CHANNEL_ID,
    leaderboardOwner: bot_1.env.LEADERBOARD_OWNER_CHANNEL_ID,
    leaderboardTeam: bot_1.env.LEADERBOARD_TEAM_CHANNEL_ID,
    leaderboardStaff: bot_1.env.LEADERBOARD_STAFF_CHANNEL_ID,
};
/**
 * Map channelId → type d'event. Construite à partir de l'env, en ignorant
 * les salons non configurés (id vide). Sert de filtre au listener messageCreate :
 * seul un message posté dans un de ces salons est analysé.
 */
exports.WATCHED_CHANNELS = Object.fromEntries([
    [bot_1.env.VOUCH_CHANNEL_ID, "VOUCH"],
    [bot_1.env.FEEDBACK_STAFF_CHANNEL_ID, "FEEDBACK"],
    [bot_1.env.TICKET_LOG_CHANNEL_ID, "TICKET"],
].filter(([id]) => id && id.length > 0));
/** Retourne le type d'event surveillé pour un salon, ou null. */
function getWatchedType(channelId) {
    return exports.WATCHED_CHANNELS[channelId] ?? null;
}
//# sourceMappingURL=channels.js.map