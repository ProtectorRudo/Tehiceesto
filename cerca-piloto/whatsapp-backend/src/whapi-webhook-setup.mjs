/** One-shot Whapi channel webhook setup, gated by HUELLA_WHAPI_SETUP=true.
 * Uses existing Render secrets; never exposes tokens, headers or settings.
 * Reads settings before any write; preserves unrelated webhook destinations
 * and existing documented default-backed settings across PATCH /settings.
 * Setup does NOT change CERCA_PROVIDER, send messages or start schedules.
 */
import {whapiReady} from './whapi.mjs';

const target='https://cerca-piloto.onrender.com/webhooks/whapi';
const events=Object.freeze([{type:'messages',method:'post'},{type:'statuses',method:'post'}]);
const preservedFields=[
 'pdo_sync','callback_backoff_delay_ms','max_callback_backoff_delay_ms',
 'callback_persist','offline_mode','full_history','auto_read_messages',
 'proxy_trust_filters'
];
function settingsBody(data){
 if(!data||typeof data!=='object'||Array.isArray(data))return null;
 const s=data.settings&&typeof data.settings==='object'&&!Array.isArray(data.settings)?data.settings:data;
 return Array.isArray(s.webhooks)&&s.webhooks.every(w=>w&&typeof w.url==='string')?s:null;
}
function hasRequiredEvents(w){
 return events.every(e=>Array.isArray(w.events)&&w.events.some(x=>x?.type===e.type&&x?.method===e.method));
}
export function buildWhapiWebhookSettings(current,secret){
 const settings=settingsBody(current);
 if(!settings||typeof secret!=='string'||secret.length<32)return null;
 if(settings.webhooks.length>10)return null;
 const matches=settings.webhooks.filter(x=>x.url===target);
 if(matches.length>1)return null; // Ambiguous duplicates: manual reconciliation.
 const chosen=matches[0];
 if(chosen?.mode==='body'&&hasRequiredEvents(chosen)&&chosen.headers?.['X-Whapi-Secret']===secret){
  return {status:'already_configured',payload:null};
 }
 const hook={...(chosen||{}),url:target,mode:'body',
  events:events.map(x=>({...x})),
  headers:{...(chosen?.headers&&typeof chosen.headers==='object'?chosen.headers:{}),'X-Whapi-Secret':secret}
 };
 const hooks=chosen?settings.webhooks.map(x=>x.url===target?hook:x):[...settings.webhooks,hook];
 const payload={webhooks:hooks};
 for(const field of preservedFields){
  if(Object.hasOwn(settings,field) && (
   typeof settings[field]==='boolean'||typeof settings[field]==='number'
  ))payload[field]=settings[field];
 }
 return {status:'update_needed',payload};
}
export async function configureWhapiWebhook({env=process.env,fetcher=fetch}={}){
 if(env.HUELLA_WHAPI_SETUP!=='true')return 'disabled';
 if(!whapiReady(env))return 'credentials_missing';
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),10000);timeout.unref?.();
 const headers={accept:'application/json',authorization:'Bearer '+env.WHAPI_TOKEN};
 const endpoint='https://gate.whapi.cloud/settings';
 try{
  const get=async()=>{
   const r=await fetcher(endpoint,{method:'GET',headers,signal:controller.signal});
   if(!r.ok)return {failure:'get_http_'+r.status};
   const result=await r.json();
   return {settings:result};
  };
  const initial=await get();
  if(initial.failure)return initial.failure;
  const intended=buildWhapiWebhookSettings(initial.settings,env.WHAPI_WEBHOOK_SECRET);
  if(!intended)return 'settings_unexpected';
  if(intended.status==='already_configured')return 'already_configured';
  const res=await fetcher(endpoint,{method:'PATCH',headers:{...headers,'content-type':'application/json'},
   body:JSON.stringify(intended.payload),signal:controller.signal});
  if(!res.ok)return 'patch_http_'+res.status;
  const verified=await get();
  if(verified.failure)return 'verification_unavailable';
  return buildWhapiWebhookSettings(verified.settings,env.WHAPI_WEBHOOK_SECRET)?.status==='already_configured'
   ?'configured':'verification_failed';
 }catch(err){
  if(err?.name==='AbortError'||controller.signal.aborted)return 'timeout';
  return 'transport_error';
 }finally{clearTimeout(timeout);}
}
