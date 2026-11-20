/** HUELLA's WhatsApp transport -> TurnoVivo operator-only adapter.
 * No family info, WhatsApp client messages, or HUELLA calendar state is transferred.
 * Use only after validating X-Whapi-Secret on HUELLA webhook.
 * Text/audio is forwarded ONLY if +E164 sender uniquely registered in TurnoVivo.
 */
import {sendWhapi} from './whapi.mjs';
const ENDPOINT='https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/turnovivo-whatsapp-bridge';
const numeric=/^[1-9][0-9]{7,14}$/;
const validId=/^[A-Za-z0-9_.:-]{6,180}$/;
const mediaId=/^[A-Za-z0-9_.:-]{8,180}$/;
const rate=new Map();
export function extractTurnoVivoWhapi(payload,{channelId,now=new Date()}={}){
 if(!channelId||payload?.channel_id!==channelId||payload?.event?.type!=='messages'||payload?.event?.event!=='post')return [];
 if(!Array.isArray(payload?.messages)||payload.messages.length>20)return [];
 const rows=[];
 for(const m of payload.messages){
  if(m?.from_me!==false||!['text','voice','audio'].includes(m?.type))continue;
  const phone=String(m.from||''),chat=String(m.chat_id||'');
  if(!numeric.test(phone)||!validId.test(String(m.id||'')))continue;
  if(chat!==phone+'@s.whatsapp.net'&&!/^[0-9]{8,30}@lid$/.test(chat))continue;
  const t=Number(m.timestamp)*1000;
  if(!Number.isFinite(t)||t>now.getTime()+300000||t<now.getTime()-23*3600000)continue;
  const kind=m.type==='text'?'text':'audio';
  const body=kind==='text'?String(m.text?.body||'').trim().slice(0,1400):'';
  const meta=kind==='audio'?(m.voice||m.audio):null;
  const id=kind==='audio'?String(meta?.id||''):'';
  const size=Number(meta?.file_size);
  if(kind==='text'&&!body||kind==='audio'&&(!mediaId.test(id)||!Number.isSafeInteger(size)||size<100||size>4_000_000))continue;
  rows.push({message_id:`whapi:${channelId}:${m.id}`,from_phone:'+'+phone,numeric_phone:phone,message_type:kind,text:body,media_id:id,media_size:size,received_at:t});
 }
 return rows;
}
function allowed(phone){
 const now=Date.now();let v=rate.get(phone);
 if(!v||now-v.time>3600000)v={time:now,count:0,minute:now,minuteCount:0};
 if(now-v.minute>60000){v.minute=now;v.minuteCount=0;}
 if(v.count>=30||v.minuteCount>=5)return false;
 v.count++;v.minuteCount++;rate.set(phone,v);
 if(rate.size>2000)for(const [id,x] of rate)if(now-x.time>3600000)rate.delete(id);
 return true;
}
async function bridge(action,body,{env=process.env,fetcher=fetch,timeout=12000}={}){
 if(String(env.TURNOVIVO_BRIDGE_SECRET||'').length<40)throw Error('tv_bridge_not_configured');
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);timer.unref?.();
 try{
  const res=await fetcher(ENDPOINT+'?action='+encodeURIComponent(action),{
    method:'POST',headers:{'content-type':'application/json','x-turnovivo-bridge-secret':env.TURNOVIVO_BRIDGE_SECRET},
    body:JSON.stringify(body),signal:controller.signal
  });
  if(!res.ok)throw Error('tv_bridge_http_'+res.status);
  return await res.json();
 }finally{clearTimeout(timer);}
}
export async function isTurnoVivoOperator(phone,{env=process.env,fetcher=fetch}={}){
 if(env.TURNOVIVO_WHATSAPP_BRIDGE_ENABLED!=='true')return false;
 if(!/^\+[1-9][0-9]{7,14}$/.test(phone))return false;
 const status=await bridge('lookup',{from_phone:phone},{env,fetcher});
 return status.registered===true;
}
async function transcribeWhapiVoice(message,{env=process.env,fetcher=fetch}={}){
 if(!mediaId.test(message.media_id)||message.media_size>4_000_000)throw Error('tv_voice_invalid');
 const control=new AbortController();const timer=setTimeout(()=>control.abort(),25000);timer.unref?.();
 try{
  const media=await fetcher('https://gate.whapi.cloud/media/'+encodeURIComponent(message.media_id),{
   headers:{authorization:'Bearer '+env.WHAPI_TOKEN},signal:control.signal
  });
  if(!media.ok)throw Error('tv_media_http_'+media.status);
  const n=Number(media.headers.get('content-length')||0);
  if(n>4_000_000)throw Error('tv_voice_too_big');
  const data=await media.arrayBuffer();if(data.byteLength<100||data.byteLength>4_000_000)throw Error('tv_voice_size');
  const form=new FormData();form.append('file',new Blob([data],{type:'audio/ogg'}),'turnovivo.ogg');
  form.append('model','gpt-4o-mini-transcribe');form.append('language','es');
  const ai=await fetcher('https://api.openai.com/v1/audio/transcriptions',{
   method:'POST',headers:{authorization:'Bearer '+env.OPENAI_API_KEY},body:form,signal:control.signal
  });
  if(!ai.ok)throw Error('tv_transcribe_http_'+ai.status);
  const json=await ai.json();const text=String(json?.text||'').trim().slice(0,1400);
  if(!text)throw Error('tv_transcribe_empty');return text;
 }finally{clearTimeout(timer);}
}
/** Durable ingest happens synchronously before Whapi's HTTP ack. Audio is processed after ack. */
export async function receiveTurnoVivoMessage(message,{env=process.env,fetcher=fetch}={}){
 if(!allowed(message.from_phone))return {accepted:false,reason:'rate_limited'};
 const result=await bridge('ingest',{
   from_phone:message.from_phone,message_id:message.message_id,
   message_type:message.message_type,media_id:message.media_id,text:message.text
 },{env,fetcher});
 return {accepted:result.accepted===true,new_message:result.new_message===true};
}
/** Calls may take up to 85s; call from a detached async worker, not from Whapi request handler. */
export async function completeTurnoVivoMessage(message,{env=process.env,fetcher=fetch,send=sendWhapi}={}){
 if(env.TURNOVIVO_WHATSAPP_BRIDGE_ENABLED!=='true')return {processed:false,reason:'disabled'};
 if(message.message_type==='audio'){
   const text=await transcribeWhapiVoice(message,{env,fetcher});
   await bridge('transcribed',{message_id:message.message_id,text},{env,fetcher});
 }
 const processed=await bridge('process',{message_id:message.message_id},{env,fetcher,timeout:100000});
 // Only reply to the already authorized merchant, never to a customer, and never to HUELLA family recipients.
 if(processed.processed===true&&processed.reply&&env.TURNOVIVO_OPERATOR_REPLIES_ENABLED==='true'){
   const providerId=await send({body:String(processed.reply).slice(0,1250)},message.numeric_phone,{env,fetcher});
   if(providerId)await bridge('ack',{message_id:message.message_id,provider_message_id:String(providerId)},{env,fetcher});
 }
 return {processed:processed.processed===true,responded:processed.processed===true&&env.TURNOVIVO_OPERATOR_REPLIES_ENABLED==='true'};
}