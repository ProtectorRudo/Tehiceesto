import {createClient} from "@supabase/supabase-js";
import webpush from "web-push";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"no-store"};
const hasKeys=()=>Boolean(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY&&process.env.NOTIFY_INTERNAL_KEY);
function trustedPushEndpoint(endpoint){
 try{
  const u=new URL(endpoint);
  const h=u.hostname.toLowerCase();
  return u.protocol==="https:"&&!u.port&&!u.username&&!u.password&&(h==="fcm.googleapis.com"||h==="updates.push.services.mozilla.com"||h==="web.push.apple.com"||h.endsWith(".notify.windows.com"));
 }catch{return false}
}
export async function GET(){
 return Response.json({available:hasKeys(),publicKey:hasKeys()?process.env.VAPID_PUBLIC_KEY:null},{headers:noStore});
}
export async function POST(request){
 try{
  if(!hasKeys())return Response.json({error:"Las notificaciones aún no están configuradas."},{status:503,headers:noStore});
  const token=(request.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!token||token.length>5000)return Response.json({error:"No autorizado"},{status:401,headers:noStore});
  const payload=await request.json();
  const messageId=String(payload?.messageId||"");
  if(!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(messageId))return Response.json({error:"Mensaje inválido"},{status:400,headers:noStore});
  const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:"Bearer "+token}}});
  const {data:{user},error:userError}=await client.auth.getUser(token);
  if(userError||!user)return Response.json({error:"No autorizado"},{status:401,headers:noStore});
  const {data:targets,error}=await client.rpc("cp_notify_targets",{p_message:messageId,p_internal_secret:process.env.NOTIFY_INTERNAL_KEY});
  if(error)return Response.json({error:"La notificación no está autorizada."},{status:403,headers:noStore});
  if(!Array.isArray(targets)||targets.length===0)return Response.json({delivered:0},{headers:noStore});
  webpush.setVapidDetails("https://complices-piloto.onrender.com",process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);
  const pushBody=JSON.stringify({title:"Cómplices ❤️",body:"Tu pareja te dejó algo especial. Entrá para descubrirlo."});
  const responses=await Promise.allSettled(targets.slice(0,4).filter(t=>trustedPushEndpoint(t.endpoint)).map(t=>
   webpush.sendNotification({endpoint:t.endpoint,keys:{p256dh:t.p256dh,auth:t.auth_key}},pushBody,{TTL:86400,timeout:9000,urgency:"normal"})
  ));
  return Response.json({delivered:responses.filter(r=>r.status==="fulfilled").length,attempted:responses.length},{headers:noStore});
 }catch{return Response.json({error:"No se pudo entregar la notificación."},{status:500,headers:noStore})}
}
