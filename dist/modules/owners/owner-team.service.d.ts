export type TeamErrorCode = "ALREADY_IN_TEAM" | "IN_OTHER_TEAM" | "TEAM_FULL" | "NOT_IN_TEAM";
/** Erreur métier sûre : `message` est destiné à l'utilisateur, `code` aux logs. */
export declare class TeamError extends Error {
    code: TeamErrorCode;
    constructor(code: TeamErrorCode, message: string);
}
export declare class OwnerTeamService {
    /** Limite de membres autorisée pour un tier donné. */
    static getTeamLimit(tier: string): number;
    /** Membre déjà actif dans l'équipe d'un AUTRE owner (anti-vol / double équipe). */
    static getActiveMembershipElsewhere(discordId: string, exceptOwnerId: string): Promise<({
        owner: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            discordId: string;
            username: string;
            teamName: string | null;
            tier: import(".prisma/client").$Enums.OwnerTier;
            totalScore: number;
            isActive: boolean;
        };
    } & {
        status: import(".prisma/client").$Enums.TeamMemberStatus;
        id: string;
        discordId: string;
        username: string;
        ownerId: string;
        note: string | null;
        addedById: string | null;
        joinedAt: Date;
        leftAt: Date | null;
        lastActive: Date | null;
        totalSales: number;
        sanctions: number;
    }) | null>;
    /**
     * Ajoute (ou réactive) un membre dans l'équipe d'un Owner.
     * Toutes les vérifications "base de données" sont faites ici ;
     * les vérifications Discord (bot, staff, présence serveur) sont faites en amont.
     */
    static addMember(params: {
        owner: {
            id: string;
            tier: string;
        };
        memberId: string;
        memberUsername: string;
        addedById: string;
        note?: string | null;
    }): Promise<{
        status: import(".prisma/client").$Enums.TeamMemberStatus;
        id: string;
        discordId: string;
        username: string;
        ownerId: string;
        note: string | null;
        addedById: string | null;
        joinedAt: Date;
        leftAt: Date | null;
        lastActive: Date | null;
        totalSales: number;
        sanctions: number;
    }>;
    /**
     * Retire un membre de l'équipe d'un Owner : statut `LEFT`, historique conservé.
     * Vérifie que le membre appartient bien à CET owner (anti-retrait d'une autre équipe).
     */
    static removeMember(params: {
        ownerId: string;
        memberId: string;
    }): Promise<{
        status: import(".prisma/client").$Enums.TeamMemberStatus;
        id: string;
        discordId: string;
        username: string;
        ownerId: string;
        note: string | null;
        addedById: string | null;
        joinedAt: Date;
        leftAt: Date | null;
        lastActive: Date | null;
        totalSales: number;
        sanctions: number;
    }>;
}
//# sourceMappingURL=owner-team.service.d.ts.map