import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  TextChannel,
  ChannelType,
  Message,
} from "discord.js";
import { isAdmin } from "../utils/permissions";
import { buildReply, successCard, errorCard, infoCard } from "../utils/cv2";
import { AutomationCoreService } from "../modules/automation/automation-core.service";
import { AntiDuplicateService } from "../modules/automation/anti-duplicate.service";
import { WATCHED_CHANNELS, getWatchedType } from "../config/channels";
import { prisma } from "../services/database";
import { logger } from "../utils/logger";

export const data = new SlashCommandBuilder()
  .setName("automation")
  .setDescription("Yourazz Automation Core — administration de l'ingestion")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sub) =>
    sub
      .setName("sync")
      .setDescription("Backfill : (re)lire l'historique d'un salon surveillé")
      .addChannelOption((opt) =>
        opt.setName("salon").setDescription("Salon à analyser (défaut : tous les salons surveillés)"),
      )
      .addIntegerOption((opt) =>
        opt
          .setName("limite")
          .setDescription("Nombre de messages à relire par salon (défaut 100, max 1000)")
          .setMinValue(1)
          .setMaxValue(1000),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("reprocess")
      .setDescription("Retraiter un message précis (force, même si déjà traité)")
      .addChannelOption((opt) =>
        opt.setName("salon").setDescription("Salon du message").setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName("message-id").setDescription("ID du message à retraiter").setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName("status").setDescription("Compteurs d'ingestion (events traités / incomplets / erreurs)"),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has("Administrator") && !isAdmin(interaction.member as any)) {
    return interaction.reply({
      ...buildReply([errorCard("Accès refusé", "Permissions admin requises.")]),
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });
  const sub = interaction.options.getSubcommand();

  switch (sub) {
    case "sync":
      return handleSync(interaction);
    case "reprocess":
      return handleReprocess(interaction);
    case "status":
      return handleStatus(interaction);
  }
}

/** Récupère jusqu'à `limit` messages (pagination par lots de 100). */
async function fetchHistory(channel: TextChannel, limit: number) {
  const all: Message[] = [];
  let before: string | undefined;
  while (all.length < limit) {
    const batchSize = Math.min(100, limit - all.length);
    const batch = await channel.messages.fetch({ limit: batchSize, before });
    if (batch.size === 0) break;
    const arr = [...batch.values()];
    all.push(...arr);
    before = arr[arr.length - 1].id;
    if (batch.size < batchSize) break;
  }
  return all;
}

async function handleSync(interaction: ChatInputCommandInteraction) {
  const chosen = interaction.options.getChannel("salon");
  const limit = interaction.options.getInteger("limite") ?? 100;

  // Salons cibles : celui choisi (s'il est surveillé) ou tous les surveillés.
  const targetIds = chosen
    ? getWatchedType(chosen.id)
      ? [chosen.id]
      : []
    : Object.keys(WATCHED_CHANNELS);

  if (targetIds.length === 0) {
    return interaction.editReply(
      buildReply([
        errorCard(
          "Salon non surveillé",
          "Ce salon n'est pas configuré dans `WATCHED_CHANNELS` (.env). Salons surveillés : vouches, feedback-staff, ticket-logs.",
        ),
      ]),
    );
  }

  let total = 0;
  const lines: string[] = [];
  for (const id of targetIds) {
    try {
      const channel = await interaction.client.channels.fetch(id);
      if (!channel || channel.type !== ChannelType.GuildText) {
        lines.push(`• <#${id}> : introuvable ou non textuel`);
        continue;
      }
      const messages = await fetchHistory(channel as TextChannel, limit);
      for (const msg of messages) {
        await AutomationCoreService.handleMessage(msg);
      }
      total += messages.length;
      lines.push(`• <#${id}> : ${messages.length} messages relus`);
    } catch (err: any) {
      logger.error("AutomationSync", `Salon ${id}: ${err?.message ?? err}`);
      lines.push(`• <#${id}> : erreur (${err?.message ?? "inconnue"})`);
    }
  }

  const counts = await AntiDuplicateService.counts();
  await interaction.editReply(
    buildReply([
      successCard(
        "Sync terminé",
        `${total} messages parcourus.\n\n${lines.join("\n")}\n\n**Total en base** — traités : ${counts.processed} • incomplets : ${counts.incomplete} • doublons : ${counts.duplicate} • erreurs : ${counts.error}`,
      ),
    ]),
  );
}

async function handleReprocess(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel("salon", true);
  const messageId = interaction.options.getString("message-id", true);

  if (!getWatchedType(channel.id)) {
    return interaction.editReply(
      buildReply([errorCard("Salon non surveillé", "Ce salon n'est pas dans la liste surveillée.")]),
    );
  }

  try {
    const ch = await interaction.client.channels.fetch(channel.id);
    if (!ch || ch.type !== ChannelType.GuildText) {
      return interaction.editReply(buildReply([errorCard("Erreur", "Salon textuel introuvable.")]));
    }
    const msg = await (ch as TextChannel).messages.fetch(messageId);
    await AutomationCoreService.handleMessage(msg, { force: true });
    await interaction.editReply(
      buildReply([successCard("Reprocess effectué", `Message \`${messageId}\` retraité.`)]),
    );
  } catch (err: any) {
    await interaction.editReply(
      buildReply([errorCard("Échec", `Impossible de retraiter : ${err?.message ?? err}`)]),
    );
  }
}

async function handleStatus(interaction: ChatInputCommandInteraction) {
  const counts = await AntiDuplicateService.counts();
  const [sellers, vouches, feedbacks, tickets] = await Promise.all([
    prisma.sellerProfile.count(),
    prisma.vouchEvent.count(),
    prisma.feedbackEvent.count(),
    prisma.ticketEvent.count(),
  ]);

  const watched = Object.keys(WATCHED_CHANNELS);
  const watchedLine =
    watched.length > 0 ? watched.map((id) => `<#${id}>`).join(", ") : "_aucun configuré dans .env_";

  await interaction.editReply(
    buildReply([
      infoCard(
        "Automation Core — état",
        [
          `**Salons surveillés** : ${watchedLine}`,
          "",
          `**Events traités** : ${counts.processed}`,
          `**Incomplets** : ${counts.incomplete}`,
          `**Doublons ignorés** : ${counts.duplicate}`,
          `**Erreurs** : ${counts.error}`,
          "",
          `**Vendeurs suivis** : ${sellers}`,
          `**Vouches** : ${vouches} • **Avis** : ${feedbacks} • **Tickets** : ${tickets}`,
        ].join("\n"),
      ),
    ]),
  );
}
