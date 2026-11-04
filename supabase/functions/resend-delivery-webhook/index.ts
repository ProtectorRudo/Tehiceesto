import {createClient} from "npm:@supabase/supabase-js@2";

// Resend events are verified against their original byte-for-byte payload.
// The handler stores no recipient, subject, email body, or private gift link.
const MAX_BYTES=24_576;
const MAX_AGE_SECONDS=300;
const EVENTS=new Set([
  "email.sent","email.delivered","email.delivery_delayed",
  "email.bounced","email.failed","email.suppressed","email.complained"
]);
function defaultKey(name:string){
  try{const value=JSON.parse(Deno.env.get(name)||"{}");return typeof value.default==="string"?value.default:"";}
  catch{return "";}
}
function db(){
  const url=Deno.env.get("SUPABASE_URL")||"";
  const secret=defaultKey("SUPABASE_SECRET_KEYS");
  if(!url||!secret)throw Error("backend_unavailable");
  return createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
}
const reply=(code:number,text:string)=>new Response(JSON.stringify({status:text}),{
  status:code,headers:{"content-type":"application/json","cache-control":"no-store"}
});
function decodeBase64(value:string){
  const normalized=value.replace(/-/g,"+").replace(/_/g,"/");
  if(!/^[a-zA-Z0-9+/]*={0,2}$/.test(normalized))return null;
  try{return Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length/4)*4,"=")),c=>c.charCodeAt(0));}
  catch{return null;}
}
function equalTime(a:Uint8Array,b:Uint8Array){
  if(a.length!==b.length)return false;
  let diff=0;
  for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
  return diff===0;
}
export async function validResendSignature(raw:string,headers:Headers,secret:string,nowMs=Date.now()){
  const id=headers.get("svix-id")||"";
  const ts=headers.get("svix-timestamp")||"";
  const signatures=headers.get("svix-signature")||"";
  if(!/^[a-zA-Z0-9_-]{8,160}$/.test(id)||!/^[0-9]{10,11}$/.test(ts)||!secret.startsWith("whsec_"))return false;
  const stamp=Number(ts);
  if(!Number.isSafeInteger(stamp)||Math.abs(nowMs/1000-stamp)>MAX_AGE_SECONDS)return false;
  const keyBytes=decodeBase64(secret.slice("whsec_".length));
  if(!keyBytes||keyBytes.length<16)return false;
  const key=await crypto.subtle.importKey("raw",keyBytes,{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const mac=new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(id+"."+ts+"."+raw)));
  for(const part of signatures.split(/\s+/)){
    if(!part.startsWith("v1,"))continue;
    const given=decodeBase64(part.slice(3));
    if(given&&equalTime(mac,given))return true;
  }
  return false;
}
export function acceptedDeliveryEvent(payload:unknown){
  if(!payload||typeof payload!=="object")return null;
  const p=payload as Record<string,unknown>;
  const type=String(p.type||"");
  if(!EVENTS.has(type)||!p.data||typeof p.data!=="object")return null;
  const d=p.data as Record<string,unknown>;
  const from=String(d.from||"").toLowerCase().trim();
  const match=from.match(/(?:<)?([a-z0-9._%+-]+@([a-z0-9.-]+))>?$/);
  if(!match||match[2]!=="tehiceesto.com")return null;
  const emailId=String(d.email_id||"");
  if(!/^[a-zA-Z0-9_-]{8,160}$/.test(emailId))return null;
  const when=typeof p.created_at==="string"&&Number.isFinite(Date.parse(p.created_at))?
    new Date(p.created_at).toISOString():new Date().toISOString();
  return {type,email_id:emailId,event_at:when};
}
export async function handler(req:Request){
  if(req.method!=="POST")return reply(405,"method_not_allowed");
  if(Number(req.headers.get("content-length")||0)>MAX_BYTES)return reply(413,"payload_too_large");
  const raw=await req.text().catch(()=>"");
  if(!raw||new TextEncoder().encode(raw).byteLength>MAX_BYTES)return reply(413,"payload_too_large");
  if(!req.headers.has("svix-id")||!req.headers.has("svix-signature")||
     !req.headers.has("svix-timestamp"))return reply(401,"unauthorized");
  let client;
  try{client=db();}
  catch{return reply(503,"backend_unavailable");}
  const {data:secret,error:secretError}=await client.rpc("tehiceesto_private_resend_webhook_secret");
  if(secretError||typeof secret!=="string"||!secret)return reply(503,"webhook_not_configured");
  if(!await validResendSignature(raw,req.headers,secret))return reply(401,"unauthorized");
  let parsed:unknown;
  try{parsed=JSON.parse(raw);}
  catch{return reply(400,"invalid_json");}
  const event=acceptedDeliveryEvent(parsed);
  if(!event)return reply(200,"ignored");
  const {error}=await client.from("thi_resend_delivery_events").insert({
    event_id:req.headers.get("svix-id"),
    email_id:event.email_id,
    event_type:event.type,
    event_at:event.event_at
  });
  if(error&&error.code!=="23505"){
    console.error("resend_delivery_event_storage_failed",error.code||"database_error");
    return reply(503,"storage_unavailable");
  }
  return reply(200,error?.code==="23505"?"duplicate":"recorded");
}
Deno.serve(handler);
