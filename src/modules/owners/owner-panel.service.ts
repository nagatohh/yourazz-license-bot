import {
  Client,
  TextChannel,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { ACCENT, CV2_FLAG } from "../../utils/cv2";
import { THEME } from "../../config/branding";
import { logger } from "../../utils/logger";

export class OwnerPanelService {
  static buildGuidePanel(): { components: any[]; flags: number } {
    const header = new ContainerBuilder()
      .setAccentColor(THEME.primary)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "## 👑 Yourazz Owner Manager — Guide",
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "### 🚀 Qu'est-ce qu'un Owner ?\n" +
          "Les Owners sont des **Managers / Recruteurs** responsables de développer Yourazz.\n\n" +
          "Leur mission :\n" +
          "▸ Recruter des profils **sérieux et actifs**\n" +
          "▸ Accompagner et suivre leur équipe\n" +
          "▸ Contribuer à la croissance de la plateforme",
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "### 📊 Système de points\n" +
          "| Action | Points |\n" +
          "|--------|--------|\n" +
          "| Nouvelle recrue active | **+100** |\n" +
          "| Activité régulière équipe | **+50** |\n" +
          "| Rétention 30 jours | **+100** |\n" +
          "| Vente d'un membre | **+75** |\n" +
          "| Sanction d'un membre | **-100** |\n" +
          "| Membre parti | **-150** |",
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "### 🏅 Tiers\n" +
          "🥉 **Bronze** — 5 recrues actives\n" +
          "🥈 **Silver** — 15 recrues actives\n" +
          "🥇 **Gold** — 30 recrues actives\n" +
          "💎 **Diamond** — 50 recrues actives\n" +
          "🏆 **Legend** — 100 recrues actives",
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "### ⚠️ Règles importantes\n" +
          "▸ La **qualité** des recrues prime sur la quantité\n" +
          "▸ Les recrues inactives ne rapportent **aucun point**\n" +
          "▸ Une sanction impacte **votre** score\n" +
          "▸ Un membre parti coûte **-150 pts**",
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("-# 👑 Yourazz Owner Manager System"),
      );

    return { components: [header], flags: CV2_FLAG };
  }

  static buildDashboardPanel(): { components: any[]; flags: number } {
    const panel = new ContainerBuilder()
      .setAccentColor(THEME.primary)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "## 👑 Yourazz Owner Manager",
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "Gérez votre équipe, suivez vos objectifs et développez Yourazz.\n\n" +
          "Les Owners sont des **Managers / Recruteurs**. Votre mission est de recruter des profils sérieux, accompagner votre équipe et contribuer à la croissance de Yourazz.",
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "### ⚡ Actions rapides\nCliquez un bouton ci-dessous pour accéder à vos données.",
        ),
      );

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("yrz_owner_dashboard")
        .setLabel("📊 Mon Dashboard")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("yrz_owner_team")
        .setLabel("👥 Mon Équipe")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("yrz_owner_addmember")
        .setLabel("➕ Ajouter un membre")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("yrz_owner_removemember")
        .setLabel("➖ Retirer un membre")
        .setStyle(ButtonStyle.Secondary),
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("yrz_owner_leaderboard")
        .setLabel("🏆 Classement")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("yrz_owner_objectives")
        .setLabel("🎯 Objectifs")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("yrz_owner_rewards")
        .setLabel("🎁 Récompenses")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("yrz_owner_help")
        .setLabel("❓ Aide")
        .setStyle(ButtonStyle.Secondary),
    );

    const footer = new ContainerBuilder()
      .setAccentColor(THEME.dark)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "⚡ La qualité des recrues compte plus que la quantité.",
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("-# 👑 Yourazz Owner Manager System • Réponses privées"),
      );

    return { components: [panel, row1, row2, footer], flags: CV2_FLAG };
  }

  static buildObjectivesPanel(): { components: any[]; flags: number } {
    const panel = new ContainerBuilder()
      .setAccentColor(THEME.primary)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("## 🎯 Objectifs Owners"),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "### 📅 Objectifs mensuels\n" +
          "▸ Recruter **3 profils actifs**\n" +
          "▸ Maintenir **90% d'activité** dans l'équipe\n" +
          "▸ Aucune **sanction grave** dans l'équipe\n\n" +
          "### 📆 Objectifs hebdomadaires\n" +
          "▸ Suivre son équipe\n" +
          "▸ Accompagner les nouveaux membres",
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "### 🎁 Récompenses par tier\n" +
          "🥉 **Bronze** (5) → Rôle Bronze Owner\n" +
          "🥈 **Silver** (15) → Salon privé + Badge\n" +
          "🥇 **Gold** (30) → Accès anticipé + Visibilité\n" +
          "💎 **Diamond** (50) → Avantages exclusifs\n" +
          "🏆 **Legend** (100) → Statut permanent + Toutes récompenses",
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("-# 👑 Yourazz Owner Manager System • Mise à jour automatique"),
      );

    return { components: [panel], flags: CV2_FLAG };
  }

  static buildTeamsPanel(): { components: any[]; flags: number } {
    const panel = new ContainerBuilder()
      .setAccentColor(THEME.primary)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("## 👥 Équipes Owner"),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "Chaque Owner gère sa propre équipe de recrues.\n\n" +
          "**Comment consulter votre équipe :**\n" +
          "▸ Cliquez **👥 Mon Équipe** dans le dashboard\n" +
          "▸ Ou utilisez `/owner team`\n\n" +
          "**Informations disponibles :**\n" +
          "▸ Liste des membres\n" +
          "▸ Statut (actif / inactif)\n" +
          "▸ Date de recrutement\n" +
          "▸ Ventes réalisées\n" +
          "▸ Score généré",
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "### ⚡ Conseils\n" +
          "▸ Accompagnez vos recrues les premières semaines\n" +
          "▸ Identifiez les inactifs et motivez-les\n" +
          "▸ Un membre retenu 30 jours = **+100 pts**",
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("-# 👑 Yourazz Owner Manager System"),
      );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("yrz_owner_team")
        .setLabel("👥 Voir mon équipe")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("yrz_owner_dashboard")
        .setLabel("📊 Dashboard")
        .setStyle(ButtonStyle.Secondary),
    );

    return { components: [panel, row], flags: CV2_FLAG };
  }

  static buildSupportPanel(): { components: any[]; flags: number } {
    const panel = new ContainerBuilder()
      .setAccentColor(THEME.dark)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("## 💬 Support Owners"),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "Ce salon est réservé aux questions des Owners.\n\n" +
          "**Avant de poser une question :**\n" +
          "▸ Consultez le guide dans 📖・owner-guide\n" +
          "▸ Vérifiez votre dashboard avec `/owner dashboard`\n\n" +
          "**Commandes utiles :**\n" +
          "▸ `/owner dashboard` — Votre tableau de bord\n" +
          "▸ `/owner team` — Votre équipe\n" +
          "▸ `/owner stats` — Statistiques détaillées\n" +
          "▸ `/owner help` — Aide complète",
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent("-# 👑 Yourazz Owner Manager System"),
      );

    return { components: [panel], flags: CV2_FLAG };
  }

  static async sendPanel(channel: TextChannel, panel: { components: any[]; flags: number }): Promise<string | null> {
    try {
      const msg = await channel.send(panel as any);
      return msg.id;
    } catch (err: any) {
      logger.error("OwnerPanel", `Erreur envoi panel: ${err.message}`);
      return null;
    }
  }

  static async refreshPanel(channel: TextChannel, messageId: string, panel: { components: any[]; flags: number }): Promise<boolean> {
    try {
      const msg = await channel.messages.fetch(messageId).catch(() => null);
      if (msg) {
        await msg.edit(panel as any);
        return true;
      }
      return false;
    } catch (err: any) {
      logger.error("OwnerPanel", `Erreur refresh panel: ${err.message}`);
      return false;
    }
  }
}
