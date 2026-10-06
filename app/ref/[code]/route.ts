import { randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  AFFILIATE_ATTRIBUTION_DAYS,
  AFFILIATE_ATTR_COOKIE,
  AFFILIATE_VISITOR_COOKIE,
  cleanAffiliateCode,
  hashAffiliateToken,
  privacyHash,
} from "@/lib/affiliates/core";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeLanding(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/admin") || value.startsWith("/afiliados") || value.startsWith("/ref/")) return "/";
  return value.slice(0, 500);
}

function safeReferrerDomain(value: string | null) {
  if (!value) return null;
  try { return new URL(value).hostname.slice(0, 255); } catch { return null; }
}

function validVisitorId(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const code = cleanAffiliateCode(rawCode);
  const landing = safeLanding(request.nextUrl.searchParams.get("to"));
  const redirectUrl = new URL(landing, request.url);
  const source = (request.nextUrl.searchParams.get("src") || "").trim().slice(0, 80) || null;

  if (!code) return NextResponse.redirect(redirectUrl, 302);

  try {
    const supabase = createAdminSupabase();
    const { data: link } = await supabase
      .from("affiliate_links")
      .select("id,affiliate_id,status")
      .eq("code", code)
      .eq("status", "active")
      .maybeSingle();

    if (!link) return NextResponse.redirect(redirectUrl, 302);

    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id,status")
      .eq("id", link.affiliate_id)
      .eq("status", "active")
      .maybeSingle();

    if (!affiliate) return NextResponse.redirect(redirectUrl, 302);

    const currentVisitor = request.cookies.get(AFFILIATE_VISITOR_COOKIE)?.value;
    const visitorId = validVisitorId(currentVisitor) ? currentVisitor! : randomUUID();
    const rawToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(
      Date.now() + AFFILIATE_ATTRIBUTION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: token, error: tokenError } = await supabase
      .from("affiliate_attribution_tokens")
      .insert({
        token_hash: hashAffiliateToken(rawToken),
        affiliate_id: affiliate.id,
        link_id: link.id,
        visitor_id: visitorId,
        source,
        landing_path: landing,
        last_click_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (tokenError || !token) {
      console.error("affiliate_token_capture_failed", tokenError);
      return NextResponse.redirect(redirectUrl, 302);
    }

    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const userAgent = request.headers.get("user-agent") || "";

    const { error: visitError } = await supabase.from("affiliate_visits").insert({
      affiliate_id: affiliate.id,
      link_id: link.id,
      attribution_token_id: token.id,
      visitor_id: visitorId,
      source,
      landing_path: landing,
      referrer_domain: safeReferrerDomain(request.headers.get("referer")),
      user_agent_hash: userAgent ? privacyHash("ua", userAgent) : null,
      ip_hash: forwardedFor ? privacyHash("ip", forwardedFor) : null,
    });

    if (visitError) console.error("affiliate_visit_capture_failed", visitError);

    const response = NextResponse.redirect(redirectUrl, 302);
    const secure = process.env.NODE_ENV === "production";
    const maxAge = AFFILIATE_ATTRIBUTION_DAYS * 24 * 60 * 60;

    response.cookies.set(AFFILIATE_ATTR_COOKIE, rawToken, {
      httpOnly: true, secure, sameSite: "lax", path: "/", maxAge,
    });
    response.cookies.set(AFFILIATE_VISITOR_COOKIE, visitorId, {
      httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365,
    });
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  } catch (error) {
    console.error("affiliate_capture_unexpected_error", error);
    return NextResponse.redirect(redirectUrl, 302);
  }
}
