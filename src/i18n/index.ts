import { fr } from "./fr";
import { en } from "./en";
import { es } from "./es";

const locales: Record<string, Record<string, string>> = { fr, en, es };

export function t(lang: string, key: string): string {
  return locales[lang]?.[key] ?? locales.fr[key] ?? key;
}

export async function getUserLang(userId: string): Promise<string> {
  const { prisma } = await import("../services/database");
  const user = await prisma.discordUser.findUnique({ where: { discordId: userId } });
  return (user as any)?.language ?? "fr";
}

export async function setUserLang(userId: string, lang: string): Promise<void> {
  const { prisma } = await import("../services/database");
  await prisma.discordUser.updateMany({
    where: { discordId: userId },
    data: { language: lang } as any,
  });
}
