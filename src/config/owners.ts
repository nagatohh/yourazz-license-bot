export const OWNER_SCORE = {
  RECRUIT_ACTIVE: 100,
  MEMBER_REGULAR_ACTIVITY: 50,
  MEMBER_RETAINED_30D: 100,
  MEMBER_SALE: 75,
  MEMBER_SANCTIONED: -100,
  MEMBER_LEFT: -150,
  // Phase 2 — Automation Core
  TEAM_VOUCH: 10,
  GOOD_RATING: 5,
  BAD_RATING: -15,
  TICKET_HANDLED: 5,
} as const;

export const OWNER_TIERS = [
  { tier: "BRONZE" as const, label: "Bronze", emoji: "🥉", minRecruits: 5 },
  { tier: "SILVER" as const, label: "Silver", emoji: "🥈", minRecruits: 15 },
  { tier: "GOLD" as const, label: "Gold", emoji: "🥇", minRecruits: 30 },
  { tier: "DIAMOND" as const, label: "Diamond", emoji: "💎", minRecruits: 50 },
  { tier: "LEGEND" as const, label: "Legend", emoji: "🏆", minRecruits: 100 },
] as const;

export const MONTHLY_GOALS = {
  recruits: 3,
  retentionRate: 90,
  noSanctions: true,
} as const;

export const WEEKLY_GOALS = {
  checkTeam: true,
  accompanyNew: true,
} as const;

export const INACTIVITY_THRESHOLD_DAYS = 7;
export const RETENTION_CHECK_DAYS = 30;
export const LEADERBOARD_SIZE = 15;

// ═══════════════════════════════════════
// GESTION D'ÉQUIPE PAR LES OWNERS (self-service)
// ═══════════════════════════════════════

/** Rôle Owner — donne accès au panel et à la gestion d'équipe. */
export const OWNER_ROLE_ID = "1513846685615526049";

/** Rôle Manager (optionnel). Laisser "" si inexistant. */
export const MANAGER_ROLE_ID = "";

/**
 * Si défini, un membre doit posséder ce rôle (staff / vendeur / licence)
 * pour pouvoir être ajouté à une équipe. "" = aucune exigence.
 */
export const TEAM_REQUIRED_ROLE_ID = "";

/** Longueur max d'une note interne sur un membre. */
export const TEAM_NOTE_MAX = 200;

/** Taille d'équipe maximale autorisée par tier (membres actifs). */
export const TEAM_LIMIT_BY_TIER: Record<string, number> = {
  BRONZE: 10,
  SILVER: 25,
  GOLD: 50,
  DIAMOND: 100,
  LEGEND: 250,
};

/** Limite par défaut si le tier est inconnu. */
export const DEFAULT_TEAM_LIMIT = 10;

/**
 * Anti-farm : un Owner qui s'ajoute lui-même un membre NE gagne PAS
 * automatiquement les +100 pts (RECRUIT_ACTIVE). Les points sont
 * attribués par l'activité réelle / la rétention / les ventes.
 */
export const AWARD_SCORE_ON_SELF_ADD = false;

/**
 * Un Owner qui retire lui-même un membre n'est PAS pénalisé (-150).
 * Le retrait manuel est de la curation, pas un départ subi.
 */
export const PENALIZE_ON_SELF_REMOVE = false;
