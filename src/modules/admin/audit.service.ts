import { prisma } from "../../services/database";

export class AuditService {
  static async log(actorId: string | null, action: string, targetId?: string | null, metadata?: object) {
    return prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetId: targetId ?? null,
        metadata: metadata ?? undefined,
      },
    });
  }

  static async getRecent(limit = 20) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { actor: true, target: true },
    });
  }
}
