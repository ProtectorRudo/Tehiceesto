import "server-only";

import {cookies} from "next/headers";

const COOKIE_NAME="thi_admin";
const MAX_AGE=8*60*60;
function endpoint(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return null;
  return {url:url.replace(/\/$/,"")+"/functions/v1/admin-api",key};
}

// Only server actions and RSC code can read these secure HttpOnly session cookies.
export async function adminRequest(action:string,data:Record<string,unknown>={}):Promise<Record<string,unknown>|null>{
  const config=endpoint();
  if(!config)return null;
  const token=(await cookies()).get(COOKIE_NAME)?.value||"";
  if(!token)return null;
  try{
    const response=await fetch(config.url,{
      method:"POST",cache:"no-store",
      headers:{apikey:config.key,"content-type":"application/json","x-admin-session":token},
      body:JSON.stringify({action,...data}),signal:AbortSignal.timeout(12000)
    });
    if(!response.ok)return null;
    return await response.json() as Record<string,unknown>;
  }catch{return null;}
}

export async function isAdminAuthenticated(){
  const session=await adminRequest("getCommerceSettings");
  return !!session&&typeof session==="object"&&!!session.settings;
}

export async function establishAdminSession(candidate:string){
  const config=endpoint();
  if(!config||!candidate||candidate.length>200)return false;
  try{
    const response=await fetch(config.url,{
      method:"POST",cache:"no-store",
      headers:{apikey:config.key,"content-type":"application/json"},
      body:JSON.stringify({action:"login",accessKey:candidate}),
      signal:AbortSignal.timeout(12000)
    });
    if(!response.ok)return false;
    const payload=await response.json() as {token?:unknown,expiresAt?:unknown};
    const token=String(payload.token||"");
    if(!/^[A-Za-z0-9_-]{35,160}$/.test(token))return false;
    const cookieStore=await cookies();
    cookieStore.set(COOKIE_NAME,token,{
      httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",
      path:"/admin",maxAge:MAX_AGE
    });
    return true;
  }catch{return false;}
}

export async function clearAdminSession(){
  await adminRequest("logout");
  const cookieStore=await cookies();
  cookieStore.set(COOKIE_NAME,"",{
    httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",
    path:"/admin",maxAge:0
  });
}
