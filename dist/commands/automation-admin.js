"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const permissions_1 = require("../utils/permissions");
const cv2_1 = require("../utils/cv2");
const automation_core_service_1 = require("../modules/automation/automation-core.service");
const anti_duplicate_service_1 = require("../modules/automation/anti-duplicate.service");
const channels_1 = require("../config/channels");
const database_1 = require("../services/database");
const logger_1 = require("../utils/logger");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("automation")
    .setDescription("Yourazz Automation Core — administration de l'ingestion")
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
    .addSubcommand((sub) => sub
    .setName("sync")
    .setDescription("Backfill : (re)lire l'historique d'un salon surveillé")
    .addChannelOption((opt) => opt.setName("salon").setDescription("Salon à analyser (défaut : tous les salons surveillés)"))
    .addIntegerOption((opt) => opt
    .setName("limite")
    .setDescription("Nombre de messages à relire par salon (défaut 100, max 1000)")
    .setMinValue(1)
    .setMaxValue(1000)))
    .addSubcommand((sub) => sub
    .setName("reprocess")
    .setDescription("Retraiter un message précis (force, même si déjà traité)")
    .addChannelOption((opt) => opt.setName("salon").setDescription("Salon du message").setRequired(true))
    .addStringOption((opt) => opt.setName("message-id").setDescription("ID du message à retraiter").setRequired(true)))
    .addSubcommand((sub) => sub.setName("status").setDescription("Compteurs d'ingestion (events traités / incomplets / erreurs)"));
async function execute(interaction) {
    if (!interaction.memberPermissions?.has("Administrator") && !(0, permissions_1.isAdmin)(interaction.member)) {
        return interaction.reply({
            ...(0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Accès refusé", "Permissions admin requises.")]),
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
async function fetchHistory(channel, limit) {
    const all = [];
    let before;
    while (all.length < limit) {
        const batchSize = Math.min(100, limit - all.length);
        const batch = await channel.messages.fetch({ limit: batchSize, before });
        if (batch.size === 0)
            break;
        const arr = [...batch.values()];
        all.push(...arr);
        before = arr[arr.length - 1].id;
        if (batch.size < batchSize)
            break;
    }
    return all;
}
async function handleSync(interaction) {
    const chosen = interaction.options.getChannel("salon");
    const limit = interaction.options.getInteger("limite") ?? 100;
    // Salons cibles : celui choisi (s'il est surveillé) ou tous les surveillés.
    const targetIds = chosen
        ? (0, channels_1.getWatchedType)(chosen.id)
            ? [chosen.id]
            : []
        : Object.keys(channels_1.WATCHED_CHANNELS);
    if (targetIds.length === 0) {
        return interaction.editReply((0, cv2_1.buildReply)([
            (0, cv2_1.errorCard)("Salon non surveillé", "Ce salon n'est pas configuré dans `WATCHED_CHANNELS` (.env). Salons surveillés : vouches, feedback-staff, ticket-logs."),
        ]));
    }
    let total = 0;
    const lines = [];
    for (const id of targetIds) {
        try {
            const channel = await interaction.client.channels.fetch(id);
            if (!channel || channel.type !== discord_js_1.ChannelType.GuildText) {
                lines.push(`• <#${id}> : introuvable ou non textuel`);
                continue;
            }
            const messages = await fetchHistory(channel, limit);
            for (const msg of messages) {
                await automation_core_service_1.AutomationCoreService.handleMessage(msg);
            }
            total += messages.length;
            lines.push(`• <#${id}> : ${messages.length} messages relus`);
        }
        catch (err) {
            logger_1.logger.error("AutomationSync", `Salon ${id}: ${err?.message ?? err}`);
            lines.push(`• <#${id}> : erreur (${err?.message ?? "inconnue"})`);
        }
    }
    const counts = await anti_duplicate_service_1.AntiDuplicateService.counts();
    await interaction.editReply((0, cv2_1.buildReply)([
        (0, cv2_1.successCard)("Sync terminé", `${total} messages parcourus.\n\n${lines.join("\n")}\n\n**Total en base** — traités : ${counts.processed} • incomplets : ${counts.incomplete} • doublons : ${counts.duplicate} • erreurs : ${counts.error}`),
    ]));
}
async function handleReprocess(interaction) {
    const channel = interaction.options.getChannel("salon", true);
    const messageId = interaction.options.getString("message-id", true);
    if (!(0, channels_1.getWatchedType)(channel.id)) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Salon non surveillé", "Ce salon n'est pas dans la liste surveillée.")]));
    }
    try {
        const ch = await interaction.client.channels.fetch(channel.id);
        if (!ch || ch.type !== discord_js_1.ChannelType.GuildText) {
            return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Erreur", "Salon textuel introuvable.")]));
        }
        const msg = await ch.messages.fetch(messageId);
        await automation_core_service_1.AutomationCoreService.handleMessage(msg, { force: true });
        await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Reprocess effectué", `Message \`${messageId}\` retraité.`)]));
    }
    catch (err) {
        await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Échec", `Impossible de retraiter : ${err?.message ?? err}`)]));
    }
}
async function handleStatus(interaction) {
    const counts = await anti_duplicate_service_1.AntiDuplicateService.counts();
    const [sellers, vouches, feedbacks, tickets] = await Promise.all([
        database_1.prisma.sellerProfile.count(),
        database_1.prisma.vouchEvent.count(),
        database_1.prisma.feedbackEvent.count(),
        database_1.prisma.ticketEvent.count(),
    ]);
    const watched = Object.keys(channels_1.WATCHED_CHANNELS);
    const watchedLine = watched.length > 0 ? watched.map((id) => `<#${id}>`).join(", ") : "_aucun configuré dans .env_";
    await interaction.editReply((0, cv2_1.buildReply)([
        (0, cv2_1.infoCard)("Automation Core — état", [
            `**Salons surveillés** : ${watchedLine}`,
            "",
            `**Events traités** : ${counts.processed}`,
            `**Incomplets** : ${counts.incomplete}`,
            `**Doublons ignorés** : ${counts.duplicate}`,
            `**Erreurs** : ${counts.error}`,
            "",
            `**Vendeurs suivis** : ${sellers}`,
            `**Vouches** : ${vouches} • **Avis** : ${feedbacks} • **Tickets** : ${tickets}`,
        ].join("\n")),
    ]));
}
//# sourceMappingURL=automation-admin.js.map