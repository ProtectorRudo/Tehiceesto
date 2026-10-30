"use server";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {AFFILIATE_SESSION_COOKIE,SESSION_TTL_SECONDS,callAffiliateBackend} from "@/lib/affiliates/backend";

export async function loginAffiliate(formData:FormData){
 const identifier=String(formData.get("email")||"").trim().toLowerCase().slice(0,180);
 const password=String(formData.get("password")||"");
 if(!identifier||!password)redirect("/afiliados?error=credenciales");
 let ok=false,mustChange=false;
 try{
  const result=await callAffiliateBackend({action:"login",identifier,password});
  const token=result.data.token;
  if(result.ok&&typeof token==="string"&&/^[A-Za-z0-9_-]{30,90}$/.test(token)){
   (await cookies()).set(AFFILIATE_SESSION_COOKIE,token,{
    httpOnly:true,secure:process.env.NODE_ENV==="production",
    sameSite:"lax",path:"/afiliados",maxAge:SESSION_TTL_SECONDS,
   });
   mustChange=result.data.mustChangePassword===true;
   ok=true;
  }
 }catch(err){console.error("affiliate_login_unavailable",err instanceof Error?err.message:"unknown")}
 if(!ok)redirect("/afiliados?error=credenciales");
 redirect(mustChange?"/afiliados?change=1":"/afiliados");
}
export async function logoutAffiliate(){
 const jar=await cookies();
 const token=jar.get(AFFILIATE_SESSION_COOKIE)?.value;
 if(token){try{await callAffiliateBackend({action:"logout"},token)}catch{}}
 jar.set(AFFILIATE_SESSION_COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/afiliados",maxAge:0});
 redirect("/afiliados");
}
export async function changeAffiliatePassword(formData:FormData){
 const password=String(formData.get("password")||"");
 const confirm=String(formData.get("confirm")||"");
 if(password.length<12||password!==confirm)redirect("/afiliados?change=1&error=password");
 const token=(await cookies()).get(AFFILIATE_SESSION_COOKIE)?.value;
 if(!token)redirect("/afiliados?error=credenciales");
 let changed=false;
 try{
  const response=await callAffiliateBackend({action:"changePassword",password},token);
  changed=response.ok;
 }catch{}
 if(!changed)redirect("/afiliados?change=1&error=password");
 redirect("/afiliados");
}
