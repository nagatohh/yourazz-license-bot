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
import { KeyService } from "../modules/licenses/key.service";
import { UserService } from "../modules/users/user.service";
import { RoleService } from "../modules/admin/role.service";
import { AuditService } from "../modules/admin/audit.service";
import { isAdmin } from "../utils/permissions";
import { successCard, errorCard, primaryCard, buildReply, ACCENT } from "../utils/cv2";
import { formatPrice, formatDate } from "../utils/format";
import { PLANS } from "../config/licenses";

export const data = new SlashCommandBuilder()
  .setName("admin")
  .setDescription("Commandes d'administration des licences")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommandGroup((group) =>
    group
      .setName("licence")
      .setDescription("Gérer les licences")
      .addSubcommand((sub) =>
        sub
          .setName("voir")
          .setDescription("Voir la licence d'un utilisateur")
          .addUserOption((opt) => opt.setName("user").setDescription("L'utilisateur").setRequired(true)),
      )
      .addSubcommand((sub) =>
        sub
          .setName("donner")
          .setDescription("Donner une licence manuellement")
          .addUserOption((opt) => opt.setName("user").setDescription("L'utilisateur").setRequired(true))
          .addIntegerOption((opt) => opt.setName("duree").setDescription("Durée en jours (défaut: 30)")),
      )
      .addSubcommand((sub) =>
        sub
          .setName("suspendre")
          .setDescription("Suspendre une licence")
          .addUserOption((opt) => opt.setName("user").setDescription("L'utilisateur").setRequired(true))
          .addStringOption((opt) => opt.setName("raison").setDescription("Raison").setRequired(true)),
      )
      .addSubcommand((sub) =>
        sub
          .setName("reactiver")
          .setDescription("Réactiver une licence suspendue")
          .addUserOption((opt) => opt.setName("user").setDescription("L'utilisateur").setRequired(true)),
      )
      .addSubcommand((sub) =>
        sub
          .setName("prolonger")
          .setDescription("Prolonger une licence")
          .addUserOption((opt) => opt.setName("user").setDescription("L'utilisateur").setRequired(true))
          .addIntegerOption((opt) => opt.setName("jours").setDescription("Nombre de jours à ajouter").setRequired(true)),
      ),
  )
  .addSubcommand((sub) => sub.setName("stats").setDescription("Statistiques globales"))
  .addSubcommand((sub) => sub.setName("licences").setDescription("Lister toutes les licences"))
  .addSubcommand((sub) => sub.setName("sync").setDescription("Synchroniser rôles/licences"))
  .addSubcommand((sub) => sub.setName("logs").setDescription("Voir les derniers événements"))
  .addSubcommand((sub) =>
    sub
      .setName("genkey")
      .setDescription("Générer des clés licence")
      .addIntegerOption((opt) => opt.setName("nombre").setDescription("Nombre de clés (défaut: 1)")),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has("Administrator") && !isAdmin(interaction.member as any)) {
    return interaction.reply({ ...buildReply([errorCard("Accès refusé", "Vous n'avez pas les permissions admin.")]), ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const group = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand();

  if (group === "licence") {
    switch (sub) {
      case "voir": return handleVoir(interaction);
      case "donner": return handleDonner(interaction);
      case "suspendre": return handleSuspendre(interaction);
      case "reactiver": return handleReactiver(interaction);
      case "prolonger": return handleProlonger(interaction);
    }
  }

  switch (sub) {
    case "stats": return handleStats(interaction);
    case "licences": return handleLicences(interaction);
    case "sync": return handleSync(interaction);
    case "logs": return handleLogs(interaction);
    case "genkey": return handleGenKey(interaction);
  }
}

async function handleVoir(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("user", true);
  const dbUser = await UserService.getByDiscordId(target.id);
  if (!dbUser) return interaction.editReply(buildReply([errorCard("Inconnu", "Cet utilisateur n'est pas enregistré.")]));

  const license = await LicenseService.getActive(dbUser.id, interaction.guildId!);
  if (!license) return interaction.editReply(buildReply([errorCard("Pas de licence", `${target.username} n'a pas de licence active.`)]));

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.info)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 📋 Licence de ${target.username}`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Plan :** ${license.plan.displayName}\n` +
        `**Statut :** ${license.status}\n` +
        `**Expire :** ${formatDate(license.expiresAt)}`,
      ),
    );

  await interaction.editReply(buildReply([container]));
}

async function handleDonner(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("user", true);
  const duree = interaction.options.getInteger("duree") ?? 30;

  const dbUser = await UserService.getOrCreate(target);
  await LicenseService.create(dbUser.id, interaction.guildId!, "vendeur", duree);
  await RoleService.assignSellerRole(interaction.client, interaction.guildId!, target.id, "vendeur");

  await AuditService.log(
    (await UserService.getOrCreate(interaction.user)).id,
    "LICENSE_GRANTED",
    dbUser.id,
    { plan: "vendeur", duree },
  );

  await interaction.editReply(buildReply([successCard("Licence donnée", `Licence **Vendeur** donnée à ${target} pour ${duree} jours.`)]));
}

