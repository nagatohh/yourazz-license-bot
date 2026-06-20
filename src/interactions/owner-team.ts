import {
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  GuildMember,
  Client,
  TextChannel,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from "discord.js";
import { OwnerService } from "../modules/owners/owner.service";
import { OwnerTeamService, TeamError } from "../modules/owners/owner-team.service";
import { AuditService } from "../modules/admin/audit.service";
import { buildReply, successCard, errorCard, infoCard, ACCENT } from "../utils/cv2";
import { THEME } from "../config/branding";
import { CHANNELS } from "../config/channels";
import { ROLES } from "../config/roles";
import { isAdmin } from "../utils/permissions";
import {
  OWNER_ROLE_ID,
  MANAGER_ROLE_ID,
  TEAM_REQUIRED_ROLE_ID,
  TEAM_NOTE_MAX,
} from "../config/owners";
import { checkCooldown } from "../utils/rateLimit";
import { logger } from "../utils/logger";

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────

/** L'utilisateur a-t-il le droit de gérer une équipe (Owner / Manager / Admin) ? */
function canManageTeam(member: GuildMember | null): boolean {
  if (!member) return false;
  if (isAdmin(member)) return true;
  if (member.roles.cache.has(OWNER_ROLE_ID)) return true;
  if (MANAGER_ROLE_ID && member.roles.cache.has(MANAGER_ROLE_ID)) return true;
  return false;
}

/** Récupère l'Owner du cliqueur (requête légère), le crée s'il est éligible, sinon null. */
async function resolveOwner(interaction: ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction) {
  const owner = await OwnerService.getLite(interaction.user.id);
  if (owner) return owner;

  const member = interaction.member as GuildMember | null;
  if (canManageTeam(member)) {
    return OwnerService.create(interaction.user.id, interaction.user.username);
  }
  return null;
}

/** Extrait un ID Discord valide depuis une mention `<@id>` ou un ID brut. */
function parseMemberId(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 17 || digits.length > 20) return null;
  return digits;
}

/** Neutralise une note libre (anti-injection markdown / mentions). */
function sanitizeNote(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const clean = raw
    .replace(/[`@]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, TEAM_NOTE_MAX);
  return clean.length > 0 ? clean : null;
}

/** Envoie un log dans le salon staff (mentions désactivées). */
async function sendStaffLog(client: Client, title: string, body: string, accent: keyof typeof ACCENT) {
  if (!CHANNELS.staffLog) return;
  try {
    const channel = (await client.channels.fetch(CHANNELS.staffLog)) as TextChannel | null;
    if (!channel) return;
    const container = new ContainerBuilder()
      .setAccentColor(ACCENT[accent])
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(title))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
    await channel.send({ ...buildReply([container]), allowedMentions: { parse: [] } } as any);
  } catch (err: any) {
    logger.error("OwnerTeam", `Log staff impossible: ${err.message}`);
  }
}

/** Notifie le membre ajouté en DM (silencieux si DM fermés). */
async function dmMemberAdded(client: Client, memberId: string, ownerDiscordId: string) {
  try {
    const user = await client.users.fetch(memberId);
    const container = new ContainerBuilder()
      .setAccentColor(THEME.primary)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent("## 👑 Bienvenue dans une équipe Yourazz"))
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Vous avez été ajouté à l'équipe de <@${ownerDiscordId}> sur **Yourazz**.\n\n` +
          "Restez actif pour faire progresser votre équipe ! 🚀",
        ),
      );
    await user.send({ ...buildReply([container]), allowedMentions: { parse: [] } } as any);
  } catch {
    logger.warn("OwnerTeam", `DM impossible au membre ${memberId}`);
  }
}

