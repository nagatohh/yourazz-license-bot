import { TextChannel } from "discord.js";
export declare class OwnerPanelService {
    static buildGuidePanel(): {
        components: any[];
        flags: number;
    };
    static buildDashboardPanel(): {
        components: any[];
        flags: number;
    };
    static buildObjectivesPanel(): {
        components: any[];
        flags: number;
    };
    static buildTeamsPanel(): {
        components: any[];
        flags: number;
    };
    static buildSupportPanel(): {
        components: any[];
        flags: number;
    };
    static sendPanel(channel: TextChannel, panel: {
        components: any[];
        flags: number;
    }): Promise<string | null>;
    static refreshPanel(channel: TextChannel, messageId: string, panel: {
        components: any[];
        flags: number;
    }): Promise<boolean>;
}
//# sourceMappingURL=owner-panel.service.d.ts.map