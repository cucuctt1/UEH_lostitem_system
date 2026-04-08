import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("4000"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  CLIENT_ORIGINS: z.string().default(""),
  ALLOW_NGROK_ORIGINS: z.string().default("false"),
  MYSQL_HOST: z.string().default("localhost"),
  MYSQL_PORT: z.string().default("3306"),
  MYSQL_USER: z.string().default("root"),
  MYSQL_PASSWORD: z.string().default(""),
  MYSQL_DATABASE: z.string().default("lost_found_db"),
  JWT_SECRET: z.string().default("dev-only-jwt-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  UPLOAD_BASE_URL: z.string().default("http://localhost:4000/uploads"),
  MAX_UPLOAD_MB: z.string().default("5"),
  MATCH_TOP_K: z.string().default("5"),
  AUTO_SETUP_DB: z.string().default("true"),
  TAG_FREQUENT_THRESHOLD: z.string().default("5"),
  TAG_MIN_USAGE_TO_KEEP: z.string().default("2"),
  TAG_CLEANUP_INTERVAL_MINUTES: z.string().default("30")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.errors.map((error) => `${error.path.join(".")}: ${error.message}`).join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

const extraOrigins = parsed.success
  ? parsed.data.CLIENT_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];

export const env = {
  port: Number(parsed.data.PORT),
  clientOrigin: parsed.data.CLIENT_ORIGIN,
  clientOrigins: Array.from(new Set([parsed.data.CLIENT_ORIGIN, ...extraOrigins])),
  allowNgrokOrigins: parsed.data.ALLOW_NGROK_ORIGINS.toLowerCase() === "true",
  mysql: {
    host: parsed.data.MYSQL_HOST,
    port: Number(parsed.data.MYSQL_PORT),
    user: parsed.data.MYSQL_USER,
    password: parsed.data.MYSQL_PASSWORD,
    database: parsed.data.MYSQL_DATABASE
  },
  jwtSecret: parsed.data.JWT_SECRET,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
  uploadBaseUrl: parsed.data.UPLOAD_BASE_URL,
  maxUploadMb: Number(parsed.data.MAX_UPLOAD_MB),
  matchTopK: Number(parsed.data.MATCH_TOP_K),
  autoSetupDb: parsed.data.AUTO_SETUP_DB.toLowerCase() === "true",
  tagFrequentThreshold: Number(parsed.data.TAG_FREQUENT_THRESHOLD),
  tagMinUsageToKeep: Number(parsed.data.TAG_MIN_USAGE_TO_KEEP),
  tagCleanupIntervalMinutes: Number(parsed.data.TAG_CLEANUP_INTERVAL_MINUTES)
};
