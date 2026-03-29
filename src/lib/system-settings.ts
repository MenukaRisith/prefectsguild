import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { siteConfig } from "@/lib/constants";

const SYSTEM_SETTINGS_ID = 1;

export type SiteIdentity = {
  schoolName: string;
  shortName: string;
  motto: string;
  footerLabel: string;
  supportWhatsappNumber: string;
  supportWhatsappHref: string;
};

export type EffectiveSystemSettings = SiteIdentity & {
  appUrl: string;
  attendanceCutoffHour: number;
  useCustomSmtp: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
  smtpSecure: boolean;
  smtpConfigured: boolean;
  smtpPasswordConfigured: boolean;
  uploadDir: string;
};

function configCipherKey() {
  return createHash("sha256").update(env.AUTH_SECRET).digest();
}

function isSettingsStoreUnavailable(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

function warnSettingsFallback(error: unknown) {
  if (isSettingsStoreUnavailable(error)) {
    console.warn(
      "System settings storage is unavailable. Falling back to built-in defaults.",
    );
  }
}

export function buildWhatsappHref(number: string) {
  const digits = number.replace(/\D/g, "");

  if (!digits) {
    return "#";
  }

  if (digits.startsWith("94")) {
    return `https://wa.me/${digits}`;
  }

  if (digits.length === 10 && digits.startsWith("0")) {
    return `https://wa.me/94${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `https://wa.me/94${digits}`;
  }

  return `https://wa.me/${digits}`;
}

export function encryptSystemSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", configCipherKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}.${authTag.toString("hex")}.${encrypted.toString("hex")}`;
}

export function decryptSystemSecret(payload?: string | null) {
  if (!payload) {
    return "";
  }

  try {
    const [ivHex, authTagHex, encryptedHex] = payload.split(".");

    if (!ivHex || !authTagHex || !encryptedHex) {
      return "";
    }

    const decipher = createDecipheriv(
      "aes-256-gcm",
      configCipherKey(),
      Buffer.from(ivHex, "hex"),
    );
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, "hex")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
}

export async function getSystemSettingsRecord() {
  try {
    return await db.systemSetting.findUnique({
      where: { id: SYSTEM_SETTINGS_ID },
    });
  } catch (error) {
    warnSettingsFallback(error);

    if (isSettingsStoreUnavailable(error)) {
      return null;
    }

    throw error;
  }
}

export async function getSystemSettings(): Promise<EffectiveSystemSettings> {
  const record = await getSystemSettingsRecord();
  const useCustomSmtp = record?.useCustomSmtp ?? false;
  const smtpHost = useCustomSmtp ? record?.smtpHost ?? "" : env.SMTP_HOST;
  const smtpPort = useCustomSmtp ? record?.smtpPort ?? 587 : env.SMTP_PORT;
  const smtpUser = useCustomSmtp ? record?.smtpUser ?? "" : env.SMTP_USER;
  const smtpFrom = useCustomSmtp
    ? record?.smtpFrom ?? ""
    : env.SMTP_FROM;
  const smtpPassword = useCustomSmtp
    ? decryptSystemSecret(record?.smtpPassEncrypted)
    : env.SMTP_PASS;
  const smtpSecure = useCustomSmtp
    ? record?.smtpSecure ?? smtpPort === 465
    : env.SMTP_PORT === 465;
  const supportWhatsappNumber =
    record?.supportWhatsappNumber || siteConfig.supportWhatsappNumber;

  return {
    schoolName: record?.schoolName || siteConfig.name,
    shortName: record?.shortName || siteConfig.shortName,
    motto: record?.motto || siteConfig.motto,
    footerLabel: record?.footerLabel || siteConfig.footerLabel,
    supportWhatsappNumber,
    supportWhatsappHref: buildWhatsappHref(supportWhatsappNumber),
    appUrl: record?.appUrl || env.APP_URL,
    attendanceCutoffHour: record?.attendanceCutoffHour ?? env.ATTENDANCE_CUTOFF_HOUR,
    useCustomSmtp,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpFrom,
    smtpSecure,
    smtpConfigured: Boolean(smtpHost && smtpUser && smtpPassword && smtpFrom),
    smtpPasswordConfigured: Boolean(record?.smtpPassEncrypted),
    uploadDir: env.UPLOAD_DIR,
  };
}

export async function upsertSystemSettings(
  data: Partial<{
    schoolName: string;
    shortName: string;
    motto: string;
    footerLabel: string;
    supportWhatsappNumber: string;
    appUrl: string | null;
    attendanceCutoffHour: number;
    useCustomSmtp: boolean;
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUser: string | null;
    smtpPassEncrypted: string | null;
    smtpFrom: string | null;
    smtpSecure: boolean | null;
  }>,
) {
  try {
    return await db.systemSetting.upsert({
      where: { id: SYSTEM_SETTINGS_ID },
      update: data,
      create: {
        id: SYSTEM_SETTINGS_ID,
        ...data,
      },
    });
  } catch (error) {
    if (isSettingsStoreUnavailable(error)) {
      throw new Error(
        "Runtime settings storage is not ready on this deployment yet. Run the latest deploy so the database schema can sync.",
      );
    }

    throw error;
  }
}

export async function getSmtpRuntimeConfig() {
  const record = await getSystemSettingsRecord();
  const useCustomSmtp = record?.useCustomSmtp ?? false;
  const host = useCustomSmtp ? record?.smtpHost ?? "" : env.SMTP_HOST;
  const port = useCustomSmtp ? record?.smtpPort ?? 587 : env.SMTP_PORT;
  const user = useCustomSmtp ? record?.smtpUser ?? "" : env.SMTP_USER;
  const from = useCustomSmtp ? record?.smtpFrom ?? "" : env.SMTP_FROM;
  const pass = useCustomSmtp
    ? decryptSystemSecret(record?.smtpPassEncrypted)
    : env.SMTP_PASS;
  const secure = useCustomSmtp
    ? record?.smtpSecure ?? port === 465
    : env.SMTP_PORT === 465;

  return {
    useCustomSmtp,
    host,
    port,
    user,
    from,
    pass,
    secure,
    configured: Boolean(host && user && pass && from),
  };
}
