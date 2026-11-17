import test from 'node:test';import assert from 'node:assert/strict';import {createHmac} from 'node:crypto';
import {localClock} from '../src/scheduler.mjs';

test('real HTTP routes + simulated Supabase + simulated Meta complete WhatsApp onboarding and daily delivery',async()=>{
 const oldEnv={};const env={SUPABASE_URL:'https://fake-cerca.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'fake-test-only',META_APP_SECRET:'local-secret',META_VERIFY_TOKEN:'local-verify',META_ACCESS_TOKEN:'local-token',META_PHONE_NUMBER_ID:'123456',META_TEMPLATE_DAILY:'approved_daily',META_TEMPLATE_WEEKLY:'approved_weekly',CRON_SECRET:'local-cron-secret',PORT:'0',OPENAI_API_KEY:'',CERCA_MONTHLY_CAP_USD:'10',CERCA_SEND_MODE:'test',CERCA_TEST_WA_IDS:'5492211234567'};
 for(const [key,value] of Object.entries(env)){oldEnv[key]=process.env[key];process.env[key]=value;}
 const native=globalThis.fetch;let row=null;const receipts=new Set();const outbox=new Map();const sent=[];
 globalThis.fetch=async(url,opts={})=>{
  const u=new URL(url);const path=u.pathname;
  const ok=(v)=>new Response(JSON.stringify(v),{status:200,headers:{'content-type':'application/json'}});
  if(u.hostname==='graph.facebook.com'){const p=JSON.parse(opts.body);sent.push(p);return ok({messages:[{id:'wamid.sent'+sent.length}]});}
  if(u.hostname!=='fake-cerca.supabase.co')throw Error('unexpected network '+u.hostname);
  if(path.endsWith('/rpc/cerca_commit')){
   const p=JSON.parse(opts.body);
   if(receipts.has(p.p_event_id))return ok({status:'duplicate',revision:row.revision});
   if(!row&&p.p_expected_revision!==0)return new Response('conflict',{status:409});
   if(row&&row.revision!==p.p_expected_revision)return new Response('conflict',{status:409});
   if(!row)row={id:'fake-id',wa_id:p.p_wa_id,revision:0,state:{}};
   row.revision++;row.state=p.p_state;receipts.add(p.p_event_id);
   if(row.state.status==='stopped')for(const v of outbox.values())if(v.status==='pending')v.status='cancelled';
   for(const j of p.p_outbox)if(!outbox.has(j.key))outbox.set(j.key,{job_key:j.key,wa_id:p.p_wa_id,payload:j.payload,channel:j.channel,attempts:0,status:'pending',expires_at:j.expires_at});
   return ok({status:'applied',revision:row.revision});
  }
  if(path.endsWith('/cerca_families')){
   if(u.searchParams.has('wa_id'))return ok(row?[row]:[]);
   return ok(row?[row]:[]);
  }
  if(path.endsWith('/cerca_outbox')){
   if(opts.method==='PATCH'){
    const key=u.searchParams.get('job_key')?.slice(3);const providerId=u.searchParams.get('provider_message_id')?.slice(3);
    const j=key?outbox.get(key):[...outbox.values()].find(j=>j.provider_message_id===providerId);
    if(!j)return ok(null);Object.assign(j,JSON.parse(opts.body));return ok(null);
   }
   if(u.searchParams.get('status')==='eq.sent')return ok([...outbox.values()].filter(j=>j.status==='sent').map(j=>({channel:j.channel})));
   return ok([...outbox.values()].filter(j=>j.status==='pending'));
  }
  throw Error('unexpected fake db '+path);
 };
 let server;
 try{
  const mod=await import('../src/server.mjs');server=mod.start();await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const verify=await native(base+'/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=local-verify&hub.challenge=ABC');assert.equal(await verify.text(),'ABC');
  const bad=await native(base+'/webhooks/whatsapp',{method:'POST',body:'{}'});assert.equal(bad.status,403);
  const send=async(text,i)=>{
   const payload=JSON.stringify({entry:[{changes:[{value:{messages:[{id:'wamid.'+i,from:'5492211234567',timestamp:String(Math.floor(Date.now()/1000)),type:'text',text:{body:text}}]}}]}]});
   const signature='sha256='+createHmac('sha256',env.META_APP_SECRET).update(payload).digest('hex');
   const r=await native(base+'/webhooks/whatsapp',{method:'POST',headers:{'x-hub-signature-256':signature,'content-type':'application/json'},body:payload});assert.equal(r.status,200);return r.json();
  };
  const clock=localClock(new Date());const time=clock.time.slice(0,2)+':00';
  const inputs=['hola','ACEPTO','Ana María','1','Leticia','9','dibujar, teatro','compartir más ratos de escucha','quiero hablar con calma y compartir más tiempo',time];
  for(const [i,input] of inputs.entries())await send(input,i);
  assert.equal(row.state.status,'active');assert.equal(row.state.children.length,1);assert.equal(sent.length,inputs.length);
  const duplicate=await send('hola',0);assert.equal(duplicate.received,1);assert.equal(sent.length,inputs.length);
  const now=localClock(new Date());if(Number(now.time.slice(3))<2){ /* cron runs in early minute, desired time is the hour */ }
  const r=await native(base+'/internal/dispatch',{method:'POST',headers:{authorization:'Bearer '+env.CRON_SECRET}});assert.equal(r.status,200);
  const outcome=await r.json();assert.equal(outcome.scheduled,1);assert.equal(row.state.history.length,1);
  const templates=sent.filter(x=>x.type==='template');assert.equal(templates.length,2); // daily + weekly
  assert.equal(row.state.history[0].children[0].missions.length,3);
  const delivery=JSON.stringify({entry:[{changes:[{value:{statuses:[{id:'wamid.sent'+sent.length,status:'delivered'}]}}]}]});
  const statusSig='sha256='+createHmac('sha256',env.META_APP_SECRET).update(delivery).digest('hex');
  const delivered=await native(base+'/webhooks/whatsapp',{method:'POST',headers:{'x-hub-signature-256':statusSig},body:delivery});
  assert.equal(delivered.status,200);
  assert.equal([...outbox.values()].filter(j=>j.delivery_status==='delivered').length,1);
  const r2=await native(base+'/internal/dispatch',{method:'POST',headers:{authorization:'Bearer '+env.CRON_SECRET}});assert.equal((await r2.json()).scheduled,0);
  await send('No sabés lo que me pasó con Leticia',99);assert.ok(sent.at(-1).text.body.includes('CERCA funciona'));
  await send('BAJA',100);assert.equal(row.state.status,'stopped');
  // Simulate a stale queued marketing job after opt-out; no network request is allowed.
  const prior=sent.length;
  outbox.set('stale-marketing-test',{job_key:'stale-marketing-test',wa_id:'5492211234567',payload:{kind:'template',name:'approved_daily',params:['Leticia','No se debe enviar']},channel:'marketing',attempts:0,status:'pending'});
  const afterStop=await native(base+'/internal/dispatch',{method:'POST',headers:{authorization:'Bearer '+env.CRON_SECRET}});
  assert.equal(afterStop.status,200);
  assert.equal(outbox.get('stale-marketing-test').status,'cancelled');assert.equal(sent.length,prior);
 }finally{if(server)await new Promise(r=>server.close(r));globalThis.fetch=native;for(const k of Object.keys(env)){if(oldEnv[k]===undefined)delete process.env[k];else process.env[k]=oldEnv[k];}}
});