import {
  Client,
  Guild,
  ChannelType,
  OverwriteResolvable,
  TextChannel,
  CategoryChannel,
} from "discord.js";
import { prisma } from "../../services/database";
import { OwnerPanelService } from "./owner-panel.service";
import { OwnerLeaderboardService } from "./owner-leaderboard.service";
import { logger } from "../../utils/logger";

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

const CONFIG_KEY = "owner_category_config";

export class OwnerSetupService {
  static async getConfig(): Promise<OwnerChannelConfig | null> {
    const log = await prisma.botLog.findFirst({
      where: { source: CONFIG_KEY },
      orderBy: { createdAt: "desc" },
    });
    if (!log?.metadata) return null;
    return log.metadata as unknown as OwnerChannelConfig;
  }

  static async saveConfig(config: OwnerChannelConfig) {
    await prisma.botLog.deleteMany({ where: { source: CONFIG_KEY } });
    await prisma.botLog.create({
      data: {
        level: "INFO",
        source: CONFIG_KEY,
        message: "Owner category config",
        metadata: config as any,
      },
    });
  }

  static async setup(guild: Guild, ownerRoleId?: string, adminRoleId?: string): Promise<OwnerChannelConfig> {
    const existing = await this.getConfig();
    if (existing) {
      const cat = guild.channels.cache.get(existing.categoryId);
      if (cat) {
        await this.refreshAllPanels(guild.client, guild);
        return existing;
      }
    }

    const adminRoleExists = adminRoleId ? guild.roles.cache.has(adminRoleId) : false;
    const ownerRoleExists = ownerRoleId ? guild.roles.cache.has(ownerRoleId) : false;

    const permissions: OverwriteResolvable[] = [
      { id: guild.id, deny: ["ViewChannel"] },
    ];
    if (adminRoleExists) {
      permissions.push({ id: adminRoleId!, allow: ["ViewChannel", "SendMessages", "ManageMessages"] });
    }
    if (ownerRoleExists) {
      permissions.push({ id: ownerRoleId!, allow: ["ViewChannel"], deny: ["SendMessages"] });
    }

    const supportPerms: OverwriteResolvable[] = [
      { id: guild.id, deny: ["ViewChannel"] },
    ];
    if (adminRoleExists) {
      supportPerms.push({ id: adminRoleId!, allow: ["ViewChannel", "SendMessages", "ManageMessages"] });
    }
    if (ownerRoleExists) {
      supportPerms.push({ id: ownerRoleId!, allow: ["ViewChannel", "SendMessages"] });
    }

    const category = await guild.channels.create({
      name: "👑 OWNER MANAGEMENT",
      type: ChannelType.GuildCategory,
      permissionOverwrites: permissions,
    });

    const guideChannel = await guild.channels.create({
      name: "📖・owner-guide",
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: permissions,
    });

    const dashboardChannel = await guild.channels.create({
      name: "📊・owner-dashboard",
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: permissions,
    });

    const leaderboardChannel = await guild.channels.create({
      name: "🏆・owner-leaderboard",
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: permissions,
    });

    const objectivesChannel = await guild.channels.create({
      name: "🎯・owner-objectives",
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: permissions,
    });

    const teamsChannel = await guild.channels.create({
      name: "👥・owner-teams",
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: permissions,
    });

    const supportChannel = await guild.channels.create({
      name: "💬・owner-support",
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: supportPerms,
    });

    const guideMsgId = await OwnerPanelService.sendPanel(
      guideChannel as TextChannel,
      OwnerPanelService.buildGuidePanel(),
    );
    const dashboardMsgId = await OwnerPanelService.sendPanel(
      dashboardChannel as TextChannel,
      OwnerPanelService.buildDashboardPanel(),
    );
    const objectivesMsgId = await OwnerPanelService.sendPanel(
      objectivesChannel as TextChannel,
      OwnerPanelService.buildObjectivesPanel(),
    );
    const teamsMsgId = await OwnerPanelService.sendPanel(
      teamsChannel as TextChannel,
      OwnerPanelService.buildTeamsPanel(),
    );
    const supportMsgId = await OwnerPanelService.sendPanel(
      supportChannel as TextChannel,
      OwnerPanelService.buildSupportPanel(),
    );

    OwnerLeaderboardService.setChannel(leaderboardChannel.id);
    await OwnerLeaderboardService.update(guild.client);

    const config: OwnerChannelConfig = {
      categoryId: category.id,
      guideChannelId: guideChannel.id,
      dashboardChannelId: dashboardChannel.id,
      leaderboardChannelId: leaderboardChannel.id,
      objectivesChannelId: objectivesChannel.id,
      teamsChannelId: teamsChannel.id,
      supportChannelId: supportChannel.id,
      guidePanelMsgId: guideMsgId,
      dashboardPanelMsgId: dashboardMsgId,
      objectivesPanelMsgId: objectivesMsgId,
      teamsPanelMsgId: teamsMsgId,
      supportPanelMsgId: supportMsgId,
    };

    await this.saveConfig(config);
    logger.info("OwnerSetup", "Catégorie Owner Management créée avec succès");
    return config;
  }

