import { Client } from "discord.js";
export declare class RoleService {
    static assignSellerRole(client: Client, guildId: string, discordUserId: string, planName: string): Promise<void>;
    static removeSellerRoles(client: Client, guildId: string, discordUserId: string): Promise<void>;
}
//# sourceMappingURL=role.service.d.ts.map