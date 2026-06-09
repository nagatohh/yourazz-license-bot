"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const database_1 = require("../../services/database");
class UserService {
    static async getOrCreate(user) {
        return database_1.prisma.discordUser.upsert({
            where: { discordId: user.id },
            update: {
                username: user.username,
                globalName: user.globalName,
                avatarUrl: user.displayAvatarURL(),
            },
            create: {
                discordId: user.id,
                username: user.username,
                globalName: user.globalName,
                avatarUrl: user.displayAvatarURL(),
            },
        });
    }
    static async getByDiscordId(discordId) {
        return database_1.prisma.discordUser.findUnique({ where: { discordId } });
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map