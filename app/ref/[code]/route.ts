import {randomUUID} from "node:crypto";
import {NextRequest,NextResponse} from "next/server";
import {ATTRIBUTION_COOKIE,VISITOR_COOKIE,REFERRAL_TTL_SECONDS,callAffiliateBackend} from "@/lib/affiliates/backend";

export const runtime="nodejs";
export const dynamic="force-dynamic";
function landing(value:string|null){
 if(!value||!value.startsWith("/")||value.startsWith("//")||/\\/.test(value)||/\r|\n/.test(value))return "/";
 if(/^\/(?:admin|afiliados|ref)(?:\/|$)/i.test(value))return "/";
 return value.slice(0,500);
}
function validId(value:string|undefined){return !!value&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);}
function originHost(value:string|null){if(!value)return null;try{return new URL(value).hostname.slice(0,160)}catch{return null}}
export async function GET(req:NextRequest,{params}:{params:Promise<{code:string}>}){
 const {code:input}=await params;
 const code=(input||"").trim().toLowerCase();
 const to=landing(req.nextUrl.searchParams.get("to"));
 const url=new URL(to,req.url);
 const redirect=()=>NextResponse.redirect(url,302);
 if(!/^[a-z0-9][a-z0-9-]{2,49}$/.test(code))return redirect();
 const visitorValue=req.cookies.get(VISITOR_COOKIE)?.value;
 const visitorId=validId(visitorValue)?visitorValue!:randomUUID();
 const source=(req.nextUrl.searchParams.get("src")||"").trim().slice(0,60);
 try{
  const result=await callAffiliateBackend({
    action:"track",code,visitorId,source,landingPath:to,
    referrerDomain:originHost(req.headers.get("referer")),
  },undefined,req.headers.get("user-agent")||"");
  if(!result.ok||result.data.tracked===false||typeof result.data.affiliateToken!=="string")return redirect();
  const rawToken=result.data.affiliateToken;
  if(!/^[A-Za-z0-9_-]{30,90}$/.test(rawToken))return redirect();
  const response=redirect();
  const opts={httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax" as const,path:"/",maxAge:REFERRAL_TTL_SECONDS};
  response.cookies.set(ATTRIBUTION_COOKIE,rawToken,opts);
  response.cookies.set(VISITOR_COOKIE,visitorId,{...opts,maxAge:365*24*60*60});
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag","noindex,nofollow,noarchive");
  return response;
 }catch(err){
  console.error("affiliate_referral_capture_failed",err instanceof Error?err.message:"unknown");
  return redirect();
 }
}
