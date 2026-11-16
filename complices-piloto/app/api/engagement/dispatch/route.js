import {createClient} from "@supabase/supabase-js";
import {timingSafeEqual} from "node:crypto";
import webpush from "web-push";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"no-store","X-Robots-Tag":"noindex"};
const send=(data,status=200)=>Response.json(data,{status,headers:HEADERS});
function allowedEndpoint(endpoint){
 try{
  const u=new URL(endpoint),h=u.hostname.toLowerCase();
  return u.protocol==="https:"&&!u.port&&!u.username&&!u.password&&
   (h==="fcm.googleapis.com"||h==="updates.push.services.mozilla.com"||h==="web.push.apple.com"||h.endsWith(".notify.windows.com"));
 }catch{return false}
}
function goodSecret(input,key){
 if(typeof input!=="string"||typeof key!=="string"||key.length<48||input.length!==key.length)return false;
 return timingSafeEqual(Buffer.from(input,"utf8"),Buffer.from(key,"utf8"));
}
export async function POST(request){
 const internal=process.env.CP_ENGAGEMENT_CRON_SECRET||"";
 if(!goodSecret(request.headers.get("x-cp-engagement-secret"),internal))return send({error:"No autorizado"},401);
 if(!process.env.VAPID_PUBLIC_KEY||!process.env.VAPID_PRIVATE_KEY)return send({error:"Notificaciones no disponibles"},503);
 try{
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{
   auth:{persistSession:false,autoRefreshToken:false}
  });
  // La base selecciona hasta una misión y una pregunta por semana, con horarios, autorización y límite por usuario.
  const {data,error}=await db.rpc("cp_claim_proactive_push",{p_secret:internal});
  if(error)return send({error:"No se pudo seleccionar el envío permitido"},503);
  const targets=Array.isArray(data)?data.slice(0,60).filter(t=>allowedEndpoint(t.endpoint)):[];
  if(!targets.length)return send({attempted:0,delivered:0});
  webpush.setVapidDetails("https://complices-piloto.onrender.com",process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);
  const results=await Promise.allSettled(targets.map(t=>{
   const isQuestion=t.kind==="question";
   const payload=JSON.stringify({title:"Cómplices ❤️",body:isQuestion?"Hay una pregunta especial para vos esta semana. Respondé cuando quieras.":"Cómplices preparó una idea para fortalecer su historia. Descubrila cuando tengas un rato."});
   return webpush.sendNotification({endpoint:t.endpoint,keys:{p256dh:t.p256dh,auth:t.auth_key}},payload,{TTL:3600,timeout:8000,urgency:"low"});
  }));
  return send({attempted:results.length,delivered:results.filter(x=>x.status==="fulfilled").length});
 }catch{return send({error:"No se pudo completar el envío programado"},503)}
}
export function GET(){return send({error:"Método no permitido"},405)}
