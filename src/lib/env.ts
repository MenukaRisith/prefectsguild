import { z } from "zod";

const rawEnv = {
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "mysql://root:password@127.0.0.1:3306/prefect_guild",
  APP_URL: process.env.APP_URL ?? "http://localhost:3000",
  AUTH_SECRET:
    process.env.AUTH_SECRET ?? "development-auth-secret-change-this-now",
  QR_SECRET: process.env.QR_SECRET ?? "development-qr-secret-change-this-now",
  CRON_SECRET:
    process.env.CRON_SECRET ?? "development-cron-secret-change-this-now",
  UPLOAD_DIR: process.env.UPLOAD_DIR ?? "./storage",
  SMTP_HOST: process.env.SMTP_HOST ?? "",
  SMTP_PORT: process.env.SMTP_PORT ?? "587",
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",
  SMTP_FROM:
    process.env.SMTP_FROM ??
    "Kekirawa Central College Prefects Guild <noreply@example.com>",
  ATTENDANCE_CUTOFF_HOUR: process.env.ATTENDANCE_CUTOFF_HOUR ?? "8",
};

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16),
  QR_SECRET: z.string().min(16),
  CRON_SECRET: z.string().min(16),
  UPLOAD_DIR: z.string().min(1),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM: z.string().min(3),
  ATTENDANCE_CUTOFF_HOUR: z.coerce.number().int().min(0).max(23),
});

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export const isSmtpConfigured = Boolean(
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS,
);
