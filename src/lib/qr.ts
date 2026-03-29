import { SignJWT, jwtVerify } from "jose";
import QRCode from "qrcode";
import { env } from "@/lib/env";

export type QrTokenPayload = {
  prefectId: string;
  tokenVersion: number;
};

const secret = new TextEncoder().encode(env.QR_SECRET);

export async function signQrToken(userId: string, payload: QrTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(secret);
}

export async function verifyQrToken(token: string) {
  const verified = await jwtVerify<QrTokenPayload>(token, secret);

  return {
    userId: verified.payload.sub,
    prefectId: verified.payload.prefectId,
    tokenVersion: verified.payload.tokenVersion,
  };
}

export async function createQrDataUrl(token: string) {
  return QRCode.toDataURL(token, {
    margin: 1,
    width: 320,
    color: {
      dark: "#132127",
      light: "#f9f9f5",
    },
  });
}

export function buildPrefectIdentifier(appointedYear: number, profileId: string) {
  const suffix = profileId.slice(-6).toUpperCase();
  return `KCCPG-${appointedYear}-${suffix}`;
}