async function handleSuspendre(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("user", true);
  const raison = interaction.options.getString("raison", true);
  const dbUser = await UserService.getByDiscordId(target.id);
  if (!dbUser) return interaction.editReply(buildReply([errorCard("Inconnu", "Utilisateur non trouvé.")]));

  const license = await LicenseService.getActive(dbUser.id, interaction.guildId!);
  if (!license) return interaction.editReply(buildReply([errorCard("Pas de licence", "Aucune licence active.")]));

  await LicenseService.suspend(license.id, raison);
  await RoleService.removeSellerRoles(interaction.client, interaction.guildId!, target.id);

  await interaction.editReply(buildReply([successCard("Licence suspendue", `Licence de ${target} suspendue.\nRaison : ${raison}`)]));
}

async function handleReactiver(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("user", true);
  const dbUser = await UserService.getByDiscordId(target.id);
  if (!dbUser) return interaction.editReply(buildReply([errorCard("Inconnu", "Utilisateur non trouvé.")]));

  const licenses = await LicenseService.getByUser(dbUser.id);
  const suspended = licenses.find((l) => l.status === "SUSPENDED");
  if (!suspended) return interaction.editReply(buildReply([errorCard("Aucune", "Pas de licence suspendue.")]));

  await LicenseService.reactivate(suspended.id);
  await RoleService.assignSellerRole(interaction.client, interaction.guildId!, target.id, suspended.plan.name);

  await interaction.editReply(buildReply([successCard("Licence réactivée", `Licence de ${target} réactivée.`)]));
}

async function handleProlonger(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("user", true);
  const jours = interaction.options.getInteger("jours", true);
  const dbUser = await UserService.getByDiscordId(target.id);
  if (!dbUser) return interaction.editReply(buildReply([errorCard("Inconnu", "Utilisateur non trouvé.")]));

  const license = await LicenseService.getActive(dbUser.id, interaction.guildId!);
  if (!license) return interaction.editReply(buildReply([errorCard("Pas de licence", "Aucune licence active.")]));

  await LicenseService.extend(license.id, jours);
  await interaction.editReply(buildReply([successCard("Licence prolongée", `+${jours} jours ajoutés à la licence de ${target}.`)]));
}

async function handleStats(interaction: ChatInputCommandInteraction) {
  const stats = await LicenseService.getStats(interaction.guildId!);

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.primary)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 📊 Statistiques Licences`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `🟢 **Actives :** ${stats.active}　⚫ **Expirées :** ${stats.expired}　🔴 **Suspendues :** ${stats.suspended}\n\n` +
        `💰 **Revenu total :** ${formatPrice(stats.totalRevenue)}\n` +
        `📅 **Revenu ce mois :** ${formatPrice(stats.monthRevenue)}`,
      ),
    );

  await interaction.editReply(buildReply([container]));
}

async function handleLicences(interaction: ChatInputCommandInteraction) {
  const licenses = await LicenseService.getAllByGuild(interaction.guildId!);

  if (licenses.length === 0) {
    return interaction.editReply(buildReply([primaryCard("📋 Licences", ["Aucune licence pour le moment."])]));
  }

  const list = licenses.slice(0, 15).map((l) => {
    const icon = l.status === "ACTIVE" ? "🟢" : l.status === "SUSPENDED" ? "🔴" : "⚫";
    return `${icon} <@${l.user.discordId}> — **${l.plan.displayName}** — ${l.status}`;
  });

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.primary)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 📋 Licences (${licenses.length})`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(list.join("\n")));

  await interaction.editReply(buildReply([container]));
}

async function handleSync(interaction: ChatInputCommandInteraction) {
  const licenses = await LicenseService.getAllByGuild(interaction.guildId!, "ACTIVE");
  let synced = 0;

  for (const license of licenses) {
    try {
      await RoleService.assignSellerRole(interaction.client, interaction.guildId!, license.user.discordId, license.plan.name);
      synced++;
    } catch {}
  }

  await interaction.editReply(buildReply([successCard("Sync terminée", `${synced}/${licenses.length} licences synchronisées.`)]));
}

async function handleLogs(interaction: ChatInputCommandInteraction) {
  const logs = await AuditService.getRecent(10);

  if (logs.length === 0) {
    return interaction.editReply(buildReply([primaryCard("📜 Logs", ["Aucun log."])]));
  }

  const list = logs.map((l) => {
    const time = `<t:${Math.floor(l.createdAt.getTime() / 1000)}:R>`;
    return `${time} **${l.action}** ${l.actor ? `par ${l.actor.username}` : ""}`;
  });

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.dark)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 📜 Derniers événements`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(list.join("\n")));

  await interaction.editReply(buildReply([container]));
}

async function handleGenKey(interaction: ChatInputCommandInteraction) {
  const nombre = interaction.options.getInteger("nombre") ?? 1;

  const keys = await KeyService.generate("vendeur", nombre);
  const list = keys.map((k) => `\`${k.key}\``).join("\n");

  await interaction.editReply(buildReply([successCard(`🔑 ${nombre} clé(s) générée(s)`, `Plan **Vendeur** (25€/mois)\n\n${list}`)]));
}
