"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const bot_1 = require("./config/bot");
const branding_1 = require("./config/branding");
const CV2_FLAG = 32768;
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
client.once("ready", async () => {
    console.log(`✅ Connecté: ${client.user?.tag}`);
    const guild = client.guilds.cache.get(bot_1.env.DISCORD_GUILD_ID);
    if (!guild) {
        console.error(`❌ Serveur ${bot_1.env.DISCORD_GUILD_ID} introuvable`);
        process.exit(1);
    }
    console.log(`📌 Serveur: ${guild.name} (${guild.id})`);
    console.log("🔧 Création de la catégorie Owner Management...");
    try {
        const category = await guild.channels.create({
            name: "👑 OWNER MANAGEMENT",
            type: discord_js_1.ChannelType.GuildCategory,
        });
        console.log(`   ✅ Catégorie créée: ${category.id}`);
        const guideChannel = await guild.channels.create({
            name: "📖・owner-guide",
            type: discord_js_1.ChannelType.GuildText,
            parent: category.id,
        });
        const dashboardChannel = await guild.channels.create({
            name: "📊・owner-dashboard",
            type: discord_js_1.ChannelType.GuildText,
            parent: category.id,
        });
        const leaderboardChannel = await guild.channels.create({
            name: "🏆・owner-leaderboard",
            type: discord_js_1.ChannelType.GuildText,
            parent: category.id,
        });
        const objectivesChannel = await guild.channels.create({
            name: "🎯・owner-objectives",
            type: discord_js_1.ChannelType.GuildText,
            parent: category.id,
        });
        const teamsChannel = await guild.channels.create({
            name: "👥・owner-teams",
            type: discord_js_1.ChannelType.GuildText,
            parent: category.id,
        });
        const supportChannel = await guild.channels.create({
            name: "💬・owner-support",
            type: discord_js_1.ChannelType.GuildText,
            parent: category.id,
        });
        console.log("   ✅ Channels créés");
        // Guide panel
        const guidePanel = new discord_js_1.ContainerBuilder()
            .setAccentColor(branding_1.THEME.primary)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("## 👑 Yourazz Owner Manager — Guide"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("### 🚀 Qu'est-ce qu'un Owner ?\n" +
            "Les Owners sont des **Managers / Recruteurs** responsables de développer Yourazz.\n\n" +
            "Leur mission :\n" +
            "▸ Recruter des profils **sérieux et actifs**\n" +
            "▸ Accompagner et suivre leur équipe\n" +
            "▸ Contribuer à la croissance de la plateforme"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("### 📊 Système de points\n" +
            "▸ Nouvelle recrue active → **+100**\n" +
            "▸ Activité régulière équipe → **+50**\n" +
            "▸ Rétention 30 jours → **+100**\n" +
            "▸ Vente d'un membre → **+75**\n" +
            "▸ Sanction d'un membre → **-100**\n" +
            "▸ Membre parti → **-150**"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("### 🏅 Tiers\n" +
            "🥉 **Bronze** — 5 recrues actives\n" +
            "🥈 **Silver** — 15 recrues actives\n" +
            "🥇 **Gold** — 30 recrues actives\n" +
            "💎 **Diamond** — 50 recrues actives\n" +
            "🏆 **Legend** — 100 recrues actives"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("### ⚠️ Règles importantes\n" +
            "▸ La **qualité** des recrues prime sur la quantité\n" +
            "▸ Les recrues inactives ne rapportent **aucun point**\n" +
            "▸ Une sanction impacte **votre** score\n" +
            "▸ Un membre parti coûte **-150 pts**"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("-# 👑 Yourazz Owner Manager System"));
        await guideChannel.send({ components: [guidePanel], flags: CV2_FLAG });
        console.log("   ✅ Panel guide envoyé");
        // Dashboard panel
        const dashPanel = new discord_js_1.ContainerBuilder()
            .setAccentColor(branding_1.THEME.primary)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("## 👑 Yourazz Owner Manager"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("Gérez votre équipe, suivez vos objectifs et développez Yourazz.\n\n" +
            "Les Owners sont des **Managers / Recruteurs**. Votre mission est de recruter des profils sérieux, accompagner votre équipe et contribuer à la croissance de Yourazz."))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("### ⚡ Actions rapides\nCliquez un bouton ci-dessous pour accéder à vos données."));
        const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("yrz_owner_dashboard").setLabel("📊 Mon Dashboard").setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId("yrz_owner_team").setLabel("👥 Mon Équipe").setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("yrz_owner_leaderboard").setLabel("🏆 Classement").setStyle(discord_js_1.ButtonStyle.Secondary));
        const row2 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("yrz_owner_objectives").setLabel("🎯 Objectifs").setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("yrz_owner_rewards").setLabel("🎁 Récompenses").setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("yrz_owner_help").setLabel("❓ Aide").setStyle(discord_js_1.ButtonStyle.Secondary));
        const footer = new discord_js_1.ContainerBuilder()
            .setAccentColor(branding_1.THEME.dark)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("⚡ La qualité des recrues compte plus que la quantité."))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("-# 👑 Yourazz Owner Manager System • Réponses privées"));
        await dashboardChannel.send({ components: [dashPanel, row1, row2, footer], flags: CV2_FLAG });
        console.log("   ✅ Panel dashboard envoyé");
        // Objectives panel
        const objPanel = new discord_js_1.ContainerBuilder()
            .setAccentColor(branding_1.THEME.primary)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("## 🎯 Objectifs Owners"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("### 📅 Objectifs mensuels\n" +
            "▸ Recruter **3 profils actifs**\n" +
            "▸ Maintenir **90% d'activité** dans l'équipe\n" +
            "▸ Aucune **sanction grave** dans l'équipe\n\n" +
            "### 📆 Objectifs hebdomadaires\n" +
            "▸ Suivre son équipe\n" +
            "▸ Accompagner les nouveaux membres"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("### 🎁 Récompenses par tier\n" +
            "🥉 **Bronze** (5) → Rôle Bronze Owner\n" +
            "🥈 **Silver** (15) → Salon privé + Badge\n" +
            "🥇 **Gold** (30) → Accès anticipé + Visibilité\n" +
            "💎 **Diamond** (50) → Avantages exclusifs\n" +
            "🏆 **Legend** (100) → Statut permanent + Toutes récompenses"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("-# 👑 Yourazz Owner Manager System • Mise à jour automatique"));
        await objectivesChannel.send({ components: [objPanel], flags: CV2_FLAG });
        console.log("   ✅ Panel objectifs envoyé");
        // Teams panel
        const teamsPanel = new discord_js_1.ContainerBuilder()
            .setAccentColor(branding_1.THEME.primary)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("## 👥 Équipes Owner"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("Chaque Owner gère sa propre équipe de recrues.\n\n" +
            "**Comment consulter votre équipe :**\n" +
            "▸ Cliquez **👥 Mon Équipe** dans le dashboard\n" +
            "▸ Ou utilisez `/owner team`\n\n" +
            "**Informations disponibles :**\n" +
            "▸ Liste des membres\n" +
            "▸ Statut (actif / inactif)\n" +
            "▸ Date de recrutement\n" +
            "▸ Ventes réalisées\n" +
            "▸ Score généré"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("### ⚡ Conseils\n" +
            "▸ Accompagnez vos recrues les premières semaines\n" +
            "▸ Identifiez les inactifs et motivez-les\n" +
            "▸ Un membre retenu 30 jours = **+100 pts**"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("-# 👑 Yourazz Owner Manager System"));
        const teamsRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("yrz_owner_team").setLabel("👥 Voir mon équipe").setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId("yrz_owner_dashboard").setLabel("📊 Dashboard").setStyle(discord_js_1.ButtonStyle.Secondary));
        await teamsChannel.send({ components: [teamsPanel, teamsRow], flags: CV2_FLAG });
        console.log("   ✅ Panel teams envoyé");
        // Support panel
        const supportPanel = new discord_js_1.ContainerBuilder()
            .setAccentColor(branding_1.THEME.dark)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("## 💬 Support Owners"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("Ce salon est réservé aux questions des Owners.\n\n" +
            "**Avant de poser une question :**\n" +
            "▸ Consultez le guide dans 📖・owner-guide\n" +
            "▸ Vérifiez votre dashboard avec `/owner dashboard`\n\n" +
            "**Commandes utiles :**\n" +
            "▸ `/owner dashboard` — Votre tableau de bord\n" +
            "▸ `/owner team` — Votre équipe\n" +
            "▸ `/owner stats` — Statistiques détaillées\n" +
            "▸ `/owner help` — Aide complète"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("-# 👑 Yourazz Owner Manager System"));
        await supportChannel.send({ components: [supportPanel], flags: CV2_FLAG });
        console.log("   ✅ Panel support envoyé");
        // Leaderboard placeholder
        const lbPanel = new discord_js_1.ContainerBuilder()
            .setAccentColor(branding_1.THEME.primary)
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("## 🏆 Classement Owners"))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("*Aucun Owner enregistré pour le moment.*\n\nLe classement se met à jour automatiquement."))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setSpacing(discord_js_1.SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent("-# 👑 Mis à jour automatiquement • Yourazz Owner System"));
        await leaderboardChannel.send({ components: [lbPanel], flags: CV2_FLAG });
        console.log("   ✅ Panel leaderboard envoyé");
        console.log("\n🎉 SETUP COMPLET ! La catégorie Owner Management est en place.");
    }
    catch (err) {
        console.error(`❌ Erreur: ${err.message}`);
        console.error(err.stack);
    }
    client.destroy();
    process.exit(0);
});
client.login(bot_1.env.DISCORD_TOKEN);
//# sourceMappingURL=run-owner-setup.js.map