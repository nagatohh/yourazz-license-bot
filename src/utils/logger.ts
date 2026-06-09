import { prisma } from "../services/database";

type Level = "INFO" | "WARN" | "ERROR" | "DEBUG";

function format(level: Level, source: string, message: string): string {
  const time = new Date().toLocaleTimeString("fr-FR");
  const icons = { INFO: "ℹ️", WARN: "⚠️", ERROR: "❌", DEBUG: "🔍" };
  return `${icons[level]} [${time}] [${source}] ${message}`;
}

export const logger = {
  info(source: string, message: string, metadata?: object) {
    console.log(format("INFO", source, message));
    prisma.botLog.create({ data: { level: "INFO", source, message, metadata: metadata ?? undefined } }).catch(() => {});
  },
  warn(source: string, message: string, metadata?: object) {
    console.warn(format("WARN", source, message));
    prisma.botLog.create({ data: { level: "WARN", source, message, metadata: metadata ?? undefined } }).catch(() => {});
  },
  error(source: string, message: string, metadata?: object) {
    console.error(format("ERROR", source, message));
    prisma.botLog.create({ data: { level: "ERROR", source, message, metadata: metadata ?? undefined } }).catch(() => {});
  },
  debug(source: string, message: string, metadata?: object) {
    if (process.env.NODE_ENV === "development") {
      console.log(format("DEBUG", source, message));
    }
    prisma.botLog.create({ data: { level: "DEBUG", source, message, metadata: metadata ?? undefined } }).catch(() => {});
  },
};
