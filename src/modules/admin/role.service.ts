import { Client } from "discord.js";
import { PLANS } from "../../config/licenses";
import { ALL_SELLER_ROLES } from "../../config/roles";
import { logger } from "../../utils/logger";

export class RoleService {
  static async assignSellerRole(client: Client, guildId: string, discordUserId: string, planName: string) {
    const plan = PLANS[planName];
    if (!plan) return;

    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(discordUserId);

    for (const roleId of ALL_SELLER_ROLES) {
      if (roleId !== plan.roleId && member.roles.cache.has(roleId)) {
        await member.roles.remove(roleId);
      }
    }

    if (!member.roles.cache.has(plan.roleId)) {
      await member.roles.add(plan.roleId);
    }

    logger.info("RoleService", `Rôle ${planName} attribué à ${discordUserId}`);
  }

  static async removeSellerRoles(client: Client, guildId: string, discordUserId: string) {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(discordUserId);

    for (const roleId of ALL_SELLER_ROLES) {
      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(roleId);
      }
    }

    logger.info("RoleService", `Rôles vendeur retirés pour ${discordUserId}`);
  }
}
