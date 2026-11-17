import http from 'node:http';
import {validSignature,extractMessages,extractStatuses,sendMeta} from './meta.mjs';
import {makeDb} from './db.mjs';
import {initialState,processInbound} from './flow.mjs';
import {localClock,prepareDay,scheduledOutbox,tokenKey,isMessagingReady,isSessionMessagingReady,isAllowedRecipient} from './scheduler.mjs';
const db=makeDb();const env=process.env;
const dateOf=(time)=>localClock(time).day;
const json=(res,code,obj)=>{res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(obj));};
const fixed=(res,code,s)=>{res.writeHead(code,{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'});res.end(s);};
const read=async(req)=>{let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>524288)throw Error('payload_too_large');chunks.push(chunk);}return Buffer.concat(chunks);};
const same=(a,b)=>a&&b&&a.length===b.length&&a===b;
const authCron=req=>same((req.headers.authorization||'').replace(/^Bearer /,''),env.CRON_SECRET);
const outboundFor=(message,eventId,index,receivedAt)=>({
 key:tokenKey(`${eventId}:${index}`),channel:'service',payload:message,
 // Meta's reply window starts when the adult wrote, not when our server processed it.
 expires_at:new Date(new Date(receivedAt).getTime()+23*3600000).toISOString()
});
let flushing=false;
async function inbound(m){
 const now=new Date();
 // Never interpret stale retries as new consent or a fresh service window.
 const receivedAt=new Date(m.receivedAt);
 if(!Number.isFinite(receivedAt.getTime()) || receivedAt.getTime()<now.getTime()-23*3600000 || receivedAt.getTime()>now.getTime()+5*60000)return 'stale';for(let attempt=0;attempt<3;attempt++){
  const row=await db.family(m.phone),state=row?.state||initialState();const day=dateOf(now);
  const output=processInbound(m.text,{state,today:day,now:now.toISOString()});
  const eventId=tokenKey('whatsapp:'+m.id);
  const jobs=output.messages.map((message,i)=>outboundFor(message,eventId,i,receivedAt));
  try{const result=await db.commit(m.phone,row?.revision||0,eventId,output.state,jobs);return result.status;}catch(err){if(err.message!=='database_400'&&err.message!=='database_409'||attempt===2)throw err;}
 }
 return 'conflict';
}
async function flush(max=20){
 if(flushing)return {sent:0,skipped:'already_running'};
 if(!isSessionMessagingReady(env))return {sent:0,skipped:'send_disabled_or_meta_not_configured'};
 flushing=true;
 try {
 let sent=0,failed=0,cancelled=0,heldMarketing=0;
 // Replies take priority. A queue full of unapproved marketing jobs must not
 // prevent a parent from finishing the registration or opting out.
 const jobs=(await db.pending()).sort((a,b)=>(a.channel==='marketing')-(b.channel==='marketing')).slice(0,max);const now=new Date();
 const month=now.toISOString().slice(0,7)+'-01T00:00:00.000Z';
 const current=await db.sentThisMonth(month);
 let estimated=current.reduce((s,x)=>s+(x.channel==='marketing'?Number(env.CERCA_PRICING_MARKETING_USD||.0618):.026),0);
 const cap=Math.max(0,Number(env.CERCA_MONTHLY_CAP_USD||5));
 for(const job of jobs){
  if(job.channel==='marketing'&&!isMessagingReady(env)){heldMarketing++;continue;}
  if(job.expires_at&&new Date(job.expires_at)<=now){await db.setCancelled(job.job_key);cancelled++;continue;}
  if(!isAllowedRecipient(job.wa_id,env)){await db.setCancelled(job.job_key);cancelled++;continue;}
  // Recheck live consent immediately before network delivery, including queued old jobs.
  const owner=await db.family(job.wa_id);
  const state=owner?.state;
  const optoutReceipt=job.channel==='service' && /^(Desactivamos los envíos|El perfil y los recuerdos se eliminaron|Entendido\. No te enviaremos)/.test(job.payload?.body||'');
  if(!state || (state.deleted && !optoutReceipt) || (state.status!=='active' && !((state.status==='pending'||state.status==='onboarding')&&job.channel==='service') && !(state.status==='stopped' && optoutReceipt))){
   await db.setCancelled(job.job_key);cancelled++;continue;
  }
  const forecast=job.channel==='marketing'?Number(env.CERCA_PRICING_MARKETING_USD||.0618):.026;
  if(estimated+forecast>cap)break;
  try{const providerId=await sendMeta(job.payload,job.wa_id);await db.setSent(job.job_key,providerId);sent++;estimated+=forecast;}
  catch{await db.retry(job.job_key,job.attempts);failed++;}
 }
 return {sent,failed,cancelled,heldMarketing,estimatedUSD:Number(estimated.toFixed(3)),budgetUSD:cap};
 } finally {flushing=false;}
}
async function dispatch(){
 if(!db.available())return {status:'pending_database'};
 const canSchedule=isMessagingReady(env);
 let scheduled=0,blocked=0;
 if(canSchedule){
  const max=Math.min(100,Math.max(1,Number(env.CERCA_DAILY_MAX_FAMILIES||10)));
  const rows=await db.activeFamilies();
  for(const family of rows.slice(0,max)){
   const now=new Date(),p=await prepareDay(family.state,now,{templateDaily:env.META_TEMPLATE_DAILY,templateWeekly:env.META_TEMPLATE_WEEKLY});
   if(!p)continue;
   const jobs=scheduledOutbox(family.wa_id,p.batch,{weekly:p.weekly,templateDaily:env.META_TEMPLATE_DAILY,templateWeekly:env.META_TEMPLATE_WEEKLY});
   if(!jobs.length){blocked++;continue;}
   try{const r=await db.commit(family.wa_id,family.revision,tokenKey(`daily:${family.wa_id}:${p.batch.day}`),p.updated,jobs);if(r.status==='applied')scheduled++;}catch{blocked++;}
  }
 }
 return {scheduled,blocked,ready:canSchedule,...await flush()};
}
async function handle(req,res){
 const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
 if(req.method==='GET'&&url.pathname==='/healthz'){
  let database=db.available()?'configured_unverified':'pending';
  if(db.available()&&typeof db.ping==='function'){
    try{await db.ping();database='ready';}catch{database='unreachable';}
  }
  return json(res,200,{service:'CERCA-WhatsApp',version:'0.4.1',database,meta:isSessionMessagingReady(env)?'session_ready':'pending',scheduledTemplates:isMessagingReady(env)?'approved':'disabled',clientInterface:'whatsapp-only'});
 }
 if(url.pathname==='/webhooks/whatsapp'&&req.method==='GET'){
  if(url.searchParams.get('hub.mode')==='subscribe'&&env.META_VERIFY_TOKEN&&url.searchParams.get('hub.verify_token')===env.META_VERIFY_TOKEN)return fixed(res,200,url.searchParams.get('hub.challenge')||'');
  return fixed(res,403,'Forbidden');
 }
 if(url.pathname==='/webhooks/whatsapp'&&req.method==='POST'){
  const raw=await read(req);
  if(!validSignature(raw,req.headers['x-hub-signature-256'],env.META_APP_SECRET))return fixed(res,403,'Forbidden');
  if(!db.available())return json(res,503,{error:'database_unavailable'});
  const payload=JSON.parse(raw.toString('utf8'));
  for(const receipt of extractStatuses(payload)){try{await db.setDelivery(receipt.messageId,receipt.status);}catch{/* Retry is driven by Meta; do not leak message data. */}}
  const messages=extractMessages(payload).filter(msg=>isAllowedRecipient(msg.phone,env));
  for(const msg of messages)await inbound(msg);
  // An outbox write is atomic with state; WhatsApp retries when DB fails.
  try{await flush(Math.min(20,messages.length*3));}catch{}
  return json(res,200,{received:messages.length});
 }
 if(url.pathname==='/internal/dispatch'&&req.method==='POST'){
  if(!env.CRON_SECRET||!authCron(req))return fixed(res,403,'Forbidden');
  return json(res,200,await dispatch());
 }
 return json(res,404,{error:'not_found'});
}
export const start=()=>http.createServer((req,res)=>handle(req,res).catch(err=>{const c=err.message==='payload_too_large'?413:500;json(res,c,{error:'request_failed'});})).listen(Number(env.PORT||3000),'0.0.0.0');
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)start();