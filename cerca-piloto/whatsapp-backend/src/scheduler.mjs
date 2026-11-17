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
 const jobs=parts.map((part,i)=>({key:tokenKey(`daily:${phone}:${batch.day}:${i}`),channel:'marketing',payload:{kind:'template',name:templateDaily,params:[part.name,part.body]},expires_at:null}));
 if(weekly&&templateWeekly)jobs.push({key:tokenKey(`weekly:${phone}:${batch.day}`),channel:'marketing',payload:{kind:'template',name:templateWeekly,params:[batch.weekly.title,`${batch.weekly.how} ${batch.weekly.why}`]},expires_at:null});
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
 return !!(env.META_ACCESS_TOKEN&&env.META_PHONE_NUMBER_ID&&env.META_APP_SECRET&&env.META_VERIFY_TOKEN);
}
export function isMessagingReady(env=process.env){
 if(!isSessionMessagingReady(env))return false;
 // Explicit go-live gate: Meta must approve both templates before any real outbound.
 if(env.CERCA_TEMPLATES_APPROVED!=='true')return false;
 return !!(env.META_ACCESS_TOKEN&&env.META_PHONE_NUMBER_ID&&env.META_TEMPLATE_DAILY&&env.META_TEMPLATE_WEEKLY&&env.META_APP_SECRET&&env.META_VERIFY_TOKEN);}