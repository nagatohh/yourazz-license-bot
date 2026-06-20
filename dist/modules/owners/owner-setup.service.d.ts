import { Client, Guild } from "discord.js";
interface OwnerChannelConfig {
    categoryId: string;
    guideChannelId: string;
    dashboardChannelId: string;
    leaderboardChannelId: string;
    objectivesChannelId: string;
    teamsChannelId: string;
    supportChannelId: string;
    guidePanelMsgId: string | null;
    dashboardPanelMsgId: string | null;
    objectivesPanelMsgId: string | null;
    teamsPanelMsgId: string | null;
    supportPanelMsgId: string | null;
}
export declare class OwnerSetupService {
    static getConfig(): Promise<OwnerChannelConfig | null>;
    static saveConfig(config: OwnerChannelConfig): Promise<void>;
    static setup(guild: Guild, ownerRoleId?: string, adminRoleId?: string): Promise<OwnerChannelConfig>;
    static refreshAllPanels(client: Client, guild: Guild): Promise<void>;
    static destroy(guild: Guild): Promise<void>;
}
export {};
//# sourceMappingURL=owner-setup.service.d.ts.map