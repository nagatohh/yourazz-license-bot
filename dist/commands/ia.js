"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const license_service_1 = require("../modules/licenses/license.service");
const format_1 = require("../utils/format");
const permissions_1 = require("../utils/permissions");
const cv2_1 = require("../utils/cv2");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("ia")
    .setDescription("Rapport IA — analyse et recommandations")
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
    .addSubcommand((sub) => sub.setName("rapport").setDescription("Générer un rapport IA"));
async function execute(interaction) {
    if (!(0, permissions_1.isAdmin)(interaction.member)) {
        return interaction.reply({ content: "❌ Accès refusé.", ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    const stats = await license_service_1.LicenseService.getStats(interaction.guildId);
    const expiringWeek = await license_service_1.LicenseService.getExpiringIn(7);
    const expiring3Days = await license_service_1.LicenseService.getExpiringIn(3);
    const alerts = [];
    if (expiring3Days.length > 0) {
        alerts.push(`🚨 **${expiring3Days.length}** licence(s) expirent dans 3 jours`);
    }
    if (expiringWeek.length > 0) {
        alerts.push(`⚠️ **${expiringWeek.length}** licence(s) expirent cette semaine`);
    }
    if (stats.active === 0) {
        alerts.push(`📢 Aucune licence active — pensez à relancer les vendeurs`);
    }
    const recommendations = [];
    if (expiring3Days.length > 0) {
        recommendations.push("→ Envoyer un rappel personnalisé aux vendeurs qui expirent bientôt");
    }
    if (stats.suspended > 2) {
        recommendations.push("→ Revoir les licences suspendues — réactivation possible ?");
    }
    if (stats.monthRevenue === 0) {
        recommendations.push("→ Aucun revenu ce mois — envisager une promotion");
    }
    else {
        recommendations.push(`→ Revenu du mois : ${(0, format_1.formatPrice)(stats.monthRevenue)} — bonne dynamique`);
    }
    const expiringList = expiringWeek.length > 0
        ? expiringWeek.slice(0, 5).map((l) => `• <@${l.user.discordId}> — ${l.plan.displayName}`).join("\n")
        : "Aucune";
    const container = new discord_js_1.ContainerBuilder()
        .setAccentColor(cv2_1.ACCENT.primary)
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## 🤖 Rapport Yourazz AI`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`**📊 Vue d'ensemble**\n` +
        `Actives : **${stats.active}** | Expirées : **${stats.expired}** | Suspendues : **${stats.suspended}**\n` +
        `Revenu total : **${(0, format_1.formatPrice)(stats.totalRevenue)}** | Ce mois : **${(0, format_1.formatPrice)(stats.monthRevenue)}**`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`**🚨 Alertes**\n${alerts.length > 0 ? alerts.join("\n") : "✅ Aucune alerte"}`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`**💡 Recommandations**\n${recommendations.join("\n")}`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`**📅 Expirations cette semaine**\n${expiringList}`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# Yourazz AI — Analyse automatique`));
    await interaction.editReply((0, cv2_1.buildReply)([container]));
}
//# sourceMappingURL=ia.js.map