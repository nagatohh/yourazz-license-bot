import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_GUILD_ID: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  APP_URL: z.string().default("http://localhost:3000"),
  PORT: z.string().default("3000"),
  ADMIN_ROLE_ID: z.string().min(1),
  SELLER_BASIC_ROLE_ID: z.string().default(""),
  STAFF_LOG_CHANNEL_ID: z.string().default(""),
  LICENSE_LOG_CHANNEL_ID: z.string().default(""),
  OPENAI_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
