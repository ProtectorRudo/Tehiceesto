"use server";
import {cookies} from "next/headers";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {AFFILIATE_ADMIN_COOKIE,adminAffiliateCall,adminAffiliateCookieOptions,adminAffiliateSession} from "@/lib/affiliates/admin-backend";

function safeValue(data:FormData,name:string,max=160){return String(data.get(name)||"").trim().slice(0,max);}
async function authorized(){
 const session=await adminAffiliateSession();
 if(!session)redirect("/admin/affiliates?notice=sesion");
 return session;
}
export async function loginAffiliateAdmin(formData:FormData){
 const key=String(formData.get("accessKey")||"");
 if(!key||key.length>200)redirect("/admin/affiliates?notice=credenciales");
 try{
  const r=await adminAffiliateCall({action:"login",accessKey:key});
  const token=String(r.data.token||"");
  if(!r.ok||!/^[A-Za-z0-9_-]{40,90}$/.test(token))redirect("/admin/affiliates?notice=credenciales");
  (await cookies()).set(AFFILIATE_ADMIN_COOKIE,token,adminAffiliateCookieOptions());
 }catch(e){
  if(e instanceof Error&&e.message==="NEXT_REDIRECT")throw e;
  redirect("/admin/affiliates?notice=credenciales");
 }
 redirect("/admin/affiliates");
}
export async function logoutAffiliateAdmin(){
 const jar=await cookies(),token=await adminAffiliateSession();
 if(token){try{await adminAffiliateCall({action:"logout"},token)}catch{}}
 jar.set(AFFILIATE_ADMIN_COOKIE,"",{...adminAffiliateCookieOptions(),maxAge:0});
 redirect("/admin/affiliates");
}
export async function createAffiliateAction(formData:FormData){
 const token=await authorized();
 const name=safeValue(formData,"name",100),email=safeValue(formData,"email",180).toLowerCase();
 const whatsapp=safeValue(formData,"whatsapp",40),slug=safeValue(formData,"slug",50);
 const password=String(formData.get("password")||"");
 const percent=Number(formData.get("commissionPercent"));
 if(name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<12||password.length>128||
  !Number.isFinite(percent)||percent<0||percent>50)redirect("/admin/affiliates?notice=datos-invalidos");
 try{
  const r=await adminAffiliateCall({action:"create",name,email,whatsapp,slug:slug||name,
   password,commissionBps:Math.round(percent*100)},token);
  if(!r.ok)redirect("/admin/affiliates?notice="+(r.data.error==="affiliate_exists"?"email-existente":"no-se-pudo-crear"));
 }catch(e){
  if(e instanceof Error&&e.message==="NEXT_REDIRECT")throw e;
  redirect("/admin/affiliates?notice=no-se-pudo-crear");
 }
 revalidatePath("/admin/affiliates");
 redirect("/admin/affiliates?notice=creado");
}
export async function setAffiliateStatusAction(formData:FormData){
 const token=await authorized();
 const id=safeValue(formData,"affiliateId",50);
 const status=safeValue(formData,"status",10);
 if(!/^[0-9a-f-]{36}$/i.test(id)||!["active","paused"].includes(status))redirect("/admin/affiliates?notice=datos-invalidos");
 try{
  const r=await adminAffiliateCall({action:"update",id,status},token);
  if(!r.ok)redirect("/admin/affiliates?notice=actualizacion-fallida");
 }catch(e){if(e instanceof Error&&e.message==="NEXT_REDIRECT")throw e;redirect("/admin/affiliates?notice=actualizacion-fallida")}
 revalidatePath("/admin/affiliates");
 redirect("/admin/affiliates?notice=actualizado");
}
export async function payAffiliateAction(formData:FormData){
 const token=await authorized();
 const affiliateId=safeValue(formData,"affiliateId",50);
 const reference=safeValue(formData,"reference",120);
 const confirmed=formData.get("transferConfirmed")==="yes";
 // IMPORTANT: booking a payout is NOT executing a bank transfer.
 if(!/^[0-9a-f-]{36}$/i.test(affiliateId)||reference.length<5||!confirmed)
  redirect("/admin/affiliates?notice=referencia-requerida");
 try{
  const r=await adminAffiliateCall({action:"payout",affiliateId,providerReference:reference,
   notes:"Transferencia externa confirmada y registrada manualmente desde TeHiceEsto"},token);
  if(!r.ok)redirect("/admin/affiliates?notice=sin-comisiones-pendientes");
 }catch(e){if(e instanceof Error&&e.message==="NEXT_REDIRECT")throw e;redirect("/admin/affiliates?notice=sin-comisiones-pendientes")}
 revalidatePath("/admin/affiliates");
 redirect("/admin/affiliates?notice=liquidado");
}
