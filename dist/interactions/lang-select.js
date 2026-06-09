"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLangSelect = handleLangSelect;
const user_service_1 = require("../modules/users/user.service");
const i18n_1 = require("../i18n");
const cv2_1 = require("../utils/cv2");
async function handleLangSelect(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const lang = interaction.values[0];
    await user_service_1.UserService.getOrCreate(interaction.user);
    await (0, i18n_1.setUserLang)(interaction.user.id, lang);
    await interaction.editReply((0, cv2_1.buildReply)([(0, cv2_1.successCard)("Langue mise à jour", (0, i18n_1.t)(lang, "language.changed"))]));
}
//# sourceMappingURL=lang-select.js.map