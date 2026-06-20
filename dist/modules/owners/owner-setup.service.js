"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnerSetupService = void 0;
const discord_js_1 = require("discord.js");
const database_1 = require("../../services/database");
const owner_panel_service_1 = require("./owner-panel.service");
const owner_leaderboard_service_1 = require("./owner-leaderboard.service");
const logger_1 = require("../../utils/logger");
const CONFIG_KEY = "owner_category_config";
class OwnerSetupService {
    static async getConfig() {
        const log = await database_1.prisma.botLog.findFirst({
            where: { source: CONFIG_KEY },
            orderBy: { createdAt: "desc" },
        });
        if (!log?.metadata)
            return null;
        return log.metadata;
    }
    static async saveConfig(config) {
        await database_1.prisma.botLog.deleteMany({ where: { source: CONFIG_KEY } });
        await database_1.prisma.botLog.create({
            data: {
                level: "INFO",
                source: CONFIG_KEY,
                message: "Owner category config",
                metadata: config,
            },
        });
    }
    static async setup(guild, ownerRoleId, adminRoleId) {
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
        const permissions = [
            { id: guild.id, deny: ["ViewChannel"] },
        ];
        if (adminRoleExists) {
            permissions.push({ id: adminRoleId, allow: ["ViewChannel", "SendMessages", "ManageMessages"] });
        }
        if (ownerRoleExists) {
            permissions.push({ id: ownerRoleId, allow: ["ViewChannel"], deny: ["SendMessages"] });
        }
        const supportPerms = [
            { id: guild.id, deny: ["ViewChannel"] },
        ];
        if (adminRoleExists) {
            supportPerms.push({ id: adminRoleId, allow: ["ViewChannel", "SendMessages", "ManageMessages"] });
        }
        if (ownerRoleExists) {
            supportPerms.push({ id: ownerRoleId, allow: ["ViewChannel", "SendMessages"] });
        }
        const category = await guild.channels.create({
            name: "👑 OWNER MANAGEMENT",
            type: discord_js_1.ChannelType.GuildCategory,
            permissionOverwrites: permissions,
        });
        const guideChannel = await guild.channels.create({
            name: "📖・owner-guide",
            type: discord_js_1.ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: permissions,
        });
        const dashboardChannel = await guild.channels.create({
            name: "📊・owner-dashboard",
            type: discord_js_1.ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: permissions,
        });
        const leaderboardChannel = await guild.channels.create({
            name: "🏆・owner-leaderboard",
            type: discord_js_1.ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: permissions,
        });
        const objectivesChannel = await guild.channels.create({
            name: "🎯・owner-objectives",
            type: discord_js_1.ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: permissions,
        });
        const teamsChannel = await guild.channels.create({
            name: "👥・owner-teams",
            type: discord_js_1.ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: permissions,
        });
        const supportChannel = await guild.channels.create({
            name: "💬・owner-support",
            type: discord_js_1.ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: supportPerms,
        });
        const guideMsgId = await owner_panel_service_1.OwnerPanelService.sendPanel(guideChannel, owner_panel_service_1.OwnerPanelService.buildGuidePanel());
        const dashboardMsgId = await owner_panel_service_1.OwnerPanelService.sendPanel(dashboardChannel, owner_panel_service_1.OwnerPanelService.buildDashboardPanel());
        const objectivesMsgId = await owner_panel_service_1.OwnerPanelService.sendPanel(objectivesChannel, owner_panel_service_1.OwnerPanelService.buildObjectivesPanel());
        const teamsMsgId = await owner_panel_service_1.OwnerPanelService.sendPanel(teamsChannel, owner_panel_service_1.OwnerPanelService.buildTeamsPanel());
        const supportMsgId = await owner_panel_service_1.OwnerPanelService.sendPanel(supportChannel, owner_panel_service_1.OwnerPanelService.buildSupportPanel());
        owner_leaderboard_service_1.OwnerLeaderboardService.setChannel(leaderboardChannel.id);
        await owner_leaderboard_service_1.OwnerLeaderboardService.update(guild.client);
        const config = {
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
        logger_1.logger.info("OwnerSetup", "Catégorie Owner Management créée avec succès");
        return config;
    }
    static async refreshAllPanels(client, guild) {
        const config = await this.getConfig();
        if (!config)
            return;
        const channels = {
            guide: guild.channels.cache.get(config.guideChannelId),
            dashboard: guild.channels.cache.get(config.dashboardChannelId),
            objectives: guild.channels.cache.get(config.objectivesChannelId),
            teams: guild.channels.cache.get(config.teamsChannelId),
            support: guild.channels.cache.get(config.supportChannelId),
        };
        if (channels.guide && config.guidePanelMsgId) {
            const ok = await owner_panel_service_1.OwnerPanelService.refreshPanel(channels.guide, config.guidePanelMsgId, owner_panel_service_1.OwnerPanelService.buildGuidePanel());
            if (!ok) {
                const newId = await owner_panel_service_1.OwnerPanelService.sendPanel(channels.guide, owner_panel_service_1.OwnerPanelService.buildGuidePanel());
                config.guidePanelMsgId = newId;
            }
        }
        if (channels.dashboard && config.dashboardPanelMsgId) {
            const ok = await owner_panel_service_1.OwnerPanelService.refreshPanel(channels.dashboard, config.dashboardPanelMsgId, owner_panel_service_1.OwnerPanelService.buildDashboardPanel());
            if (!ok) {
                const newId = await owner_panel_service_1.OwnerPanelService.sendPanel(channels.dashboard, owner_panel_service_1.OwnerPanelService.buildDashboardPanel());
                config.dashboardPanelMsgId = newId;
            }
        }
        if (channels.objectives && config.objectivesPanelMsgId) {
            const ok = await owner_panel_service_1.OwnerPanelService.refreshPanel(channels.objectives, config.objectivesPanelMsgId, owner_panel_service_1.OwnerPanelService.buildObjectivesPanel());
            if (!ok) {
                const newId = await owner_panel_service_1.OwnerPanelService.sendPanel(channels.objectives, owner_panel_service_1.OwnerPanelService.buildObjectivesPanel());
                config.objectivesPanelMsgId = newId;
            }
        }
        if (channels.teams && config.teamsPanelMsgId) {
            const ok = await owner_panel_service_1.OwnerPanelService.refreshPanel(channels.teams, config.teamsPanelMsgId, owner_panel_service_1.OwnerPanelService.buildTeamsPanel());
            if (!ok) {
                const newId = await owner_panel_service_1.OwnerPanelService.sendPanel(channels.teams, owner_panel_service_1.OwnerPanelService.buildTeamsPanel());
                config.teamsPanelMsgId = newId;
            }
        }
        if (channels.support && config.supportPanelMsgId) {
            const ok = await owner_panel_service_1.OwnerPanelService.refreshPanel(channels.support, config.supportPanelMsgId, owner_panel_service_1.OwnerPanelService.buildSupportPanel());
            if (!ok) {
                const newId = await owner_panel_service_1.OwnerPanelService.sendPanel(channels.support, owner_panel_service_1.OwnerPanelService.buildSupportPanel());
                config.supportPanelMsgId = newId;
            }
        }
        owner_leaderboard_service_1.OwnerLeaderboardService.setChannel(config.leaderboardChannelId);
        await owner_leaderboard_service_1.OwnerLeaderboardService.update(client);
        await this.saveConfig(config);
        logger_1.logger.info("OwnerSetup", "Panels Owner rafraîchis");
    }
    static async destroy(guild) {
        const config = await this.getConfig();
        if (!config)
            return;
        const category = guild.channels.cache.get(config.categoryId);
        if (category) {
            const children = guild.channels.cache.filter((ch) => ch.parentId === config.categoryId);
            for (const [, ch] of children) {
                await ch.delete().catch(() => { });
            }
            await category.delete().catch(() => { });
        }
        await database_1.prisma.botLog.deleteMany({ where: { source: CONFIG_KEY } });
        logger_1.logger.info("OwnerSetup", "Catégorie Owner Management supprimée");
    }
}
exports.OwnerSetupService = OwnerSetupService;
//# sourceMappingURL=owner-setup.service.js.map