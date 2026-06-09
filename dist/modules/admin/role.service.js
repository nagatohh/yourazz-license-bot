"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
const licenses_1 = require("../../config/licenses");
const roles_1 = require("../../config/roles");
const logger_1 = require("../../utils/logger");
class RoleService {
    static async assignSellerRole(client, guildId, discordUserId, planName) {
        const plan = licenses_1.PLANS[planName];
        if (!plan)
            return;
        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(discordUserId);
        for (const roleId of roles_1.ALL_SELLER_ROLES) {
            if (roleId !== plan.roleId && member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId);
            }
        }
        if (!member.roles.cache.has(plan.roleId)) {
            await member.roles.add(plan.roleId);
        }
        logger_1.logger.info("RoleService", `Rôle ${planName} attribué à ${discordUserId}`);
    }
    static async removeSellerRoles(client, guildId, discordUserId) {
        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(discordUserId);
        for (const roleId of roles_1.ALL_SELLER_ROLES) {
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId);
            }
        }
        logger_1.logger.info("RoleService", `Rôles vendeur retirés pour ${discordUserId}`);
    }
}
exports.RoleService = RoleService;
//# sourceMappingURL=role.service.js.map