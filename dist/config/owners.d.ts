export declare const OWNER_SCORE: {
    readonly RECRUIT_ACTIVE: 100;
    readonly MEMBER_REGULAR_ACTIVITY: 50;
    readonly MEMBER_RETAINED_30D: 100;
    readonly MEMBER_SALE: 75;
    readonly MEMBER_SANCTIONED: -100;
    readonly MEMBER_LEFT: -150;
};
export declare const OWNER_TIERS: readonly [{
    readonly tier: "BRONZE";
    readonly label: "Bronze";
    readonly emoji: "🥉";
    readonly minRecruits: 5;
}, {
    readonly tier: "SILVER";
    readonly label: "Silver";
    readonly emoji: "🥈";
    readonly minRecruits: 15;
}, {
    readonly tier: "GOLD";
    readonly label: "Gold";
    readonly emoji: "🥇";
    readonly minRecruits: 30;
}, {
    readonly tier: "DIAMOND";
    readonly label: "Diamond";
    readonly emoji: "💎";
    readonly minRecruits: 50;
}, {
    readonly tier: "LEGEND";
    readonly label: "Legend";
    readonly emoji: "🏆";
    readonly minRecruits: 100;
}];
export declare const MONTHLY_GOALS: {
    readonly recruits: 3;
    readonly retentionRate: 90;
    readonly noSanctions: true;
};
export declare const WEEKLY_GOALS: {
    readonly checkTeam: true;
    readonly accompanyNew: true;
};
export declare const INACTIVITY_THRESHOLD_DAYS = 7;
export declare const RETENTION_CHECK_DAYS = 30;
export declare const LEADERBOARD_SIZE = 15;
/** Rôle Owner — donne accès au panel et à la gestion d'équipe. */
export declare const OWNER_ROLE_ID = "1513846685615526049";
/** Rôle Manager (optionnel). Laisser "" si inexistant. */
export declare const MANAGER_ROLE_ID = "";
/**
 * Si défini, un membre doit posséder ce rôle (staff / vendeur / licence)
 * pour pouvoir être ajouté à une équipe. "" = aucune exigence.
 */
export declare const TEAM_REQUIRED_ROLE_ID = "";
/** Longueur max d'une note interne sur un membre. */
export declare const TEAM_NOTE_MAX = 200;
/** Taille d'équipe maximale autorisée par tier (membres actifs). */
export declare const TEAM_LIMIT_BY_TIER: Record<string, number>;
/** Limite par défaut si le tier est inconnu. */
export declare const DEFAULT_TEAM_LIMIT = 10;
/**
 * Anti-farm : un Owner qui s'ajoute lui-même un membre NE gagne PAS
 * automatiquement les +100 pts (RECRUIT_ACTIVE). Les points sont
 * attribués par l'activité réelle / la rétention / les ventes.
 */
export declare const AWARD_SCORE_ON_SELF_ADD = false;
/**
 * Un Owner qui retire lui-même un membre n'est PAS pénalisé (-150).
 * Le retrait manuel est de la curation, pas un départ subi.
 */
export declare const PENALIZE_ON_SELF_REMOVE = false;
//# sourceMappingURL=owners.d.ts.map