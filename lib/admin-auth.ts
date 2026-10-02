import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "thi_admin";

function fingerprint(value: string) {
  return createHash("sha256")
    .update(`tehiceesto-admin:${value}`)
    .digest("hex");
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

export async function isAdminAuthenticated() {
  const accessKey = process.env.ADMIN_ACCESS_KEY;
  if (!accessKey) return false;

  const cookieStore = await cookies();
  const current = cookieStore.get(COOKIE_NAME)?.value;
  if (!current) return false;

  return safeEqual(current, fingerprint(accessKey));
}

export async function establishAdminSession(candidate: string) {
  const accessKey = process.env.ADMIN_ACCESS_KEY;
  if (!accessKey) return false;

  if (!safeEqual(fingerprint(candidate), fingerprint(accessKey))) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, fingerprint(accessKey), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 60 * 60 * 8,
  });

  return true;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 0,
  });
}
