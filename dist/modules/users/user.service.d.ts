import { User } from "discord.js";
export declare class UserService {
    static getOrCreate(user: User): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        discordId: string;
        username: string;
        globalName: string | null;
        avatarUrl: string | null;
        language: string;
    }>;
    static getByDiscordId(discordId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        discordId: string;
        username: string;
        globalName: string | null;
        avatarUrl: string | null;
        language: string;
    } | null>;
}
//# sourceMappingURL=user.service.d.ts.map