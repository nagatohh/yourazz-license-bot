import { StringSelectMenuInteraction } from "discord.js";
import { UserService } from "../modules/users/user.service";
import { setUserLang, t } from "../i18n";
import { successCard, buildReply } from "../utils/cv2";

export async function handleLangSelect(interaction: StringSelectMenuInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const lang = interaction.values[0];
  await UserService.getOrCreate(interaction.user);
  await setUserLang(interaction.user.id, lang);

  await interaction.editReply(buildReply([successCard("Langue mise à jour", t(lang, "language.changed"))]));
}
