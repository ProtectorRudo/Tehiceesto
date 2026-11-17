import {makePgDb} from './db_pg.mjs';
/** Exclusive Supabase REST adapter using backend-only service-role credentials. */
const asQuery=v=>encodeURIComponent(v);
export function makeDb(env=process.env,fetcher=fetch){
 if(env.CERCA_DATABASE_URL||(env.CERCA_DB_HOST&&env.CERCA_DB_PASSWORD&&env.CERCA_DB_PROJECT_REF))return makePgDb(env);
 if(env.CERCA_TEST_REST_ADAPTER!=='true')return {available:()=>false};
 const root=(env.SUPABASE_URL||'').replace(/\/$/,'');const key=env.SUPABASE_SERVICE_ROLE_KEY;
 const available=()=>!!(root&&key);
 async function req(path,{method='GET',body,prefer}={}){
  if(!available())throw new Error('supabase_not_configured');
  const response=await fetcher(`${root}/rest/v1/${path}`,{method,headers:{apikey:key,authorization:`Bearer ${key}`,'content-type':'application/json',...(prefer?{Prefer:prefer}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  if(!response.ok)throw new Error(`database_${response.status}`);
  const s=await response.text();return s?JSON.parse(s):null;
 }
 return {
  available,
  async family(phone){const rows=await req(`cerca_families?wa_id=eq.${asQuery(phone)}&select=id,revision,state&limit=1`);return rows?.[0]||null;},
  async activeFamilies(){return (await req('cerca_families?select=id,wa_id,revision,state&limit=500'))?.filter(f=>f.state?.status==='active')||[];},
  async commit(phone,revision,eventId,state,outbox){return req('rpc/cerca_commit',{method:'POST',body:{p_wa_id:phone,p_expected_revision:revision,p_event_id:eventId,p_state:state,p_outbox:outbox}});},
  async pending(){return await req('cerca_outbox?status=eq.pending&attempts=lt.3&select=job_key,wa_id,payload,channel,expires_at,attempts&order=channel.desc,created_at.asc&limit=100')||[];},
  async setSent(key,providerId){await req(`cerca_outbox?job_key=eq.${asQuery(key)}`,{method:'PATCH',body:{status:'sent',provider_message_id:String(providerId||'').slice(0,256),sent_at:new Date().toISOString()}});},
  async setDelivery(messageId,status){await req(`cerca_outbox?provider_message_id=eq.${asQuery(messageId)}`,{method:'PATCH',body:{delivery_status:status}});},
  async setCancelled(key){await req(`cerca_outbox?job_key=eq.${asQuery(key)}`,{method:'PATCH',body:{status:'cancelled'}});},
  async retry(key,attempts){await req(`cerca_outbox?job_key=eq.${asQuery(key)}`,{method:'PATCH',body:{attempts:attempts+1}});},
  async sentThisMonth(start){return await req(`cerca_outbox?status=eq.sent&sent_at=gte.${asQuery(start)}&select=channel&limit=20000`)||[];}
 };
}