"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleModal = handleModal;
const key_service_1 = require("../modules/licenses/key.service");
const user_service_1 = require("../modules/users/user.service");
const role_service_1 = require("../modules/admin/role.service");
const cv2_1 = require("../utils/cv2");
const owner_team_1 = require("./owner-team");
async function handleModal(interaction) {
    if (interaction.customId === "yrz_redeem_modal") {
        return handleRedeemModal(interaction);
    }
    if (interaction.customId === "yrz_owner_addmember_modal") {
        return (0, owner_team_1.handleAddMemberModal)(interaction);
    }
}
async function handleRedeemModal(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const key = interaction.fields.getTextInputValue("key_input").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 19);
    const dbUser = await user_service_1.UserService.getOrCreate(interaction.user);
    try {
        const { license, plan } = await key_service_1.KeyService.redeem(key, dbUser.id, interaction.guildId);
        await role_service_1.RoleService.assignSellerRole(interaction.client, interaction.guildId, interaction.user.id, plan.name);
        await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Clé activée !", `✅ Licence **${plan.displayName}** activée pour ${plan.durationDays} jours.\n\nBienvenue parmi les vendeurs ! 🎉`)]));
    }
    catch (err) {
        await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.errorCard)("Erreur", err.message || "Impossible d'activer cette clé.")]));
    }
}
//# sourceMappingURL=modals.js.map