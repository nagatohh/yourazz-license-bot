"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const key_service_1 = require("../modules/licenses/key.service");
const user_service_1 = require("../modules/users/user.service");
const role_service_1 = require("../modules/admin/role.service");
const cv2_1 = require("../utils/cv2");
const permissions_1 = require("../utils/permissions");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("key")
    .setDescription("Gérer les clés licence")
    .addSubcommand((sub) => sub
    .setName("redeem")
    .setDescription("Activer une clé licence")
    .addStringOption((opt) => opt.setName("cle").setDescription("Votre clé (ex: YRZ-XXXX-XXXX-XXXX)").setRequired(true)))
    .addSubcommand((sub) => sub
    .setName("status")
    .setDescription("Vérifier le statut d'une clé")
    .addStringOption((opt) => opt.setName("cle").setDescription("La clé à vérifier").setRequired(true)));
async function execute(interaction) {
    if (!(0, permissions_1.isSeller)(interaction.member)) {
        return interaction.reply({ ...(0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Accès refusé", "Cette commande est réservée aux vendeurs Yourazz.")]), ephemeral: true });
    }
    const sub = interaction.options.getSubcommand();
    switch (sub) {
        case "redeem": return handleRedeem(interaction);
        case "status": return handleStatus(interaction);
    }
}
async function handleRedeem(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const key = interaction.options.getString("cle", true).trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 19);
    const dbUser = await user_service_1.UserService.getOrCreate(interaction.user);
    try {
        const { license, plan } = await key_service_1.KeyService.redeem(key, dbUser.id, interaction.guildId);
        await role_service_1.RoleService.assignSellerRole(interaction.client, interaction.guildId, interaction.user.id, plan.name);
        await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Clé activée !", `Votre clé **${key}** a été activée avec succès.\n\n` +
                `📋 Plan : **${plan.displayName}**\n` +
                `⏳ Durée : **${plan.durationDays} jours**\n\n` +
                `Bienvenue parmi les vendeurs ! 🎉`)]));
    }
    catch (err) {
        await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Erreur", err.message || "Impossible d'activer cette clé.")]));
    }
}
async function handleStatus(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const key = interaction.options.getString("cle", true).trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 19);
    const keyData = await key_service_1.KeyService.getStatus(key);
    if (!keyData) {
        return interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Clé inconnue", "Cette clé n'existe pas.")]));
    }
    const statusMap = {
        AVAILABLE: "🟢 Disponible",
        REDEEMED: "🔵 Utilisée",
        EXPIRED: "🟡 Expirée",
        BLACKLISTED: "🔴 Blacklistée",
    };
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)(`Clé : ${key}`, `**Statut :** ${statusMap[keyData.status]}\n` +
            `**Plan :** ${keyData.plan.displayName}\n` +
            `**Durée :** ${keyData.durationDays} jours\n` +
            (keyData.redeemedBy ? `**Utilisée par :** ${keyData.redeemedBy.username}` : ""))]));
}
//# sourceMappingURL=key.js.map