/**
 * Garantit qu'une promesse (ex : requête DB transatlantique) ne bloque pas
 * indéfiniment l'interaction. Rejette après `ms` si elle n'a pas abouti.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} (${ms}ms)`)), ms),
    ),
  ]);
}

// ───────────────────────────────────────────────────────────────
// ➕ Ajouter un membre — ouverture du modal
// ───────────────────────────────────────────────────────────────

export async function showAddMemberModal(interaction: ButtonInteraction) {
  const member = interaction.member as GuildMember | null;
  if (!canManageTeam(member)) {
    return interaction.reply({
      ...buildReply([errorCard("Accès refusé", "Vous n'êtes pas autorisé à ajouter un membre.")]),
      ephemeral: true,
    });
  }

  const modal = new ModalBuilder()
    .setCustomId("yrz_owner_addmember_modal")
    .setTitle("➕ Ajouter un membre");

  const memberInput = new TextInputBuilder()
    .setCustomId("member_input")
    .setLabel("ID Discord ou mention du membre")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(40)
    .setPlaceholder("@membre ou 123456789012345678");

  const noteInput = new TextInputBuilder()
    .setCustomId("note_input")
    .setLabel("Note interne / rôle (optionnel)")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setMaxLength(TEAM_NOTE_MAX)
    .setPlaceholder("Ex : Nouveau vendeur recruté");

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(memberInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(noteInput),
  );

  await interaction.showModal(modal);
}

// ───────────────────────────────────────────────────────────────
// ➕ Ajouter un membre — soumission du modal
// ───────────────────────────────────────────────────────────────

export async function handleAddMemberModal(interaction: ModalSubmitInteraction) {
  await interaction.deferReply({ ephemeral: true });

  // Anti-spam dédié à l'action d'ajout
  const { ok, remaining } = checkCooldown(interaction.user.id, "owner addmember");
  if (!ok) {
    return interaction.editReply(
      buildReply([errorCard("Trop vite !", `Attendez **${remaining}s** avant un nouvel ajout.`)]),
    );
  }

  if (!interaction.guild) {
    return interaction.editReply(buildReply([errorCard("Erreur", "Action indisponible ici.")]));
  }

  const actor = interaction.member as GuildMember | null;
  if (!canManageTeam(actor)) {
    await logUnauthorized(interaction.user.id, "add");
    return interaction.editReply(
      buildReply([errorCard("Accès refusé", "Vous n'êtes pas autorisé à ajouter un membre.")]),
    );
  }

  let owner;
  try {
    owner = await withTimeout(resolveOwner(interaction), 8000, "resolveOwner");
  } catch (err: any) {
    logger.error("OwnerTeam", `resolveOwner: ${err.message}`);
    return interaction.editReply(
      buildReply([errorCard("Base de données lente", "La base ne répond pas pour l'instant. Réessaie dans quelques secondes.")]),
    );
  }
  if (!owner) {
    return interaction.editReply(
      buildReply([errorCard("Accès refusé", "Vous ne possédez pas d'équipe Owner.")]),
    );
  }

  // Parsing & validation de l'entrée
  const rawMember = interaction.fields.getTextInputValue("member_input");
  const memberId = parseMemberId(rawMember);
  if (!memberId) {
    return interaction.editReply(
      buildReply([errorCard("Entrée invalide", "Fournissez un ID Discord valide ou une mention.")]),
    );
  }

  const note = sanitizeNote(interaction.fields.getTextInputValue("note_input"));

  // Vérifications Discord (présence serveur, bot, soi-même, staff)
  const target = await interaction.guild.members.fetch(memberId).catch(() => null);
  if (!target) {
    return interaction.editReply(
      buildReply([errorCard("Introuvable", "Ce membre n'est pas sur le serveur.")]),
    );
  }
  if (target.user.bot) {
    return interaction.editReply(
      buildReply([errorCard("Action refusée", "Vous ne pouvez pas ajouter un bot.")]),
    );
  }
  if (target.id === interaction.user.id) {
    return interaction.editReply(
      buildReply([errorCard("Action refusée", "Vous ne pouvez pas vous ajouter vous-même.")]),
    );
  }

  const targetIsStaff =
    target.roles.cache.has(ROLES.admin) ||
    target.roles.cache.has(OWNER_ROLE_ID) ||
    (MANAGER_ROLE_ID ? target.roles.cache.has(MANAGER_ROLE_ID) : false);
  if (targetIsStaff && !isAdmin(actor!)) {
    return interaction.editReply(
      buildReply([errorCard("Action refusée", "Vous ne pouvez pas ajouter un admin ou un owner à votre équipe.")]),
    );
  }

  if (TEAM_REQUIRED_ROLE_ID && !target.roles.cache.has(TEAM_REQUIRED_ROLE_ID)) {
    return interaction.editReply(
      buildReply([errorCard("Rôle requis manquant", "Ce membre ne possède pas le rôle requis pour rejoindre une équipe.")]),
    );
  }

  // Ajout (vérifications base de données dans le service)
  try {
    await withTimeout(
      OwnerTeamService.addMember({
        owner: { id: owner.id, tier: owner.tier },
        memberId,
        memberUsername: target.user.username,
        addedById: interaction.user.id,
        note,
      }),
      9000,
      "addMember",
    );
  } catch (err: any) {
    if (err instanceof TeamError) {
      void AuditService.log(null, "owner_team.add_failed", null, {
        code: err.code,
        ownerDiscordId: interaction.user.id,
        memberId,
      }).catch(() => {});
      return interaction.editReply(buildReply([errorCard("Ajout impossible", err.message)]));
    }
    logger.error("OwnerTeam", `Ajout échoué: ${err.message}`, { stack: err.stack });
    return interaction.editReply(
      buildReply([errorCard("Base de données lente", "L'ajout n'a pas pu être confirmé (base lente). Vérifie « 👥 Mon Équipe » dans quelques secondes avant de réessayer.")]),
    );
  }

  // ✅ Réponse IMMÉDIATE à l'utilisateur — ne jamais la bloquer derrière les effets de bord.
  await interaction.editReply(
    buildReply([
      successCard(
        "Membre ajouté",
        `✅ Membre ajouté avec succès à votre équipe.\n\n` +
          `**Membre :** <@${memberId}>\n` +
          `**Ajouté par :** <@${interaction.user.id}>` +
          (note ? `\n**Note :** ${note}` : ""),
      ),
    ]),
  );

  // Effets de bord NON bloquants (audit, log staff, DM) — exécutés en arrière-plan.
  void AuditService.log(null, "owner_team.member_added", null, {
    ownerId: owner.id,
    ownerDiscordId: interaction.user.id,
    memberId,
    note: note ?? undefined,
  }).catch((e: any) => logger.error("OwnerTeam", `Audit add: ${e.message}`));

  void sendStaffLog(
    interaction.client,
    "## ➕ Nouveau membre ajouté à une équipe",
    `**Owner :** <@${interaction.user.id}>\n` +
      `**Membre :** <@${memberId}>\n` +
      (note ? `**Note :** ${note}\n` : "") +
      `**Date :** <t:${Math.floor(Date.now() / 1000)}:F>`,
    "primary",
  );

  void dmMemberAdded(interaction.client, memberId, interaction.user.id);
}

// ───────────────────────────────────────────────────────────────
// ➖ Retirer un membre — affiche le menu de sélection
// ───────────────────────────────────────────────────────────────

export async function showRemoveMemberSelect(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const actor = interaction.member as GuildMember | null;
  if (!canManageTeam(actor)) {
    await logUnauthorized(interaction.user.id, "remove");
    return interaction.editReply(
      buildReply([errorCard("Accès refusé", "Vous n'êtes pas autorisé à retirer un membre.")]),
    );
  }

  let owner;
  let team;
  try {
    owner = await withTimeout(resolveOwner(interaction), 8000, "resolveOwner");
    if (!owner) {
      return interaction.editReply(
        buildReply([errorCard("Accès refusé", "Vous ne possédez pas d'équipe Owner.")]),
      );
    }
    team = await withTimeout(OwnerService.getTeam(owner.id), 8000, "getTeam");
  } catch (err: any) {
    logger.error("OwnerTeam", `showRemove: ${err.message}`);
    return interaction.editReply(
      buildReply([errorCard("Base de données lente", "La base ne répond pas pour l'instant. Réessaie dans quelques secondes.")]),
    );
  }

  if (team.length === 0) {
    return interaction.editReply(
      buildReply([infoCard("Équipe vide", "Vous n'avez aucun membre à retirer.")]),
    );
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId("yrz_owner_removeselect")
    .setPlaceholder("Sélectionnez le membre à retirer")
    .addOptions(
      team.slice(0, 25).map((m) => ({
        label: m.username.slice(0, 100),
        value: m.discordId,
        description: `${m.status === "ACTIVE" ? "Actif" : "Inactif"} • ${m.totalSales} ventes`.slice(0, 100),
      })),
    );

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.warning)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("## ➖ Retirer un membre"))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("Choisissez le membre à retirer de votre équipe.\nL'historique est conservé."),
    );

  await interaction.editReply(
    buildReply([container], [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)]),
  );
}

// ───────────────────────────────────────────────────────────────
// ➖ Retirer un membre — sélection → demande de confirmation
// ───────────────────────────────────────────────────────────────

export async function handleRemoveMemberSelect(interaction: StringSelectMenuInteraction) {
  await interaction.deferUpdate();

  const actor = interaction.member as GuildMember | null;
  if (!canManageTeam(actor)) {
    await logUnauthorized(interaction.user.id, "remove");
    return interaction.editReply(
      buildReply([errorCard("Accès refusé", "Vous n'êtes pas autorisé à retirer un membre.")]),
    );
  }

  const memberId = parseMemberId(interaction.values[0] ?? "");
  if (!memberId) {
    return interaction.editReply(buildReply([errorCard("Erreur", "Membre invalide.")]));
  }

  const container = new ContainerBuilder()
    .setAccentColor(ACCENT.warning)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("## ⚠️ Confirmer le retrait"))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `Voulez-vous vraiment retirer <@${memberId}> de votre équipe ?\nL'historique sera conservé.`,
      ),
    );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`yrz_owner_confirmremove_${memberId}`)
      .setLabel("✅ Confirmer le retrait")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("yrz_owner_cancelremove")
      .setLabel("❌ Annuler")
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.editReply(buildReply([container], [row]));
}

// ───────────────────────────────────────────────────────────────
// ➖ Retirer un membre — confirmation → retrait effectif
// ───────────────────────────────────────────────────────────────

export async function handleConfirmRemove(interaction: ButtonInteraction) {
  await interaction.deferUpdate();

  const { ok } = checkCooldown(interaction.user.id, "owner removemember");
  if (!ok) {
    return interaction.editReply(
      buildReply([errorCard("Trop vite !", "Patientez quelques secondes avant de réessayer.")]),
    );
  }

  const actor = interaction.member as GuildMember | null;
  if (!canManageTeam(actor)) {
    await logUnauthorized(interaction.user.id, "remove");
    return interaction.editReply(
      buildReply([errorCard("Accès refusé", "Vous n'êtes pas autorisé à retirer un membre.")]),
    );
  }

  let owner;
  try {
    owner = await withTimeout(resolveOwner(interaction), 8000, "resolveOwner");
  } catch (err: any) {
    logger.error("OwnerTeam", `resolveOwner: ${err.message}`);
    return interaction.editReply(
      buildReply([errorCard("Base de données lente", "La base ne répond pas pour l'instant. Réessaie dans quelques secondes.")]),
    );
  }
  if (!owner) {
    return interaction.editReply(
      buildReply([errorCard("Accès refusé", "Vous ne possédez pas d'équipe Owner.")]),
    );
  }

  const memberId = parseMemberId(interaction.customId.replace("yrz_owner_confirmremove_", ""));
  if (!memberId) {
    return interaction.editReply(buildReply([errorCard("Erreur", "Membre invalide.")]));
  }

  try {
    await withTimeout(OwnerTeamService.removeMember({ ownerId: owner.id, memberId }), 9000, "removeMember");
  } catch (err: any) {
    if (err instanceof TeamError) {
      void AuditService.log(null, "owner_team.remove_failed", null, {
        code: err.code,
        ownerDiscordId: interaction.user.id,
        memberId,
      }).catch(() => {});
      return interaction.editReply(buildReply([errorCard("Retrait impossible", err.message)]));
    }
    logger.error("OwnerTeam", `Retrait échoué: ${err.message}`, { stack: err.stack });
    return interaction.editReply(
      buildReply([errorCard("Base de données lente", "Le retrait n'a pas pu être confirmé (base lente). Réessaie dans quelques secondes.")]),
    );
  }

  // ✅ Réponse immédiate — effets de bord en arrière-plan.
  await interaction.editReply(
    buildReply([
      successCard("Membre retiré", `✅ <@${memberId}> a été retiré de votre équipe.\nL'historique est conservé.`),
    ]),
  );

  void AuditService.log(null, "owner_team.member_removed", null, {
    ownerId: owner.id,
    ownerDiscordId: interaction.user.id,
    memberId,
  }).catch((e: any) => logger.error("OwnerTeam", `Audit remove: ${e.message}`));

  void sendStaffLog(
    interaction.client,
    "## ➖ Membre retiré d'une équipe",
    `**Owner :** <@${interaction.user.id}>\n` +
      `**Membre :** <@${memberId}>\n` +
      `**Date :** <t:${Math.floor(Date.now() / 1000)}:F>`,
    "warning",
  );
}

// ───────────────────────────────────────────────────────────────
// ➖ Retirer un membre — annulation
// ───────────────────────────────────────────────────────────────

export async function handleCancelRemove(interaction: ButtonInteraction) {
  await interaction.deferUpdate();
  await interaction.editReply(
    buildReply([infoCard("Annulé", "Aucun membre n'a été retiré de votre équipe.")]),
  );
}

// ───────────────────────────────────────────────────────────────
// Audit d'une tentative non autorisée
// ───────────────────────────────────────────────────────────────

async function logUnauthorized(discordId: string, action: "add" | "remove") {
  await AuditService.log(null, "owner_team.unauthorized", null, { discordId, action }).catch(() => {});
}
