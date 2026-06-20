export const fr: Record<string, string> = {
  // Panel
  "panel.title": "🚀 Yourazz License Manager",
  "panel.description": "Achetez, gérez et renouvelez votre licence vendeur automatiquement.",
  "panel.features": "• Paiement sécurisé via Stripe\n• Attribution automatique du rôle\n• Renouvellement simplifié\n• Support disponible",
  "panel.btnPayment": "💳 Paiement",
  "panel.btnLanguage": "🌍 Langue",
  "panel.btnHelp": "❓ Aide",

  // Payment
  "payment.title": "🏷️ Licence Vendeur — Yourazz",
  "payment.description": "Devenez vendeur certifié sur Yourazz.",
  "payment.price": "25,00 €/mois",
  "payment.features": "✓ Accès vendeur complet\n✓ Produits illimités\n✓ Licence 30 jours\n✓ Support prioritaire",
  "payment.btn": "💳 Payer 25€",
  "payment.footer": "🔒 Paiement sécurisé par Stripe",
  "payment.stripeNotConfigured": "⚠️ Le paiement n'est pas encore configuré. Contactez un administrateur.",

  // Help
  "help.title": "❓ Comment ça marche ?",
  "help.description": "**1.** Cliquez sur 💳 Paiement\n**2.** Payez via Stripe (CB sécurisé)\n**3.** Attendez la validation automatique\n**4.** Votre rôle vendeur est attribué !\n**5.** Renouvelez facilement avant expiration",
  "help.commands": "**Commandes utiles :**\n`/licence statut` — Voir votre licence\n`/licence renouveler` — Renouveler\n`/licence aide` — Aide complète",

  // Language
  "language.title": "🌍 Choisir la langue",
  "language.description": "Sélectionnez votre langue préférée.",
  "language.changed": "✅ Langue changée en **Français**",

  // Animation
  "animation.verifying": "Validation du paiement...",
  "animation.pleaseWait": "Veuillez patienter...",
  "animation.activating": "Activation de la licence...",
  "animation.almostDone": "Presque terminé...",
  "animation.assigningRole": "Attribution du rôle...",
  "animation.finalStep": "Dernière étape...",
  "animation.success": "Paiement validé !",
  "animation.welcome": "Bienvenue dans **Yourazz Seller** 🎉",
  "animation.licenseActive": "Licence activée",
  "animation.roleAssigned": "Rôle vendeur attribué",
  "animation.accessUnlocked": "Accès débloqués",
  "animation.expiration": "Expiration :",

  // Status
  "status.active": "✅ Active",
  "status.expired": "❌ Expirée",
  "status.suspended": "🔴 Suspendue",
  "status.noLicense": "Vous n'avez pas de licence active.\nCliquez sur 💳 Paiement pour en obtenir une.",

  // Errors
  "error.generic": "❌ Une erreur est survenue.",
  "error.noPermission": "❌ Vous n'avez pas la permission.",

  // Owner Manager
  "owner.accessDenied": "Accès refusé",
  "owner.accessDeniedDesc": "Tu n'as pas le rôle Owner.\nContacte un admin pour être ajouté.",
  "owner.footer": "-# 👑 Yourazz Owner Manager System",

  // Owner Dashboard
  "owner.dashboard.title": "## 📊 Dashboard — {username}",
  "owner.dashboard.score": "**Score :** {score} pts",
  "owner.dashboard.rank": "**Classement :** #{rank}",
  "owner.dashboard.teamTitle": "### 👥 Équipe",
  "owner.dashboard.teamStats": "Total : **{total}** • 🟢 Actifs : **{active}** • 🔴 Inactifs : **{inactive}**",
  "owner.dashboard.monthlyTitle": "### 🎯 Objectif mensuel",
  "owner.dashboard.nextTier": "**Prochain tier :** {emoji} {label} ({minRecruits} recrues actives)",
  "owner.dashboard.maxTier": "🏆 **Tier maximum atteint !**",

  // Owner Team
  "owner.team.title": "## 👥 Mon Équipe ({count})",
  "owner.team.empty": "Équipe vide",
  "owner.team.emptyDesc": "Tu n'as encore recruté personne.\nDemande à un admin de t'assigner des recrues.",
  "owner.team.stats": "🟢 **{active}** actifs • 🔴 **{inactive}** inactifs",
  "owner.team.sales": "{count} ventes",

  // Owner Leaderboard
  "owner.leaderboard.title": "## 🏆 Classement Owners",
  "owner.leaderboard.empty": "Aucun Owner",
  "owner.leaderboard.emptyDesc": "Aucun Owner n'est encore enregistré.",
  "owner.leaderboard.entry": "{medal} <@{discordId}> — **{score} pts** • {emoji} {tier} • {active} actifs",

  // Owner Objectives
  "owner.objectives.title": "## 🎯 Mes Objectifs",
  "owner.objectives.monthly": "### 📅 Mensuels",
  "owner.objectives.weekly": "### 📆 Hebdomadaires",
  "owner.objectives.none": "Aucun objectif actif",
  "owner.objectives.tipsTitle": "### 💡 Conseils",
  "owner.objectives.tip1": "▸ Recrute des profils qui resteront actifs",
  "owner.objectives.tip2": "▸ Accompagne tes recrues la première semaine",
  "owner.objectives.tip3": "▸ Un membre retenu 30j = +100 pts bonus",

  // Owner Rewards
  "owner.rewards.title": "## 🎁 Récompenses Owner",
  "owner.rewards.tierTitle": "### 🏅 Récompenses par Tier",
  "owner.rewards.bronze": "🥉 **Bronze** (5 recrues actives)\n▸ Rôle exclusif Bronze Owner\n▸ Accès catégorie Owner",
  "owner.rewards.silver": "🥈 **Silver** (15 recrues actives)\n▸ Salon privé Silver\n▸ Badge profil serveur",
  "owner.rewards.gold": "🥇 **Gold** (30 recrues actives)\n▸ Accès anticipé aux features\n▸ Visibilité serveur\n▸ Mention dans les annonces",
  "owner.rewards.diamond": "💎 **Diamond** (50 recrues actives)\n▸ Avantages exclusifs premium\n▸ Salon VIP Diamond\n▸ Priorité sur les décisions",
  "owner.rewards.legend": "🏆 **Legend** (100 recrues actives)\n▸ Statut permanent Legend\n▸ Toutes les récompenses\n▸ Reconnaissance officielle Yourazz",

  // Owner Help
  "owner.help.title": "## ❓ Aide — Owner Manager",
  "owner.help.howTitle": "### 🔑 Comment ça marche",
  "owner.help.howDesc": "Tu es un **Owner** — un recruteur/manager Yourazz.\nTu recrutes des membres, tu les accompagnes, et tu gagnes des points selon leur activité.",
  "owner.help.earnTitle": "### 📈 Comment gagner des points",
  "owner.help.earnRecruit": "▸ Nouvelle recrue active → **+{pts}**",
  "owner.help.earnActivity": "▸ Activité régulière équipe → **+{pts}**",
  "owner.help.earnRetention": "▸ Rétention 30 jours → **+{pts}**",
  "owner.help.earnSale": "▸ Vente d'un membre → **+{pts}**",
  "owner.help.noPointsTitle": "### ❌ Ce qui ne rapporte rien",
  "owner.help.noPointsDesc": "▸ Recrues inactives\n▸ Membres qui ne participent pas\n▸ Recrues qui partent rapidement",
  "owner.help.costTitle": "### ⚠️ Ce qui coûte des points",
  "owner.help.costSanction": "▸ Sanction d'un membre → **{pts}**",
  "owner.help.costLeft": "▸ Membre qui quitte → **{pts}**",
  "owner.help.commandsTitle": "### 📋 Commandes",
  "owner.help.commandsList": "▸ `/owner dashboard` — Tableau de bord\n▸ `/owner team` — Équipe\n▸ `/owner stats` — Statistiques\n▸ `/owner recruits` — Recrutements récents",
};
