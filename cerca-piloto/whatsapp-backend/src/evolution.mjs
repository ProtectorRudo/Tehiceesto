/** CERCA Bridge transport for an independently hosted Evolution API (Baileys channel).
 * Unofficial WhatsApp Web bridge: test numbers only until expressly enabled.
 * Webhook MUST carry a custom X-Cerca-Bridge-Secret header configured per instance.
 * No QR, auth keys or Evolution API keys appear in HTTP responses or logs.
 */
import {createHash,timingSafeEqual} from 'node:crypto';

const sha=v=>createHash('sha256').update(String(v)).digest();
const instancePattern=/^[a-zA-Z0-9_-]{3,48}$/;
const messageIdPattern=/^[a-zA-Z0-9_.:-]{6,180}$/;
const e164Digits=/^[1-9]\d{7,14}$/;

export function validateEvolutionWebhook(provided, expected) {
 if(typeof provided!=='string'||typeof expected!=='string'||expected.length<32)return false;
 return timingSafeEqual(sha(provided),sha(expected));
}

export function evolutionReady(env=process.env) {
 try {
  const url=new URL(env.EVOLUTION_API_URL||'');
  return url.protocol==='https:' && !url.username && !url.password && url.pathname==='/' &&
    !url.search && !url.hash && !!url.hostname &&
    instancePattern.test(env.EVOLUTION_INSTANCE||'') &&
    String(env.EVOLUTION_API_KEY||'').length>=20 &&
    String(env.CERCA_BRIDGE_WEBHOOK_SECRET||'').length>=32;
 } catch { return false; }
}

function timestampToIso(ts, now) {
 if(ts&&typeof ts==='object')ts=ts.low ?? ts.seconds ?? ts.toNumber?.();
 const num=Number(ts);
 if(!Number.isSafeInteger(num)||num<1200000000||num>9999999999)return null;
 const time=num*1000;
 if(time>now.getTime()+300000 || time<now.getTime()-23*3600000)return null;
 return new Date(time).toISOString();
}

function numberFromKey(key, sender) {
 const jid=String(key?.remoteJid||'');
 const alt=String(key?.remoteJidAlt||'');
 // New privacy JIDs (@lid) must be resolved only from a numeric alternate/sender
 // explicitly supplied by the authenticated Evolution webhook, never guessed.
 const authenticatedSender=String(sender||'');
 const chosen=jid.endsWith('@s.whatsapp.net')?jid:alt.endsWith('@s.whatsapp.net')?alt:
   (jid.endsWith('@lid')&&authenticatedSender.endsWith('@s.whatsapp.net')?authenticatedSender:'');
 const phone=chosen.slice(0,-'@s.whatsapp.net'.length);
 return e164Digits.test(phone)?phone:null;
}

function textFromMessage(message) {
 if(!message||typeof message!=='object')return null;
 let msg=message;
 for(let i=0;i<2;i++) {
  if(msg?.ephemeralMessage?.message)msg=msg.ephemeralMessage.message;
  else if(msg?.viewOnceMessage?.message)msg=msg.viewOnceMessage.message;
  else break;
 }
 const options=[
  msg.conversation,
  msg.extendedTextMessage?.text,
  msg.buttonsResponseMessage?.selectedButtonId,
  msg.buttonsResponseMessage?.selectedDisplayText,
  msg.listResponseMessage?.singleSelectReply?.selectedRowId,
  msg.templateButtonReplyMessage?.selectedId
 ];
 const body=options.find(x=>typeof x==='string'&&x.trim());
 return body&&body.length<=600?body.trim():null;
}

/** Only accepts a single-instance, one-to-one inbound text, without fromMe or groups. */
export function extractEvolutionMessage(payload,{instance,now=new Date()}={}) {
 if(!instancePattern.test(instance||'') || payload?.instance!==instance)return null;
 if(String(payload?.event||'').toLowerCase().replaceAll('_','.')!=='messages.upsert')return null;
 const data=payload.data;
 if(!data||typeof data!=='object'||Array.isArray(data))return null;
 const key=data.key;
 if(!key||key.fromMe!==false||!messageIdPattern.test(key.id||''))return null;
 const phone=numberFromKey(key,payload.sender);
 if(!phone)return null;
 const text=textFromMessage(data.message);
 if(!text)return null;
 const receivedAt=timestampToIso(data.messageTimestamp,now);
 if(!receivedAt)return null;
 return {id:`evolution:${instance}:${key.id}`,phone,text,receivedAt};
}

