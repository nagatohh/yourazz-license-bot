import { env } from "./bot";

export const CHANNELS = {
  staffLog: env.STAFF_LOG_CHANNEL_ID,
  licenseLog: env.LICENSE_LOG_CHANNEL_ID,

  // Automation Core — salons surveillés (lecture)
  vouch: env.VOUCH_CHANNEL_ID,
  feedbackStaff: env.FEEDBACK_STAFF_CHANNEL_ID,
  ticketLog: env.TICKET_LOG_CHANNEL_ID,
  ranks: env.RANKS_CHANNEL_ID,
  objectives: env.OBJECTIVES_CHANNEL_ID,

  // Automation Core — salons de sortie
  ownerLog: env.OWNER_LOG_CHANNEL_ID,
  ownerAlert: env.OWNER_ALERT_CHANNEL_ID,
  ownerDashboard: env.OWNER_DASHBOARD_CHANNEL_ID,
  leaderboardOwner: env.LEADERBOARD_OWNER_CHANNEL_ID,
  leaderboardTeam: env.LEADERBOARD_TEAM_CHANNEL_ID,
  leaderboardStaff: env.LEADERBOARD_STAFF_CHANNEL_ID,
};

/** Types d'events ingérés par l'Automation Core. */
export type WatchedEventType = "VOUCH" | "FEEDBACK" | "TICKET";

/**
 * Map channelId → type d'event. Construite à partir de l'env, en ignorant
 * les salons non configurés (id vide). Sert de filtre au listener messageCreate :
 * seul un message posté dans un de ces salons est analysé.
 */
export const WATCHED_CHANNELS: Record<string, WatchedEventType> = Object.fromEntries(
  (
    [
      [env.VOUCH_CHANNEL_ID, "VOUCH"],
      [env.FEEDBACK_STAFF_CHANNEL_ID, "FEEDBACK"],
      [env.TICKET_LOG_CHANNEL_ID, "TICKET"],
    ] as const
  ).filter(([id]) => id && id.length > 0),
);

/** Retourne le type d'event surveillé pour un salon, ou null. */
export function getWatchedType(channelId: string): WatchedEventType | null {
  return WATCHED_CHANNELS[channelId] ?? null;
}
