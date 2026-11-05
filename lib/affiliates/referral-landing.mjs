/**
 * The public TeHiceEsto domain is still reverse-proxied through another Vercel
 * project. The incoming NextRequest URL can therefore refer to an internal
 * deployment hostname rather than to the customer's original hostname.
 *
 * Always finish production referrals on the public shopping domain so that
 * the HttpOnly affiliate cookie is sent by the browser to /api/checkout.
 * Previews and local development keep their current same-origin behavior.
 */
export const REFERRAL_PUBLIC_ORIGIN = "https://tehiceesto.com";

export function referralLandingUrl(path, requestUrl, vercelEnv = "") {
 const safePath = typeof path === "string" &&
  path.startsWith("/") && !path.startsWith("//") &&
  !path.includes("\\") && !/[\r\n]/.test(path) ? path : "/";
 const origin = vercelEnv === "production" ? REFERRAL_PUBLIC_ORIGIN : requestUrl;
 return new URL(safePath, origin);
}
