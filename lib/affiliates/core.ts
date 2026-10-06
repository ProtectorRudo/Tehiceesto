import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const AFFILIATE_ATTR_COOKIE = "thi_ref";
export const AFFILIATE_VISITOR_COOKIE = "thi_vid";
export const AFFILIATE_ATTRIBUTION_DAYS = 30;

function hashSecret() {
  const secret =
    process.env.AFFILIATE_HASH_SECRET ||
    process.env.ADMIN_ACCESS_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!secret) throw new Error("affiliate_hash_secret_not_configured");
  return secret;
}

export function hashAffiliateToken(value: string) {
  return createHash("sha256")
    .update(`${hashSecret()}:token:${value}`)
    .digest("hex");
}

export function privacyHash(kind: "ip" | "ua", value: string) {
  return createHash("sha256")
    .update(`${hashSecret()}:${kind}:${value}`)
    .digest("hex");
}

export function cleanAffiliateCode(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 50);
}

export async function attributeOrderFromCurrentRequest(orderId: string) {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(AFFILIATE_ATTR_COOKIE)?.value;
  if (!rawToken) return null;

  const supabase = createAdminSupabase();
  const tokenHash = hashAffiliateToken(rawToken);

  const { data: token } = await supabase
    .from("affiliate_attribution_tokens")
    .select("affiliate_id,link_id,visitor_id,source,expires_at")
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!token) return null;

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id,status,commission_bps")
    .eq("id", token.affiliate_id)
    .eq("status", "active")
    .maybeSingle();

  if (!affiliate) return null;

  const { data: existing } = await supabase
    .from("affiliate_order_attributions")
    .select("order_id,affiliate_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existing) return { affiliateId: existing.affiliate_id, existing: true };

  const { error } = await supabase
    .from("affiliate_order_attributions")
    .insert({
      order_id: orderId,
      affiliate_id: affiliate.id,
      link_id: token.link_id,
      visitor_id: token.visitor_id,
      source: token.source,
      commission_bps_snapshot: affiliate.commission_bps,
    });

  if (error) {
    if (error.code === "23505") return { affiliateId: affiliate.id, existing: true };
    console.error("affiliate_order_attribution_failed", error);
    return null;
  }

  return { affiliateId: affiliate.id, existing: false };
}