  static async refreshAllPanels(client: Client, guild: Guild) {
    const config = await this.getConfig();
    if (!config) return;

    const channels = {
      guide: guild.channels.cache.get(config.guideChannelId) as TextChannel | undefined,
      dashboard: guild.channels.cache.get(config.dashboardChannelId) as TextChannel | undefined,
      objectives: guild.channels.cache.get(config.objectivesChannelId) as TextChannel | undefined,
      teams: guild.channels.cache.get(config.teamsChannelId) as TextChannel | undefined,
      support: guild.channels.cache.get(config.supportChannelId) as TextChannel | undefined,
    };

    if (channels.guide && config.guidePanelMsgId) {
      const ok = await OwnerPanelService.refreshPanel(channels.guide, config.guidePanelMsgId, OwnerPanelService.buildGuidePanel());
      if (!ok) {
        const newId = await OwnerPanelService.sendPanel(channels.guide, OwnerPanelService.buildGuidePanel());
        config.guidePanelMsgId = newId;
      }
    }

    if (channels.dashboard && config.dashboardPanelMsgId) {
      const ok = await OwnerPanelService.refreshPanel(channels.dashboard, config.dashboardPanelMsgId, OwnerPanelService.buildDashboardPanel());
      if (!ok) {
        const newId = await OwnerPanelService.sendPanel(channels.dashboard, OwnerPanelService.buildDashboardPanel());
        config.dashboardPanelMsgId = newId;
      }
    }

    if (channels.objectives && config.objectivesPanelMsgId) {
      const ok = await OwnerPanelService.refreshPanel(channels.objectives, config.objectivesPanelMsgId, OwnerPanelService.buildObjectivesPanel());
      if (!ok) {
        const newId = await OwnerPanelService.sendPanel(channels.objectives, OwnerPanelService.buildObjectivesPanel());
        config.objectivesPanelMsgId = newId;
      }
    }

    if (channels.teams && config.teamsPanelMsgId) {
      const ok = await OwnerPanelService.refreshPanel(channels.teams, config.teamsPanelMsgId, OwnerPanelService.buildTeamsPanel());
      if (!ok) {
        const newId = await OwnerPanelService.sendPanel(channels.teams, OwnerPanelService.buildTeamsPanel());
        config.teamsPanelMsgId = newId;
      }
    }

    if (channels.support && config.supportPanelMsgId) {
      const ok = await OwnerPanelService.refreshPanel(channels.support, config.supportPanelMsgId, OwnerPanelService.buildSupportPanel());
      if (!ok) {
        const newId = await OwnerPanelService.sendPanel(channels.support, OwnerPanelService.buildSupportPanel());
        config.supportPanelMsgId = newId;
      }
    }

    OwnerLeaderboardService.setChannel(config.leaderboardChannelId);
    await OwnerLeaderboardService.update(client);

    await this.saveConfig(config);
    logger.info("OwnerSetup", "Panels Owner rafraîchis");
  }

  static async destroy(guild: Guild) {
    const config = await this.getConfig();
    if (!config) return;

    const category = guild.channels.cache.get(config.categoryId);
    if (category) {
      const children = guild.channels.cache.filter(
        (ch) => ch.parentId === config.categoryId,
      );
      for (const [, ch] of children) {
        await ch.delete().catch(() => {});
      }
      await category.delete().catch(() => {});
    }

    await prisma.botLog.deleteMany({ where: { source: CONFIG_KEY } });
    logger.info("OwnerSetup", "Catégorie Owner Management supprimée");
  }
}
