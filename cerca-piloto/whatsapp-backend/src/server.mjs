import http from 'node:http';
import {createHash,timingSafeEqual,randomBytes} from 'node:crypto';
import {validSignature,extractMessages,extractStatuses,sendMeta} from './meta.mjs';
import {parseTwilioForm,validateTwilioSignature,extractTwilioMessage,extractTwilioStatus,sendTwilio} from './twilio.mjs';
import {makeDb} from './db.mjs';
import {classifyDbFailure} from './db_pg.mjs';
import {validateEvolutionWebhook,extractEvolutionMessage,sendEvolution,fetchEvolutionQr,fetchEvolutionPairingCode,classifyEvolutionQrError,probeEvolutionTransport} from './evolution.mjs';
import {validateWhapiWebhook,extractWhapiMessages,extractWhapiStatuses,sendWhapi} from './whapi.mjs';
import {initialState,processInbound} from './flow.mjs';
import {prepareWeeklyDispatch,weeklyEnabled} from './huella-weekly.mjs';
import {contentModel} from './huella-ai.mjs';
import {previewIntent,previewPermitted,handlePreviewInbound} from './huella-preview.mjs';
import {isQualityPreviewIntent,isRecoveryPreviewIntent,isKaiaRetestPreviewIntent,handleQualityPreviewInbound} from './huella-quality-preview.mjs';
import {infantReviewIntent,handleInfantReview} from './huella-infant-preview.mjs';
import {localClock,prepareDay,scheduledOutbox,tokenKey,isMessagingReady,isSessionMessagingReady,isAllowedRecipient,isAllowedInboundRecipient,inboundPolicy} from './scheduler.mjs';
const db=makeDb();const env=process.env;
const dateOf=(time)=>localClock(time).day;
const json=(res,code,obj)=>{res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(obj));};
const fixed=(res,code,s)=>{res.writeHead(code,{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'});res.end(s);};
const read=async(req)=>{let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>524288)throw Error('payload_too_large');chunks.push(chunk);}return Buffer.concat(chunks);};
const same=(a,b)=>a&&b&&a.length===b.length&&a===b;
const sameSecret=(a,b)=>timingSafeEqual(createHash('sha256').update(a).digest(),createHash('sha256').update(b).digest());
const authCron=req=>same((req.headers.authorization||'').replace(/^Bearer /,''),env.CRON_SECRET);
const outboundFor=(message,eventId,index,receivedAt)=>({
 key:tokenKey(`${eventId}:${index}`),channel:'service',payload:message,
 // Meta's reply window starts when the adult wrote, not when our server processed it.
 expires_at:new Date(new Date(receivedAt).getTime()+23*3600000).toISOString()
});
let flushing=false;
/** Log only a small fixed category. Never log phone numbers, payloads or credentials. */
export function classifyOutboundFailure(error){
 const msg=String(error?.message||'');
 if(/^evolution_http_\d{3}$/.test(msg))return msg;
 if(/^whapi_http_\d{3}$/.test(msg))return msg;
 if(/^whapi_(not_configured|missing_message_id|invalid_message|scheduled_disabled)$/.test(msg))return msg;
 if(/^evolution_(not_configured|missing_message_id|invalid_message|empty_text|scheduled_disabled)$/.test(msg))return msg;
 if(/^meta_http_\d{3}$/.test(msg))return msg;
 if(/^twilio_http_\d{3}$/.test(msg))return msg;
 if(error?.name==='AbortError')return 'provider_timeout';
 const code=String(error?.cause?.code||error?.code||'').toUpperCase();
 if(['ENOTFOUND','EAI_AGAIN','ECONNREFUSED','ECONNRESET','ETIMEDOUT','UND_ERR_CONNECT_TIMEOUT','CERT_HAS_EXPIRED'].includes(code))
  return 'network_'+code.toLowerCase();
 return 'transport_unclassified';
}
/** Fixed, non-identifying labels for Evolution webhook acceptance. */
export function classifyEvolutionInbound(event,message,accepted,instance) {
 if(accepted)return 'accepted';
 if(message)return 'not_allowlisted';
 if(event?.instance!==instance)return 'instance_mismatch';
 if(String(event?.event||'').toLowerCase().replaceAll('_','.')!=='messages.upsert')return 'event_type_unexpected';
 if(!event?.data?.key||event.data.key.fromMe!==false)return 'message_key_unaccepted';
 return 'message_unsupported_or_identity';
}
async function inbound(m){
 const now=new Date();
 // Never interpret stale retries as new consent or a fresh service window.
 const receivedAt=new Date(m.receivedAt);
 if(!Number.isFinite(receivedAt.getTime()) || receivedAt.getTime()<now.getTime()-23*3600000 || receivedAt.getTime()>now.getTime()+5*60000)return 'stale';
 if(infantReviewIntent(m.text)&&previewPermitted(m.phone,env)){
  return handleInfantReview(m,{db,env,now,flush,defer:work=>{
   setImmediate(()=>{void Promise.resolve().then(work).catch(()=>{ /* one durable reservation, no automatic retry */ });});
   return 'applied';
  }});
 }
 if((isQualityPreviewIntent(m.text)||isRecoveryPreviewIntent(m.text)||isKaiaRetestPreviewIntent(m.text))&&previewPermitted(m.phone,env)){
  return handleQualityPreviewInbound(m,{db,env,now,flush,defer:work=>{
   setImmediate(()=>{void Promise.resolve().then(work).catch(()=>{ /* single-attempt reservation remains safe */ });});
   return 'applied';
  }});
 }
 if(previewIntent(m.text)&&previewPermitted(m.phone,env)){
  return handlePreviewInbound(m,{db,env,now,flush,defer:work=>{
   // Persist and acknowledge the event first. The HTTP webhook must not wait
   // for a long reasoning-model call; failure state is kept in the family row.
   setImmediate(()=>{void Promise.resolve().then(work).catch(()=>{ /* recover via stale reservation retry */ });});
   return 'applied';
  }});
 }
 for(let attempt=0;attempt<3;attempt++){
  const row=await db.family(m.phone),state=row?.state||initialState();const day=dateOf(now);
  const output=processInbound(m.text,{state,today:day,now:now.toISOString()});
  const eventId=tokenKey('whatsapp:'+m.id);
  // Receive-only mode must not leave deferred replies that could be sent on a future switch.
  const jobs=isSessionMessagingReady(env)?output.messages.map((message,i)=>outboundFor(message,eventId,i,receivedAt)):[];
  try{const result=await db.commit(m.phone,row?.revision||0,eventId,output.state,jobs);return result.status;}catch(err){if(err.message!=='database_400'&&err.message!=='database_409'||attempt===2)throw err;}
 }
 return 'conflict';
}
async function flush(max=20){
 if(flushing)return {sent:0,skipped:'already_running'};
 if(!isSessionMessagingReady(env))return {sent:0,skipped:'send_disabled_or_provider_not_configured'};
 flushing=true;
 try {
 let sent=0,failed=0,cancelled=0,heldMarketing=0;
 // Replies take priority. A queue full of unapproved marketing jobs must not
 // prevent a parent from finishing the registration or opting out.
 const jobs=(await db.pending()).sort((a,b)=>(a.channel==='marketing')-(b.channel==='marketing')).slice(0,max);const now=new Date();
 const month=now.toISOString().slice(0,7)+'-01T00:00:00.000Z';
 const current=await db.sentThisMonth(month);
 let estimated=current.reduce((s,x)=>s+((env.CERCA_PROVIDER||'meta')==='twilio'?Number(x.channel==='marketing'?env.CERCA_TWILIO_ESTIMATED_TEMPLATE_USD||.20:env.CERCA_TWILIO_ESTIMATED_REPLY_USD||.10):(x.channel==='marketing'?Number(env.CERCA_PRICING_MARKETING_USD||.0618):.026)),0);
 const cap=Math.max(0,Number(env.CERCA_MONTHLY_CAP_USD||5));
 for(const job of jobs){
  if(job.channel==='marketing'&&!(isMessagingReady(env)&&(weeklyEnabled(env)||env.CERCA_TEST_REST_ADAPTER==='true'))){heldMarketing++;continue;}
  if(job.expires_at&&new Date(job.expires_at)<=now){await db.setCancelled(job.job_key);cancelled++;continue;}
  if(!isAllowedRecipient(job.wa_id,env)){await db.setCancelled(job.job_key);cancelled++;continue;}
  // Recheck live consent immediately before network delivery, including queued old jobs.
  const owner=await db.family(job.wa_id);
  const state=owner?.state;
  const optoutReceipt=job.channel==='service' && /^(Desactivamos los envíos|El perfil y los recuerdos se eliminaron|Entendido\. No te enviaremos)/.test(job.payload?.body||'');
  if(!state || (state.deleted && !optoutReceipt) || (state.status!=='active' && !((state.status==='pending'||state.status==='onboarding')&&job.channel==='service') && !(state.status==='stopped' && optoutReceipt))){
   await db.setCancelled(job.job_key);cancelled++;continue;
  }
  const forecast=(env.CERCA_PROVIDER||'meta')==='twilio'?Number(job.channel==='marketing'?env.CERCA_TWILIO_ESTIMATED_TEMPLATE_USD||.20:env.CERCA_TWILIO_ESTIMATED_REPLY_USD||.10):(job.channel==='marketing'?Number(env.CERCA_PRICING_MARKETING_USD||.0618):.026);
  if(estimated+forecast>cap)break;
  try{const providerId=(env.CERCA_PROVIDER||'meta')==='twilio'?await sendTwilio(job.payload,job.wa_id):(env.CERCA_PROVIDER==='evolution'?await sendEvolution(job.payload,job.wa_id):env.CERCA_PROVIDER==='whapi'?await sendWhapi(job.payload,job.wa_id):await sendMeta(job.payload,job.wa_id));await db.setSent(job.job_key,providerId);sent++;estimated+=forecast;}
  catch(error){console.warn('huella_outbound_failed',JSON.stringify({provider:env.CERCA_PROVIDER||'meta',reason:classifyOutboundFailure(error),attempt:job.attempts+1}));await db.retry(job.job_key,job.attempts);failed++;}
 }
 return {sent,failed,cancelled,heldMarketing,estimatedUSD:Number(estimated.toFixed(3)),budgetUSD:cap};
 } finally {flushing=false;}
}
async function dispatch(){
 if(!db.available())return {status:'pending_database'};
 const canSchedule=isMessagingReady(env);
 let scheduled=0,blocked=0;
 if(weeklyEnabled(env)){
  const rows=await db.activeFamilies();
  // HUELLA's first month is strictly one pre-authorized household.
  for(const family of rows.filter(f=>isAllowedRecipient(f.wa_id,env)).slice(0,1)){
   try{
    const p=await prepareWeeklyDispatch(family.state,family.wa_id,new Date(),{env});
    if(!p)continue;
    const result=await db.commit(family.wa_id,family.revision,p.eventId,p.updated,p.jobs);
    if(p.generationBlocked)blocked++;
    else if(result.status==='applied')scheduled++;
   }catch{blocked++;}
  }
 } else if(canSchedule&&env.CERCA_TEST_REST_ADAPTER==='true'){
  // Historical daily scheduler is retained ONLY for self-contained fake REST tests.
  const max=Math.min(100,Math.max(1,Number(env.CERCA_DAILY_MAX_FAMILIES||10)));
  const rows=await db.activeFamilies();
  for(const family of rows.slice(0,max)){
   const twilio=(env.CERCA_PROVIDER||'meta')==='twilio';
   const daily=twilio?env.TWILIO_CONTENT_SID_DAILY:(env.CERCA_PROVIDER==='evolution'?env.EVOLUTION_TEMPLATE_DAILY:env.META_TEMPLATE_DAILY);
   const weekly=twilio?env.TWILIO_CONTENT_SID_WEEKLY:(env.CERCA_PROVIDER==='evolution'?env.EVOLUTION_TEMPLATE_WEEKLY:env.META_TEMPLATE_WEEKLY);
   const now=new Date(),p=await prepareDay(family.state,now,{templateDaily:daily,templateWeekly:weekly});
   if(!p)continue;
   const jobs=scheduledOutbox(family.wa_id,p.batch,{weekly:p.weekly,templateDaily:daily,templateWeekly:weekly});
   if(!jobs.length){blocked++;continue;}
   try{const r=await db.commit(family.wa_id,family.revision,tokenKey(`daily:${family.wa_id}:${p.batch.day}`),p.updated,jobs);if(r.status==='applied')scheduled++;}catch{blocked++;}
  }
 }
 return {scheduled,blocked,ready:weeklyEnabled(env)||(canSchedule&&env.CERCA_TEST_REST_ADAPTER==='true'),...await flush()};
}
async function handle(req,res){
 const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
 if(req.method==='GET'&&url.pathname==='/healthz'){
  let database=db.available()?'configured_unverified':'pending', databaseIssue=null;
  if(db.available()&&typeof db.ping==='function'){
    try{await db.ping();database='ready';}catch(error){database='unreachable';databaseIssue=classifyDbFailure(error);}
  }
  return json(res,200,{service:'HUELLA-WhatsApp',version:'0.6.1',database,...(databaseIssue?{databaseIssue}:{}),provider:(env.CERCA_PROVIDER||'meta'),messaging:isSessionMessagingReady(env)?'session_ready':'pending',scheduledTemplates:isMessagingReady(env)?'approved':'disabled',weeklyPilot:weeklyEnabled(env)?'ready':'disabled',privatePreview:env.HUELLA_PREVIEW_ENABLED==='true'?'enabled':'disabled',ai:{configured:Boolean(env.OPENAI_API_KEY),model:contentModel(env),reasoning:'high'},inbound:inboundPolicy(env),clientInterface:'whatsapp-only'});
 }
 if(url.pathname==='/webhooks/evolution'&&req.method==='POST'){
  if(env.CERCA_PROVIDER!=='evolution')return fixed(res,404,'Not Found');
  if(!validateEvolutionWebhook(req.headers['x-cerca-bridge-secret'],env.CERCA_BRIDGE_WEBHOOK_SECRET))return fixed(res,403,'Forbidden');
  if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return fixed(res,415,'Unsupported Media Type');
  if(!db.available())return json(res,503,{error:'database_unavailable'});
  const raw=await read(req);
  let event;try{event=JSON.parse(raw.toString('utf8'));}catch{return json(res,400,{error:'invalid_json'});}
  const message=extractEvolutionMessage(event,{instance:env.EVOLUTION_INSTANCE});
  const accepted=Boolean(message&&isAllowedInboundRecipient(message.phone,env));
  // Minimal inbound diagnostics: fixed categories only. NEVER log sender, body,
  // raw webhook payload, message ID or credentials.
  const inboundReason=classifyEvolutionInbound(event,message,accepted,env.EVOLUTION_INSTANCE);
  console.info('huella_evolution_webhook',JSON.stringify({result:inboundReason}));
  if(accepted){await inbound(message);try{await flush(5);}catch{}}
  return json(res,200,{received:accepted?1:0});
 }
 // Private, mobile-friendly QR view. The adult customer never accesses this route.
 if(url.pathname==='/internal/bridge'&&req.method==='GET'){
  if(env.CERCA_PROVIDER!=='evolution'||String(env.CERCA_OPERATOR_PASSWORD||'').length<32)return fixed(res,404,'Not Found');
  const expected='Basic '+Buffer.from('cerca-admin:'+env.CERCA_OPERATOR_PASSWORD).toString('base64');
  const incoming=String(req.headers.authorization||'');
  if(!sameSecret(incoming,expected)){
   res.writeHead(401,{'www-authenticate':'Basic realm="HUELLA Bridge"','cache-control':'no-store'});return res.end('Unauthorized');
  }
  let qr=null,qrIssue='';try{qr=await fetchEvolutionQr();if(!qr)qrIssue='qr_ausente_o_formato_invalido';}catch(error){qrIssue=classifyEvolutionQrError(error);}
  const nonce=randomBytes(16).toString('base64');
  const html='<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>HUELLA Bridge</title><style>body{font:18px system-ui;background:#f7faf8;color:#1b352b;margin:0;padding:26px}main{max-width:430px;margin:auto;text-align:center}img{width:min(100%,300px);height:auto;border:1px solid #ddd}p{line-height:1.45}input,button{font:inherit;padding:10px;margin:5px}code{font-size:30px}</style><main><h1>HUELLA Bridge</h1>'+(qr?'<p>Escaneá este QR desde WhatsApp → Dispositivos vinculados</p><img alt="QR de vinculación" src="'+qr+'">':'<p>QR no disponible. Diagnóstico: <strong>'+qrIssue+'</strong>.</p>')+'<p>¿Solo tenés un celular? Solicitá un código de vinculación.</p><form id="pair"><input aria-label="Teléfono en formato internacional" type="tel" id="phone" required placeholder="5492210000000" pattern="[0-9]{8,15}"><button type="submit">Generar código</button></form><p id="result" role="status"></p><p>Panel privado del operador. Los clientes usan solo WhatsApp.</p></main><script nonce="'+nonce+'">document.getElementById("pair").addEventListener("submit",async e=>{e.preventDefault();const el=document.getElementById("result");el.textContent="Consultando…";try{const r=await fetch("/internal/bridge/pair",{method:"POST",headers:{"content-type":"application/json","x-cerca-admin":"1"},body:JSON.stringify({number:document.getElementById("phone").value})});const d=await r.json();el.textContent=r.ok&&d.code?"Código: "+d.code:"No hay código disponible; revisá la conexión";}catch{el.textContent="Servidor no disponible";}})</script></html>';
  res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':`default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,'referrer-policy':'no-referrer'});return res.end(html);

 }
 if(url.pathname==='/internal/bridge/pair'&&req.method==='POST'){
  if(env.CERCA_PROVIDER!=='evolution'||String(env.CERCA_OPERATOR_PASSWORD||'').length<32)return fixed(res,404,'Not Found');
  const expected='Basic '+Buffer.from('cerca-admin:'+env.CERCA_OPERATOR_PASSWORD).toString('base64');
  if(!sameSecret(String(req.headers.authorization||''),expected))return fixed(res,401,'Unauthorized');
  if(req.headers['x-cerca-admin']!=='1'||!String(req.headers['content-type']||'').startsWith('application/json'))return fixed(res,403,'Forbidden');
  if(req.headers.origin && req.headers.origin!=='https://cerca-piloto.onrender.com')return fixed(res,403,'Forbidden');
  let data;try{data=JSON.parse((await read(req)).toString('utf8'));}catch{return json(res,400,{error:'invalid_json'});}
  if(typeof data?.number!=='string'||!/^\d{8,15}$/.test(data.number))return json(res,400,{error:'invalid_phone'});
  let code=null;try{code=await fetchEvolutionPairingCode(data.number);}catch{return json(res,503,{error:'bridge_unavailable'});}
  return json(res,code?200:503,code?{code}:{error:'pairing_unavailable'});
 }
 // Only an authenticated Whapi sandbox channel can reach HUELLA's inbound flow.
 // The operator configures X-Whapi-Secret on the Whapi channel (separate
 // from the Bearer API token); no access based on public URLs or IP addresses.
 if(url.pathname==='/webhooks/whapi'&&req.method==='POST'){
  if(env.CERCA_PROVIDER!=='whapi')return fixed(res,404,'Not Found');
  if(!validateWhapiWebhook(req.headers['x-whapi-secret'],env.WHAPI_WEBHOOK_SECRET))return fixed(res,403,'Forbidden');
  if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return fixed(res,415,'Unsupported Media Type');
  if(!db.available())return json(res,503,{error:'database_unavailable'});
  let payload;try{payload=JSON.parse((await read(req)).toString('utf8'));}catch{return json(res,400,{error:'invalid_json'});}
  for(const st of extractWhapiStatuses(payload,{channelId:env.WHAPI_CHANNEL_ID})){
   try{await db.setDelivery(st.messageId,st.status);}catch{/* idempotent callback can be replayed */ }
  }
  const parsed=extractWhapiMessages(payload,{channelId:env.WHAPI_CHANNEL_ID});
  const messages=parsed.filter(m=>isAllowedInboundRecipient(m.phone,env));
  console.info('huella_whapi_webhook',JSON.stringify({
   result:payload?.channel_id!==env.WHAPI_CHANNEL_ID?'channel_mismatch':messages.length?'accepted':parsed.length?'not_allowlisted':'no_eligible_messages',
   count:messages.length
  }));
  for(const m of messages)await inbound(m);
  // Whapi retries on non-200/slow callbacks. Acknowledge after durable DB commit,
  // then drain the outbox without holding the provider HTTP request open.
  if(messages.length)setImmediate(()=>{
   void flush(Math.min(20,messages.length*3)).catch(()=>console.warn('huella_whapi_flush_failed'));
  });
  return json(res,200,{received:messages.length});
 }
 // Twilio Sandbox uses signed form-urlencoded POSTs and an empty TwiML acknowledgement.
 // A fixed public HTTPS URL is used for signature verification, never the Host header.
 if(url.pathname==='/webhooks/twilio'&&req.method==='POST'){
  if((env.CERCA_PROVIDER||'meta')!=='twilio')return fixed(res,404,'Not Found');
  const raw=await read(req);
  if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/x-www-form-urlencoded'))return fixed(res,415,'Unsupported Media Type');
  let fields;try{fields=parseTwilioForm(raw);}catch{return fixed(res,400,'Invalid form');}
  if(!validateTwilioSignature(env.TWILIO_WEBHOOK_URL,fields,req.headers['x-twilio-signature'],env.TWILIO_AUTH_TOKEN))return fixed(res,403,'Forbidden');
  if(!db.available())return fixed(res,503,'Database unavailable');
  const message=extractTwilioMessage(fields,{accountSid:env.TWILIO_ACCOUNT_SID,fromNumber:env.TWILIO_WHATSAPP_FROM});
  if(message&&isAllowedInboundRecipient(message.phone,env)){
   await inbound(message);
   try{await flush(5);}catch{} // Stored outbox remains retryable if sending fails.
  }
  res.writeHead(200,{'content-type':'application/xml; charset=utf-8','cache-control':'no-store'});
  return res.end('<?xml version="1.0" encoding="UTF-8"?><Response/>');
 }
 if(url.pathname==='/webhooks/twilio/status'&&req.method==='POST'){
  if((env.CERCA_PROVIDER||'meta')!=='twilio')return fixed(res,404,'Not Found');
  const raw=await read(req);
  if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/x-www-form-urlencoded'))return fixed(res,415,'Unsupported Media Type');
  let fields;try{fields=parseTwilioForm(raw);}catch{return fixed(res,400,'Invalid form');}
  if(!validateTwilioSignature(env.TWILIO_STATUS_WEBHOOK_URL,fields,req.headers['x-twilio-signature'],env.TWILIO_AUTH_TOKEN))return fixed(res,403,'Forbidden');
  if(!db.available())return fixed(res,503,'Database unavailable');
  const status=extractTwilioStatus(fields,{accountSid:env.TWILIO_ACCOUNT_SID});
  if(status)await db.setDelivery(status.messageId,status.status);
  res.writeHead(200,{'content-type':'application/xml; charset=utf-8','cache-control':'no-store'});
  return res.end('<?xml version="1.0" encoding="UTF-8"?><Response/>');
 }
 if(url.pathname==='/webhooks/whatsapp'&&req.method==='GET'){
  if((env.CERCA_PROVIDER||'meta')!=='meta')return fixed(res,404,'Not Found');
  if(url.searchParams.get('hub.mode')==='subscribe'&&env.META_VERIFY_TOKEN&&url.searchParams.get('hub.verify_token')===env.META_VERIFY_TOKEN)return fixed(res,200,url.searchParams.get('hub.challenge')||'');
  return fixed(res,403,'Forbidden');
 }
 if(url.pathname==='/webhooks/whatsapp'&&req.method==='POST'){
  if((env.CERCA_PROVIDER||'meta')!=='meta')return fixed(res,404,'Not Found');
  const raw=await read(req);
  if(!validSignature(raw,req.headers['x-hub-signature-256'],env.META_APP_SECRET))return fixed(res,403,'Forbidden');
  if(!db.available())return json(res,503,{error:'database_unavailable'});
  const payload=JSON.parse(raw.toString('utf8'));
  for(const receipt of extractStatuses(payload,{phoneNumberId:env.META_PHONE_NUMBER_ID})){try{await db.setDelivery(receipt.messageId,receipt.status);}catch{/* Retry is driven by Meta; do not leak message data. */}}
  const messages=extractMessages(payload,{phoneNumberId:env.META_PHONE_NUMBER_ID}).filter(msg=>isAllowedInboundRecipient(msg.phone,env));
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
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href){
 start();
 // Independent connectivity probe: a healthy database/webhook cannot prove
 // that outbound HTTPS to the local Evolution API works.
 const diagnosis=setTimeout(()=>{
  if(env.CERCA_PROVIDER==='evolution')void probeEvolutionTransport({env})
   .then(status=>console.info('huella_bridge_connectivity',JSON.stringify({state:status})))
   .catch(()=>console.info('huella_bridge_connectivity',JSON.stringify({state:'unknown'})));
 },1000);
 diagnosis.unref?.();
 // Render free instances can sleep. A WhatsApp webhook may persist the reply
 // but its synchronous transport attempt can fail. Recover existing consented,
 // nonexpired, allowlisted outbox messages after cold start/redeploy. The database
 // bounds attempts and this calls no AI nor activates scheduled missions.
 const kickoff=setTimeout(()=>{
  void flush(5).then(result=>{
   console.info('huella_outbox_startup_recovery',JSON.stringify({
    sent:result.sent||0,failed:result.failed||0,skipped:result.skipped||'none'
   }));
  }).catch(()=>console.warn('huella_outbox_startup_recovery_failed'));
 },2000);
 kickoff.unref?.();
}