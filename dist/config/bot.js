"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
require("dotenv/config");
const envSchema = zod_1.z.object({
    DISCORD_TOKEN: zod_1.z.string().min(1),
    DISCORD_CLIENT_ID: zod_1.z.string().min(1),
    DISCORD_GUILD_ID: zod_1.z.string().min(1),
    DATABASE_URL: zod_1.z.string().min(1),
    STRIPE_SECRET_KEY: zod_1.z.string().default(""),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().default(""),
    APP_URL: zod_1.z.string().default("http://localhost:3000"),
    PORT: zod_1.z.string().default("3000"),
    ADMIN_ROLE_ID: zod_1.z.string().min(1),
    SELLER_BASIC_ROLE_ID: zod_1.z.string().default(""),
    STAFF_LOG_CHANNEL_ID: zod_1.z.string().default(""),
    LICENSE_LOG_CHANNEL_ID: zod_1.z.string().default(""),
    OPENAI_API_KEY: zod_1.z.string().optional(),
});
exports.env = envSchema.parse(process.env);
//# sourceMappingURL=bot.js.map