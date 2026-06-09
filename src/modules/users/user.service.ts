import { User } from "discord.js";
import { prisma } from "../../services/database";

export class UserService {
  static async getOrCreate(user: User) {
    return prisma.discordUser.upsert({
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

  static async getByDiscordId(discordId: string) {
    return prisma.discordUser.findUnique({ where: { discordId } });
  }
}
