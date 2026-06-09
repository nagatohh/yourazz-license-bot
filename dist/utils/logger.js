"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const database_1 = require("../services/database");
function format(level, source, message) {
    const time = new Date().toLocaleTimeString("fr-FR");
    const icons = { INFO: "ℹ️", WARN: "⚠️", ERROR: "❌", DEBUG: "🔍" };
    return `${icons[level]} [${time}] [${source}] ${message}`;
}
exports.logger = {
    info(source, message, metadata) {
        console.log(format("INFO", source, message));
        database_1.prisma.botLog.create({ data: { level: "INFO", source, message, metadata: metadata ?? undefined } }).catch(() => { });
    },
    warn(source, message, metadata) {
        console.warn(format("WARN", source, message));
        database_1.prisma.botLog.create({ data: { level: "WARN", source, message, metadata: metadata ?? undefined } }).catch(() => { });
    },
    error(source, message, metadata) {
        console.error(format("ERROR", source, message));
        database_1.prisma.botLog.create({ data: { level: "ERROR", source, message, metadata: metadata ?? undefined } }).catch(() => { });
    },
    debug(source, message, metadata) {
        if (process.env.NODE_ENV === "development") {
            console.log(format("DEBUG", source, message));
        }
        database_1.prisma.botLog.create({ data: { level: "DEBUG", source, message, metadata: metadata ?? undefined } }).catch(() => { });
    },
};
//# sourceMappingURL=logger.js.map