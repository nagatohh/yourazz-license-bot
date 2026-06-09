export declare class AuditService {
    static log(actorId: string | null, action: string, targetId?: string | null, metadata?: object): Promise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        action: string;
        actorId: string | null;
        targetId: string | null;
    }>;
    static getRecent(limit?: number): Promise<({
        actor: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            discordId: string;
            username: string;
            globalName: string | null;
            avatarUrl: string | null;
            language: string;
        } | null;
        target: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            discordId: string;
            username: string;
            globalName: string | null;
            avatarUrl: string | null;
            language: string;
        } | null;
    } & {
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        action: string;
        actorId: string | null;
        targetId: string | null;
    })[]>;
}
//# sourceMappingURL=audit.service.d.ts.map