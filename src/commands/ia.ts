import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from "discord.js";
import { LicenseService } from "../modules/licenses/license.service";
import { formatPrice } from "../utils/format";
import { isAdmin } from "../utils/permissions";
import { buildReply, ACCENT } from "../utils/cv2";

export const data = new SlashCommandBuilder()
  .setName("ia")
  .setDescription("Rapport IA — analyse et recommandations")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sub) => sub.setName("rapport").setDescription("Générer un rapport IA"));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!isAdmin(interaction.member as any)) {
    return interaction.reply({ content: "❌ Accès refusé.", ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const stats = await LicenseService.getStats(interaction.guildId!);
  const expiringWeek = await LicenseService.getExpiringIn(7);
  const expiring3Days = await LicenseService.getExpiringIn(3);

  const alerts: string[] = [];
  if (expiring3Days.length > 0) {
    alerts.push(`🚨 **${expiring3Days.length}** licence(s) expirent dans 3 jours`);
  }
  if (expiringWeek.length > 0) {
    alerts.push(`⚠️ **${expiringWeek.length}** licence(s) expirent cette semaine`);
  }
  if (stats.active === 0) {
    alerts.push(`📢 Aucune licence active — pensez à relancer les vendeurs`);
  }

  const recommendations: string[] = [];
  if (expiring3Days.length > 0) {
    recommendations.push("→ Envoyer un rappel personnalisé aux vendeurs qui expirent bientôt");
  }
  if (stats.suspended > 2) {
    recommendations.push("→ Revoir les licences suspendues — réactivation possible ?");
  }
  if (stats.monthRevenue === 0) {
    recommendations.push("→ Aucun revenu ce mois — envisager une promotion");
  } else {
    recommendations.push(`→ Revenu du mois : ${formatPrice(stats.monthRevenue)} — bonne dynamique`);
  }

  const expiringList = expiringWeek.length > 0
    ? expiringWeek.slice(0, 5).map((l) => `• <@${l.user.discordId}> — ${l.plan.displayName}`).join("\n")
    : "Aucune";

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.primary)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🤖 Rapport Yourazz AI`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**📊 Vue d'ensemble**\n` +
        `Actives : **${stats.active}** | Expirées : **${stats.expired}** | Suspendues : **${stats.suspended}**\n` +
        `Revenu total : **${formatPrice(stats.totalRevenue)}** | Ce mois : **${formatPrice(stats.monthRevenue)}**`,
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**🚨 Alertes**\n${alerts.length > 0 ? alerts.join("\n") : "✅ Aucune alerte"}`,
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**💡 Recommandations**\n${recommendations.join("\n")}`,
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**📅 Expirations cette semaine**\n${expiringList}`,
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Yourazz AI — Analyse automatique`));

  await interaction.editReply(buildReply([container]));
}
