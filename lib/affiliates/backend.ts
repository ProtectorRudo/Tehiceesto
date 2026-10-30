import "server-only";

export const ATTRIBUTION_COOKIE="thi_ref";
export const VISITOR_COOKIE="thi_vid";
export const AFFILIATE_SESSION_COOKIE="thi_aff_session";
export const REFERRAL_TTL_SECONDS=30*24*60*60;
export const SESSION_TTL_SECONDS=7*24*60*60;

export function affiliateBackendConfig(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL||"";
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)||!key)throw Error("affiliate_backend_unavailable");
  return {url:url.replace(/\/$/,""),key};
}
export async function callAffiliateBackend(body:Record<string,unknown>,session?:string,userAgent?:string){
  const {url,key}=affiliateBackendConfig();
  const response=await fetch(url+"/functions/v1/affiliate-public",{
    method:"POST",cache:"no-store",signal:AbortSignal.timeout(12000),
    headers:{"apikey":key,"content-type":"application/json",...(session?{"x-affiliate-session":session}:{}),...(userAgent?{"user-agent":userAgent}:{})},
    body:JSON.stringify(body),
  });
  const data=await response.json().catch(()=>({})) as Record<string,unknown>;
  return {status:response.status,ok:response.ok&&!data.error,data};
}
