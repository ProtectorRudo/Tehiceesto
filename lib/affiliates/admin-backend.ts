import "server-only";
import {cookies} from "next/headers";

export const AFFILIATE_ADMIN_COOKIE="thi_aff_admin";
export const AFFILIATE_ADMIN_TTL=8*60*60;

function credentials(){
  const url=(process.env.NEXT_PUBLIC_SUPABASE_URL||"").replace(/\/$/,"");
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!key)throw Error("admin_affiliate_backend_unavailable");
  return {url,key};
}
export async function adminAffiliateCall(body:Record<string,unknown>,token?:string){
  const {url,key}=credentials();
  const endpoint=body.action==="login"?"admin-api":"affiliate-admin";
  const response=await fetch(url+"/functions/v1/"+endpoint,{
    method:"POST",cache:"no-store",signal:AbortSignal.timeout(12000),
    headers:{"content-type":"application/json","apikey":key,...(token?{"x-admin-session":token}:{})},
    body:JSON.stringify(body),
  });
  const data=await response.json().catch(()=>({})) as Record<string,unknown>;
  return {ok:response.ok&&!data.error,status:response.status,data};
}
export async function adminAffiliateSession(){
  const raw=(await cookies()).get(AFFILIATE_ADMIN_COOKIE)?.value;
  return raw&&/^[A-Za-z0-9_-]{40,90}$/.test(raw)?raw:null;
}
export function adminAffiliateCookieOptions(){
 return {httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict" as const,path:"/admin/affiliates",maxAge:AFFILIATE_ADMIN_TTL};
}