/** Evolution sendText response confirms request acceptance, not handset delivery. */
export async function sendEvolution(message,phone,{env=process.env,fetcher=fetch}={}) {
 if(!evolutionReady(env)||!e164Digits.test(String(phone)))throw new Error('evolution_not_configured');
 const origin=new URL(env.EVOLUTION_API_URL).origin;
 const path=`/message/sendText/${encodeURIComponent(env.EVOLUTION_INSTANCE)}`;
 let content;
 if(message?.kind==='template') {
  if(env.CERCA_EVOLUTION_SCHEDULED_ALLOWED!=='true')throw new Error('evolution_scheduled_disabled');
  const params=message.params||[];
  content=message.name===env.EVOLUTION_TEMPLATE_WEEKLY?
    `🏡 CERCA — Misión familiar\n${String(params[0]||'')}\n${String(params[1]||'')}`:
    `🌱 CERCA — ${String(params[0]||'')}\n${String(params[1]||'')}`;
 } else if(typeof message?.body==='string') {
  const options=Array.isArray(message.options)?message.options.slice(0,10):[];
  content=message.body+(options.length?'\n\nRespondé: '+options.map(String).join(' | '):'');
 } else throw new Error('evolution_invalid_message');
 content=content.trim().slice(0,4000);
 if(!content)throw new Error('evolution_empty_text');
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),8000);timeout.unref?.();
 try {
  const res=await fetcher(origin+path,{
   method:'POST',headers:{'apikey':env.EVOLUTION_API_KEY,'content-type':'application/json'},
   body:JSON.stringify({number:String(phone),text:content,linkPreview:false}),signal:controller.signal
  });
  if(!res.ok)throw new Error(`evolution_http_${res.status}`);
  const value=await res.json();
  const id=value?.key?.id || value?.data?.key?.id || value?.id;
  if(!messageIdPattern.test(id||''))throw new Error('evolution_missing_message_id');
  return String(id);
 } finally {clearTimeout(timeout);}
}

/** Owner-only QR from Evolution; keep images within the server. No public QR endpoint. */
export async function fetchEvolutionQr({env=process.env,fetcher=fetch}={}) {
 if(!evolutionReady(env))throw new Error('evolution_not_configured');
 const url=new URL(`/instance/connect/${encodeURIComponent(env.EVOLUTION_INSTANCE)}`,env.EVOLUTION_API_URL).toString();
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);timeout.unref?.();
 try {
  const response=await fetcher(url,{headers:{apikey:env.EVOLUTION_API_KEY},signal:controller.signal});
  if(!response.ok)throw new Error(`evolution_qr_http_${response.status}`);
  const data=await response.json();
  let b64=data?.base64||data?.qrcode?.base64||data?.qrcode?.qrBase64;
  if(typeof b64!=='string')return null;
  if(b64.startsWith('data:image/png;base64,'))b64=b64.slice(22);
  if(!/^[A-Za-z0-9+/=]{80,150000}$/.test(b64))return null;
  return `data:image/png;base64,${b64}`;
 } finally {clearTimeout(timeout);}
}

/** Pairing-code alternative for owners with a single phone; server-only credentials. */
export async function fetchEvolutionPairingCode(phone,{env=process.env,fetcher=fetch}={}) {
 if(!evolutionReady(env)||!e164Digits.test(String(phone)))throw new Error('evolution_pairing_not_configured');
 const target=new URL(`/instance/connect/${encodeURIComponent(env.EVOLUTION_INSTANCE)}`,env.EVOLUTION_API_URL);
 target.searchParams.set('number',String(phone));
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);timeout.unref?.();
 try {
  const response=await fetcher(target.toString(),{headers:{apikey:env.EVOLUTION_API_KEY},signal:controller.signal});
  if(!response.ok)throw new Error(`evolution_pairing_http_${response.status}`);
  const data=await response.json();
  const code=String(data?.pairingCode||data?.qrcode?.pairingCode||'').replaceAll(/[^0-9A-Z]/g,'');
  return /^[A-Z0-9]{6,12}$/.test(code)?code:null;
 } finally {clearTimeout(timeout);}
}