import "server-only";

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createAdminSupabase } from "@/lib/supabase/admin";

const COOKIE_NAME = "thi_aff_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function sessionHash(value: string) {
  return createHash("sha256").update(`tehiceesto-affiliate-session:${value}`).digest("hex");
}

function safeHexEqual(a: string, b: string) {
  try {
    const left = Buffer.from(a, "hex");
    const right = Buffer.from(b, "hex");
    return left.length > 0 && left.length === right.length && timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export function hashAffiliatePassword(password: string, salt = randomBytes(16).toString("hex")) {
  return { salt, hash: scryptSync(password, salt, 64).toString("hex") };
}

function verifyAffiliatePassword(password: string, salt: string, expectedHash: string) {
  return safeHexEqual(scryptSync(password, salt, 64).toString("hex"), expectedHash);
}

export async function establishAffiliateSession(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  if (!email || !password) return false;

  const supabase = createAdminSupabase();
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id,name,email,status,password_salt,password_hash")
    .eq("email", email)
    .eq("status", "active")
    .maybeSingle();

  if (!affiliate || !verifyAffiliatePassword(password, affiliate.password_salt, affiliate.password_hash)) {
    return false;
  }

  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);

  const { error } = await supabase.from("affiliate_sessions").insert({
    affiliate_id: affiliate.id,
    token_hash: sessionHash(rawToken),
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error("affiliate_session_create_failed", error);
    return false;
  }

  await supabase.from("affiliates").update({ last_login_at: new Date().toISOString() }).eq("id", affiliate.id);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/afiliados",
    maxAge: SESSION_SECONDS,
  });

  return true;
}

export async function getAffiliateSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(COOKIE_NAME)?.value;
  if (!rawToken) return null;

  const supabase = createAdminSupabase();
  const now = new Date().toISOString();

  const { data: session } = await supabase
    .from("affiliate_sessions")
    .select("id,affiliate_id,expires_at")
    .eq("token_hash", sessionHash(rawToken))
    .gt("expires_at", now)
    .maybeSingle();

  if (!session) return null;

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id,slug,name,email,status,commission_bps")
    .eq("id", session.affiliate_id)
    .eq("status", "active")
    .maybeSingle();

  if (!affiliate) return null;

  void supabase.from("affiliate_sessions").update({ last_seen_at: now }).eq("id", session.id);
  return affiliate;
}

export async function clearAffiliateSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(COOKIE_NAME)?.value;

  if (rawToken) {
    const supabase = createAdminSupabase();
    await supabase.from("affiliate_sessions").delete().eq("token_hash", sessionHash(rawToken));
  }

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/afiliados",
    maxAge: 0,
  });
}
