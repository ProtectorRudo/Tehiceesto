import {createHash} from 'node:crypto';
import {generateBatch,splitDailyForTemplate} from './missions.mjs';
export const tokenKey=v=>createHash('sha256').update(String(v)).digest('hex');
export function localClock(when=new Date(),timezone='America/Argentina/Buenos_Aires'){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(when);
 const d=Object.fromEntries(parts.map(x=>[x.type,x.value]));return {day:`${d.year}-${d.month}-${d.day}`,time:`${d.hour}:${d.minute}`,weekday:d.weekday};
}
export function scheduledOutbox(phone,batch,{weekly=false,templateDaily='',templateWeekly=''}={}){
 if(!templateDaily)return [];
 const parts=splitDailyForTemplate(batch);
 // A mission is relevant only on its local calendar day; never replay yesterday's plan.
 // CERCA's current pilot fixes the family timezone at America/Argentina/Buenos_Aires (UTC-3).
 const expiresAt=new Date(`${batch.day}T23:59:59-03:00`);
 if(!Number.isFinite(expiresAt.getTime()))throw new Error('invalid_mission_day');
 const expires_at=expiresAt.toISOString();
 const jobs=parts.map((part,i)=>({key:tokenKey(`daily:${phone}:${batch.day}:${i}`),channel:'marketing',payload:{kind:'template',name:templateDaily,params:[part.name,part.body]},expires_at}));
 if(weekly&&templateWeekly)jobs.push({key:tokenKey(`weekly:${phone}:${batch.day}`),channel:'marketing',payload:{kind:'template',name:templateWeekly,params:[batch.weekly.title,`${batch.weekly.how} ${batch.weekly.why}`]},expires_at});
 return jobs;
}
export async function prepareDay(state,now,{generate=generateBatch,templateDaily='',templateWeekly=''}={}){
 const clock=localClock(now,state.timezone||'America/Argentina/Buenos_Aires');
 if(state.status!=='active'||!state.consentAt||state.deleted||state.lastDailyDay===clock.day)return null;
 const hhmm=state.deliveryTime||'18:00';
 // Cron may run a few minutes late; only send within the user's selected hour.
 if(clock.time.slice(0,2)!==hhmm.slice(0,2)||Number(clock.time.slice(3))<Number(hhmm.slice(3)))return null;
 const day=clock.day;const batch=await generate(state,day);
 const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));const weekKey=d.toISOString().slice(0,10);
 // No registrar la misión familiar como enviada sin su plantilla aprobada.
 const weekly=Boolean(templateWeekly)&&state.lastWeeklyWeek!==weekKey;
 const updated=structuredClone(state);updated.lastDailyDay=day;if(weekly)updated.lastWeeklyWeek=weekKey;
 updated.history=[...(updated.history||[]),{...batch,weekly:weekly?batch.weekly:null}].slice(-30);
 return {updated,batch,weekly};
}
// Receiving a consented test message is independent of permission to send replies.
export function inboundPolicy(env=process.env){
 const mode=env.CERCA_SEND_MODE||'disabled';
 if(mode==='production')return env.CERCA_PRODUCTION_AUTHORIZED==='true'?'production':'blocked';
 if(mode!=='test' && mode!=='disabled')return 'blocked';
 return String(env.CERCA_TEST_WA_IDS||'').split(',').some(x=>/^[1-9]\d{7,14}$/.test(x.trim()))?'test_allowlist':'blocked';
}
export function isAllowedInboundRecipient(phone,env=process.env){
 const policy=inboundPolicy(env);
 if(policy==='production')return true;
 if(policy!=='test_allowlist')return false;
 return String(env.CERCA_TEST_WA_IDS||'').split(',').map(x=>x.trim()).includes(String(phone));
}
export function isAllowedRecipient(phone,env=process.env){
 const mode=env.CERCA_SEND_MODE||'disabled';
 if(mode==='production')return env.CERCA_PRODUCTION_AUTHORIZED==='true';
 if(mode!=='test')return false;
 return String(env.CERCA_TEST_WA_IDS||'').split(',').map(x=>x.trim()).filter(Boolean).includes(String(phone));
}
// Only user-initiated, 24-hour customer-service replies. This gate never authorizes
// scheduled marketing templates; those require the independent approval gate below.
export function isSessionMessagingReady(env=process.env){
 const mode=env.CERCA_SEND_MODE||'disabled';
 if(!['test','production'].includes(mode))return false;
 if(mode==='production'&&env.CERCA_PRODUCTION_AUTHORIZED!=='true')return false;
 if(mode==='test'&&!String(env.CERCA_TEST_WA_IDS||'').trim())return false;
 if(env.CERCA_PROVIDER==='evolution')return !!(env.EVOLUTION_API_URL&&env.EVOLUTION_API_KEY&&env.EVOLUTION_INSTANCE&&String(env.CERCA_BRIDGE_WEBHOOK_SECRET||'').length>=32);
 if(env.CERCA_PROVIDER==='whapi')return !!(String(env.WHAPI_TOKEN||'').length>=20&&String(env.WHAPI_WEBHOOK_SECRET||'').length>=32&&/^[A-Za-z0-9_-]{3,80}$/.test(env.WHAPI_CHANNEL_ID||''));
 if((env.CERCA_PROVIDER||'meta')==='twilio')return /^AC[0-9a-f]{32}$/i.test(env.TWILIO_ACCOUNT_SID||'') && !!env.TWILIO_AUTH_TOKEN && /^whatsapp:\+[1-9]\d{7,14}$/.test(env.TWILIO_WHATSAPP_FROM||'') && /^https:\/\//.test(env.TWILIO_WEBHOOK_URL||'');
 return !!(env.META_ACCESS_TOKEN&&env.META_PHONE_NUMBER_ID&&env.META_APP_SECRET&&env.META_VERIFY_TOKEN);
}
export function isMessagingReady(env=process.env){
 if(!isSessionMessagingReady(env))return false;
 // Whapi's explicitly authorized short solo pilot is the only exception to
 // the default no-scheduled-messages rule. Never enable on a public account.
 if(env.CERCA_PROVIDER==='whapi'){
  const start=String(env.HUELLA_WHAPI_PILOT_START_DAY||''),end=String(env.HUELLA_WHAPI_PILOT_END_DAY||'');
  const valid=/^\d{4}-\d{2}-\d{2}$/;
  return env.HUELLA_WHAPI_SCHEDULED_ALLOWED==='true' &&
    env.HUELLA_WEEKLY_V2_ENABLED==='true'&&env.HUELLA_SOLO_PILOT_ENABLED==='true'&&
    valid.test(start)&&valid.test(end)&&start<=end&&
    (new Date(end+'T12:00:00Z')-new Date(start+'T12:00:00Z'))<=7*86400000&&
    String(env.CERCA_TEST_WA_IDS||'').split(',').filter(Boolean).length===1;
 }
 // Explicit go-live gate: Meta must approve both templates before any real outbound.
 if(env.CERCA_PROVIDER!=='evolution'&&env.CERCA_TEMPLATES_APPROVED!=='true')return false;
 if(env.CERCA_PROVIDER==='evolution')return env.CERCA_EVOLUTION_SCHEDULED_ALLOWED==='true'&&!!env.EVOLUTION_TEMPLATE_DAILY&&!!env.EVOLUTION_TEMPLATE_WEEKLY;
 if((env.CERCA_PROVIDER||'meta')==='twilio')return /^HX[0-9a-f]{32}$/i.test(env.TWILIO_CONTENT_SID_DAILY||'')&&/^HX[0-9a-f]{32}$/i.test(env.TWILIO_CONTENT_SID_WEEKLY||'');
 return !!(env.META_ACCESS_TOKEN&&env.META_PHONE_NUMBER_ID&&env.META_TEMPLATE_DAILY&&env.META_TEMPLATE_WEEKLY&&env.META_APP_SECRET&&env.META_VERIFY_TOKEN);}