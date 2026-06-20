"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PENALIZE_ON_SELF_REMOVE = exports.AWARD_SCORE_ON_SELF_ADD = exports.DEFAULT_TEAM_LIMIT = exports.TEAM_LIMIT_BY_TIER = exports.TEAM_NOTE_MAX = exports.TEAM_REQUIRED_ROLE_ID = exports.MANAGER_ROLE_ID = exports.OWNER_ROLE_ID = exports.LEADERBOARD_SIZE = exports.RETENTION_CHECK_DAYS = exports.INACTIVITY_THRESHOLD_DAYS = exports.WEEKLY_GOALS = exports.MONTHLY_GOALS = exports.OWNER_TIERS = exports.OWNER_SCORE = void 0;
exports.OWNER_SCORE = {
    RECRUIT_ACTIVE: 100,
    MEMBER_REGULAR_ACTIVITY: 50,
    MEMBER_RETAINED_30D: 100,
    MEMBER_SALE: 75,
    MEMBER_SANCTIONED: -100,
    MEMBER_LEFT: -150,
};
exports.OWNER_TIERS = [
    { tier: "BRONZE", label: "Bronze", emoji: "🥉", minRecruits: 5 },
    { tier: "SILVER", label: "Silver", emoji: "🥈", minRecruits: 15 },
    { tier: "GOLD", label: "Gold", emoji: "🥇", minRecruits: 30 },
    { tier: "DIAMOND", label: "Diamond", emoji: "💎", minRecruits: 50 },
    { tier: "LEGEND", label: "Legend", emoji: "🏆", minRecruits: 100 },
];
exports.MONTHLY_GOALS = {
    recruits: 3,
    retentionRate: 90,
    noSanctions: true,
};
exports.WEEKLY_GOALS = {
    checkTeam: true,
    accompanyNew: true,
};
exports.INACTIVITY_THRESHOLD_DAYS = 7;
exports.RETENTION_CHECK_DAYS = 30;
exports.LEADERBOARD_SIZE = 15;
// ═══════════════════════════════════════
// GESTION D'ÉQUIPE PAR LES OWNERS (self-service)
// ═══════════════════════════════════════
/** Rôle Owner — donne accès au panel et à la gestion d'équipe. */
exports.OWNER_ROLE_ID = "1513846685615526049";
/** Rôle Manager (optionnel). Laisser "" si inexistant. */
exports.MANAGER_ROLE_ID = "";
/**
 * Si défini, un membre doit posséder ce rôle (staff / vendeur / licence)
 * pour pouvoir être ajouté à une équipe. "" = aucune exigence.
 */
exports.TEAM_REQUIRED_ROLE_ID = "";
/** Longueur max d'une note interne sur un membre. */
exports.TEAM_NOTE_MAX = 200;
/** Taille d'équipe maximale autorisée par tier (membres actifs). */
exports.TEAM_LIMIT_BY_TIER = {
    BRONZE: 10,
    SILVER: 25,
    GOLD: 50,
    DIAMOND: 100,
    LEGEND: 250,
};
/** Limite par défaut si le tier est inconnu. */
exports.DEFAULT_TEAM_LIMIT = 10;
/**
 * Anti-farm : un Owner qui s'ajoute lui-même un membre NE gagne PAS
 * automatiquement les +100 pts (RECRUIT_ACTIVE). Les points sont
 * attribués par l'activité réelle / la rétention / les ventes.
 */
exports.AWARD_SCORE_ON_SELF_ADD = false;
/**
 * Un Owner qui retire lui-même un membre n'est PAS pénalisé (-150).
 * Le retrait manuel est de la curation, pas un départ subi.
 */
exports.PENALIZE_ON_SELF_REMOVE = false;
//# sourceMappingURL=owners.js.map