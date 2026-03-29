import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { hasRole } from "@/lib/permissions";
import { getSystemSettingsRecord } from "@/lib/system-settings";

const sessionCookieName = "kccpg_session";
const sessionDurationMs = 1000 * 60 * 60 * 24 * 30;

export type SessionUser = Awaited<ReturnType<typeof getCurrentUser>>;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function getRequestMetadata() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const settings = await getSystemSettingsRecord();
  const effectiveAppUrl = settings?.appUrl || env.APP_URL;

  return {
    userAgent: headerStore.get("user-agent") ?? "Unknown device",
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? "127.0.0.1",
    isSecure:
      forwardedProto === "https" || effectiveAppUrl.startsWith("https://"),
  };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + sessionDurationMs);
  const request = await getRequestMetadata();

  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: request.userAgent,
      ipAddress: request.ipAddress,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.isSecure,
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    await db.session.deleteMany({
      where: {
        tokenHash: hashToken(token),
      },
    });
  }

  cookieStore.delete(sessionCookieName);
}

export async function invalidateAllUserSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          prefectProfile: true,
          qrPass: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  await db.session.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();

  if (!hasRole(user.role, roles)) {
    redirect("/dashboard");
  }

  return user;
}
