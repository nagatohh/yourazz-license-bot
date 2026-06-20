import { prisma } from "../../services/database";
import { OwnerService } from "./owner.service";
import {
  OWNER_SCORE,
  TEAM_LIMIT_BY_TIER,
  DEFAULT_TEAM_LIMIT,
  AWARD_SCORE_ON_SELF_ADD,
  PENALIZE_ON_SELF_REMOVE,
} from "../../config/owners";

/** Statuts considérés comme "présent dans l'équipe". */
const ACTIVE_STATUSES = ["ACTIVE", "INACTIVE", "SANCTIONED"] as const;

export type TeamErrorCode =
  | "ALREADY_IN_TEAM"
  | "IN_OTHER_TEAM"
  | "TEAM_FULL"
  | "NOT_IN_TEAM";

/** Erreur métier sûre : `message` est destiné à l'utilisateur, `code` aux logs. */
export class TeamError extends Error {
  constructor(public code: TeamErrorCode, message: string) {
    super(message);
    this.name = "TeamError";
  }
}

export class OwnerTeamService {
  /** Limite de membres autorisée pour un tier donné. */
  static getTeamLimit(tier: string): number {
    return TEAM_LIMIT_BY_TIER[tier] ?? DEFAULT_TEAM_LIMIT;
  }

  /** Membre déjà actif dans l'équipe d'un AUTRE owner (anti-vol / double équipe). */
  static async getActiveMembershipElsewhere(discordId: string, exceptOwnerId: string) {
    return prisma.ownerTeamMember.findFirst({
      where: {
        discordId,
        ownerId: { not: exceptOwnerId },
        status: { in: [...ACTIVE_STATUSES] },
      },
      include: { owner: true },
    });
  }

  /**
   * Ajoute (ou réactive) un membre dans l'équipe d'un Owner.
   * Toutes les vérifications "base de données" sont faites ici ;
   * les vérifications Discord (bot, staff, présence serveur) sont faites en amont.
   */
  static async addMember(params: {
    owner: { id: string; tier: string };
    memberId: string;
    memberUsername: string;
    addedById: string;
    note?: string | null;
  }) {
    const { owner, memberId, memberUsername, addedById, note } = params;
    const isActive = (s: string) => (ACTIVE_STATUSES as readonly string[]).includes(s);

    // UNE seule requête couvre les 3 vérifs : appartenance ailleurs, présence ici, et taille d'équipe.
    const rows = await prisma.ownerTeamMember.findMany({
      where: {
        OR: [
          { discordId: memberId },
          { ownerId: owner.id, status: { in: [...ACTIVE_STATUSES] } },
        ],
      },
    });

    // 1. Déjà dans une autre équipe ?
    const elsewhere = rows.find((r) => r.discordId === memberId && r.ownerId !== owner.id && isActive(r.status));
    if (elsewhere) {
      throw new TeamError("IN_OTHER_TEAM", "Ce membre appartient déjà à une autre équipe.");
    }

    // 2. Déjà présent dans CETTE équipe ?
    const existing = rows.find((r) => r.discordId === memberId && r.ownerId === owner.id);
    if (existing && existing.status !== "LEFT") {
      throw new TeamError("ALREADY_IN_TEAM", "Ce membre est déjà dans votre équipe.");
    }

    // 3. Limite d'équipe (selon le tier)
    const count = rows.filter((r) => r.ownerId === owner.id && isActive(r.status)).length;
    const limit = this.getTeamLimit(owner.tier);
    if (count >= limit) {
      throw new TeamError(
        "TEAM_FULL",
        `Votre équipe a atteint sa limite (${limit} membres pour votre tier).`,
      );
    }

    // 4. Créer ou réactiver (la ligne LEFT existante doit être réutilisée — contrainte unique)
    let member;
    if (existing) {
      member = await prisma.ownerTeamMember.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          username: memberUsername,
          note: note ?? null,
          addedById,
          leftAt: null,
          joinedAt: new Date(),
          lastActive: new Date(),
        },
      });
    } else {
      try {
        member = await prisma.ownerTeamMember.create({
          data: {
            ownerId: owner.id,
            discordId: memberId,
            username: memberUsername,
            note: note ?? null,
            addedById,
            status: "ACTIVE",
            lastActive: new Date(),
          },
        });
      } catch (err: any) {
        // Course possible entre deux clics : la contrainte unique a tranché.
        if (err?.code === "P2002") {
          throw new TeamError("ALREADY_IN_TEAM", "Ce membre est déjà dans votre équipe.");
        }
        throw err;
      }
    }

    // Anti-farm : pas de +100 automatique sur self-add (cf. config).
    if (AWARD_SCORE_ON_SELF_ADD) {
      await OwnerService.addScore(owner.id, "RECRUIT_ACTIVE", OWNER_SCORE.RECRUIT_ACTIVE, memberId);
    }
    // Recalcul du tier en arrière-plan — ne bloque pas la réponse à l'Owner.
    void OwnerService.checkTierUpgrade(owner.id).catch(() => {});

    return member;
  }

  /**
   * Retire un membre de l'équipe d'un Owner : statut `LEFT`, historique conservé.
   * Vérifie que le membre appartient bien à CET owner (anti-retrait d'une autre équipe).
   */
  static async removeMember(params: { ownerId: string; memberId: string }) {
    const { ownerId, memberId } = params;

    const existing = await prisma.ownerTeamMember.findUnique({
      where: { ownerId_discordId: { ownerId, discordId: memberId } },
    });
    if (!existing || existing.status === "LEFT") {
      throw new TeamError("NOT_IN_TEAM", "Ce membre ne fait pas partie de votre équipe.");
    }

    const member = await prisma.ownerTeamMember.update({
      where: { id: existing.id },
      data: { status: "LEFT", leftAt: new Date() },
    });

    if (PENALIZE_ON_SELF_REMOVE) {
      await OwnerService.addScore(ownerId, "MEMBER_LEFT", OWNER_SCORE.MEMBER_LEFT, memberId);
    }
    // Recalcul du tier en arrière-plan — ne bloque pas la réponse à l'Owner.
    void OwnerService.checkTierUpgrade(ownerId).catch(() => {});

    return member;
  }
}
