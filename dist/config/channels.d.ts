export declare const CHANNELS: {
    staffLog: string;
    licenseLog: string;
    vouch: string;
    feedbackStaff: string;
    ticketLog: string;
    ranks: string;
    objectives: string;
    ownerLog: string;
    ownerAlert: string;
    ownerDashboard: string;
    leaderboardOwner: string;
    leaderboardTeam: string;
    leaderboardStaff: string;
};
/** Types d'events ingérés par l'Automation Core. */
export type WatchedEventType = "VOUCH" | "FEEDBACK" | "TICKET";
/**
 * Map channelId → type d'event. Construite à partir de l'env, en ignorant
 * les salons non configurés (id vide). Sert de filtre au listener messageCreate :
 * seul un message posté dans un de ces salons est analysé.
 */
export declare const WATCHED_CHANNELS: Record<string, WatchedEventType>;
/** Retourne le type d'event surveillé pour un salon, ou null. */
export declare function getWatchedType(channelId: string): WatchedEventType | null;
//# sourceMappingURL=channels.d.ts.map