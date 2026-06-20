"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnerTeamService = exports.TeamError = void 0;
const database_1 = require("../../services/database");
const owner_service_1 = require("./owner.service");
const owners_1 = require("../../config/owners");
/** Statuts considérés comme "présent dans l'équipe". */
const ACTIVE_STATUSES = ["ACTIVE", "INACTIVE", "SANCTIONED"];
/** Erreur métier sûre : `message` est destiné à l'utilisateur, `code` aux logs. */
class TeamError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = "TeamError";
    }
}
exports.TeamError = TeamError;
class OwnerTeamService {
    /** Limite de membres autorisée pour un tier donné. */
    static getTeamLimit(tier) {
        return owners_1.TEAM_LIMIT_BY_TIER[tier] ?? owners_1.DEFAULT_TEAM_LIMIT;
    }
    /** Membre déjà actif dans l'équipe d'un AUTRE owner (anti-vol / double équipe). */
    static async getActiveMembershipElsewhere(discordId, exceptOwnerId) {
        return database_1.prisma.ownerTeamMember.findFirst({
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
    static async addMember(params) {
        const { owner, memberId, memberUsername, addedById, note } = params;
        const isActive = (s) => ACTIVE_STATUSES.includes(s);
        // UNE seule requête couvre les 3 vérifs : appartenance ailleurs, présence ici, et taille d'équipe.
        const rows = await database_1.prisma.ownerTeamMember.findMany({
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
            throw new TeamError("TEAM_FULL", `Votre équipe a atteint sa limite (${limit} membres pour votre tier).`);
        }
        // 4. Créer ou réactiver (la ligne LEFT existante doit être réutilisée — contrainte unique)
        let member;
        if (existing) {
            member = await database_1.prisma.ownerTeamMember.update({
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
        }
        else {
            try {
                member = await database_1.prisma.ownerTeamMember.create({
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
            }
            catch (err) {
                // Course possible entre deux clics : la contrainte unique a tranché.
                if (err?.code === "P2002") {
                    throw new TeamError("ALREADY_IN_TEAM", "Ce membre est déjà dans votre équipe.");
                }
                throw err;
            }
        }
        // Anti-farm : pas de +100 automatique sur self-add (cf. config).
        if (owners_1.AWARD_SCORE_ON_SELF_ADD) {
            await owner_service_1.OwnerService.addScore(owner.id, "RECRUIT_ACTIVE", owners_1.OWNER_SCORE.RECRUIT_ACTIVE, memberId);
        }
        // Recalcul du tier en arrière-plan — ne bloque pas la réponse à l'Owner.
        void owner_service_1.OwnerService.checkTierUpgrade(owner.id).catch(() => { });
        return member;
    }
    /**
     * Retire un membre de l'équipe d'un Owner : statut `LEFT`, historique conservé.
     * Vérifie que le membre appartient bien à CET owner (anti-retrait d'une autre équipe).
     */
    static async removeMember(params) {
        const { ownerId, memberId } = params;
        const existing = await database_1.prisma.ownerTeamMember.findUnique({
            where: { ownerId_discordId: { ownerId, discordId: memberId } },
        });
        if (!existing || existing.status === "LEFT") {
            throw new TeamError("NOT_IN_TEAM", "Ce membre ne fait pas partie de votre équipe.");
        }
        const member = await database_1.prisma.ownerTeamMember.update({
            where: { id: existing.id },
            data: { status: "LEFT", leftAt: new Date() },
        });
        if (owners_1.PENALIZE_ON_SELF_REMOVE) {
            await owner_service_1.OwnerService.addScore(ownerId, "MEMBER_LEFT", owners_1.OWNER_SCORE.MEMBER_LEFT, memberId);
        }
        // Recalcul du tier en arrière-plan — ne bloque pas la réponse à l'Owner.
        void owner_service_1.OwnerService.checkTierUpgrade(ownerId).catch(() => { });
        return member;
    }
}
exports.OwnerTeamService = OwnerTeamService;
//# sourceMappingURL=owner-team.service.js.map