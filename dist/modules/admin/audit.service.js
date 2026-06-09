"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const database_1 = require("../../services/database");
class AuditService {
    static async log(actorId, action, targetId, metadata) {
        return database_1.prisma.auditLog.create({
            data: {
                actorId,
                action,
                targetId: targetId ?? null,
                metadata: metadata ?? undefined,
            },
        });
    }
    static async getRecent(limit = 20) {
        return database_1.prisma.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: limit,
            include: { actor: true, target: true },
        });
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=audit.service.js.map