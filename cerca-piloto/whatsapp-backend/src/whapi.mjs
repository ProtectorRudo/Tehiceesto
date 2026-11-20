/** HUELLA private Whapi.Cloud sandbox transport.
 * WHAPI_TOKEN and WHAPI_WEBHOOK_SECRET are separate credentials.
 * Only allowlisted 1:1 text inbound; never import chats, groups or contact lists.
 */
import {createHash,timingSafeEqual} from 'node:crypto';

const phonePattern=/^[1-9]\d{7,14}$/;
const messagePattern=/^[A-Za-z0-9_.:-]{6,180}$/;
const channelPattern=/^[A-Za-z0-9_-]{3,80}$/;

export function whapiReady(env=process.env){
 return String(env.WHAPI_TOKEN||'').length>=20 &&
  String(env.WHAPI_WEBHOOK_SECRET||'').length>=32 &&
  channelPattern.test(String(env.WHAPI_CHANNEL_ID||''));
}

/** Validate the custom X-Whapi-Secret channel webhook header BEFORE reading a payload. */
export function validateWhapiWebhook(provided,expected){
 if(typeof provided!=='string'||typeof expected!=='string'||expected.length<32)return false;
 const a=createHash('sha256').update(provided).digest();
 const b=createHash('sha256').update(expected).digest();
 return timingSafeEqual(a,b);
}
function incomingPhone(m){
 if(m?.from_me!==false || m.type!=='text')return null;
 const from=String(m.from||'');
 const chat=String(m.chat_id||'');
 if(!phonePattern.test(from))return null;
 // Numeric chat IDs must agree with the sender. A WhatsApp privacy LID
 // is accepted only when Whapi itself includes a verified numeric `from`.
 if(chat!==from+'@s.whatsapp.net' && !/^[0-9]{8,30}@lid$/.test(chat))return null;
 return from;
}
/** Whapi sends messages.post payloads with an array, not one Evolution event. */
export function extractWhapiMessages(payload,{channelId,now=new Date()}={}){
 if(!channelPattern.test(String(channelId||'')) || payload?.channel_id!==channelId)return [];
 if(payload?.event?.type!=='messages'||payload?.event?.event!=='post')return [];
 if(!Array.isArray(payload?.messages)||payload.messages.length>20)return [];
 const found=[];
 for(const m of payload.messages){
  const phone=incomingPhone(m);
  const body=m?.text?.body;
  const stamp=Number(m?.timestamp);
  if(!phone||!messagePattern.test(String(m?.id||''))||typeof body!=='string'||!body.trim()||body.length>600)continue;
  if(!Number.isSafeInteger(stamp)||stamp<1200000000||stamp>9999999999)continue;
  const t=stamp*1000;
  if(t>now.getTime()+300000||t<now.getTime()-23*3600000)continue;
  found.push({id:'whapi:'+channelId+':'+m.id,phone,text:body.trim(),receivedAt:new Date(t).toISOString()});
 }
 return found;
}
export function extractWhapiStatuses(payload,{channelId}={}){
 if(!channelPattern.test(String(channelId||''))||payload?.channel_id!==channelId)return [];
 if(payload?.event?.type!=='statuses'||payload?.event?.event!=='post'||!Array.isArray(payload?.statuses))return [];
 const valid=new Set(['sent','delivered','read','failed']);
 return payload.statuses.filter(x=>x&&messagePattern.test(String(x.id||''))&&valid.has(x.status))
  .slice(0,20).map(x=>({messageId:x.id,status:x.status}));
}
export function formatWhapiText(msg){
 if(!msg||typeof msg.body!=='string'||msg.kind==='template')throw new Error('whapi_scheduled_disabled');
 const opts=Array.isArray(msg.options)?msg.options.slice(0,10):[];
 const body=(msg.body+(opts.length?'\n\nRespondé: '+opts.map(String).join(' | '):'')).trim().slice(0,4000);
 if(!body)throw new Error('whapi_invalid_message');
 return body;
}
/** Whapi /messages/text: HTTP success is gateway acceptance, not handset delivery. */
export async function sendWhapi(msg,phone,{env=process.env,fetcher=fetch}={}){
 if(!whapiReady(env)||!phonePattern.test(String(phone)))throw new Error('whapi_not_configured');
 const body=formatWhapiText(msg);
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),10000);timer.unref?.();
 try{
  const response=await fetcher('https://gate.whapi.cloud/messages/text',{
   method:'POST',
   headers:{authorization:'Bearer '+env.WHAPI_TOKEN,'content-type':'application/json'},
   body:JSON.stringify({to:String(phone),body,no_link_preview:true}),
   signal:controller.signal
  });
  if(!response.ok)throw new Error('whapi_http_'+response.status);
  const data=await response.json();
  const id=data?.message?.id;
  if(data?.sent===false||!messagePattern.test(String(id||'')))throw new Error('whapi_missing_message_id');
  return id;
 } finally{clearTimeout(timer);}
}
