import { fr } from "./fr";
import { en } from "./en";
import { es } from "./es";
import { prisma } from "../services/database";

const locales: Record<string, Record<string, string>> = { fr, en, es };

export function t(lang: string, key: string): string {
  return locales[lang]?.[key] ?? locales.fr[key] ?? key;
}

export async function getUserLang(userId: string): Promise<string> {
  const user = await prisma.discordUser.findUnique({ where: { discordId: userId } });
  return (user as any)?.language ?? "fr";
}

export async function setUserLang(userId: string, lang: string): Promise<void> {
  await prisma.discordUser.updateMany({
    where: { discordId: userId },
    data: { language: lang } as any,
  });
}
