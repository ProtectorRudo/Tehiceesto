import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';

test('verified Meta onboarding works in test mode before marketing templates are approved',async()=>{
 const env={CERCA_PROVIDER:'meta',CERCA_TEST_REST_ADAPTER:'true',SUPABASE_URL:'https://fake-session-cerca.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'fake-test-only',
  META_APP_SECRET:'private-test-app-secret',META_VERIFY_TOKEN:'private-test-verify',META_ACCESS_TOKEN:'private-test-token',
  META_PHONE_NUMBER_ID:'123456',CRON_SECRET:'private-test-cron',PORT:'0',OPENAI_API_KEY:'',
  CERCA_MONTHLY_CAP_USD:'10',CERCA_SEND_MODE:'test',CERCA_TEST_WA_IDS:'5492211234567',
  CERCA_TEMPLATES_APPROVED:'false',META_TEMPLATE_DAILY:'',META_TEMPLATE_WEEKLY:''};
 const previous=Object.fromEntries(Object.keys(env).map(key=>[key,process.env[key]]));
 for(const [key,value] of Object.entries(env))process.env[key]=value;
 const native=globalThis.fetch;let row=null;const outbox=new Map(),sent=[];
 const ok=(v)=>new Response(JSON.stringify(v),{status:200,headers:{'content-type':'application/json'}});
 globalThis.fetch=async(url,opts={})=>{
  const u=new URL(url);const path=u.pathname;
  if(u.hostname==='graph.facebook.com'){
   const payload=JSON.parse(opts.body);sent.push(payload);return ok({messages:[{id:'wamid.session'+sent.length}]});
  }
  if(u.hostname!=='fake-session-cerca.supabase.co')throw Error('Unapproved network host');
  if(path.endsWith('/rpc/cerca_commit')){
   const p=JSON.parse(opts.body);
   if(row&&row.revision!==p.p_expected_revision)return new Response('conflict',{status:409});
   if(!row)row={id:'fake-session',wa_id:p.p_wa_id,revision:0,state:{}};
   row.revision++;row.state=p.p_state;
   for(const job of p.p_outbox)outbox.set(job.key,{job_key:job.key,wa_id:p.p_wa_id,payload:job.payload,channel:job.channel,attempts:0,expires_at:job.expires_at,status:'pending'});
   return ok({status:'applied',revision:row.revision});
  }
  if(path.endsWith('/cerca_families'))return ok(row?[row]:[]);
  if(path.endsWith('/cerca_outbox')){
   if(opts.method==='PATCH'){
    const key=u.searchParams.get('job_key')?.slice(3);
    const job=outbox.get(key);if(job)Object.assign(job,JSON.parse(opts.body));return ok(null);
   }
   if(u.searchParams.get('status')==='eq.sent')return ok([...outbox.values()].filter(j=>j.status==='sent').map(j=>({channel:j.channel})));
   return ok([...outbox.values()].filter(j=>j.status==='pending'));
  }
  throw Error('Unexpected fake REST route: '+path);
 };
 let server;
 try{
  const {start}=await import('../src/server.mjs');server=start();
  await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const send=async(text,id,timestamp=Math.floor(Date.now()/1000),businessPhoneId='123456')=>{
   const body=JSON.stringify({entry:[{changes:[{value:{metadata:{phone_number_id:businessPhoneId},messages:[{id:'wamid.'+id,from:'5492211234567',timestamp:String(timestamp),type:'text',text:{body:text}}]}}]}]});
   const signature='sha256='+createHmac('sha256',env.META_APP_SECRET).update(body).digest('hex');
   return native(base+'/webhooks/whatsapp',{method:'POST',headers:{'content-type':'application/json','x-hub-signature-256':signature},body});
  };
  assert.equal((await send('Hola',1)).status,200);
  assert.equal(sent.length,1);
  assert.match(sent[0].interactive.body.text,/¿Aceptás recibir/);
  // A signed webhook for another Meta business number must never affect CERCA.
  assert.equal((await send('ACEPTO',77,Math.floor(Date.now()/1000),'ANOTHER-WABA-PHONE')).status,200);
  assert.equal(row.state.status,'pending');
  assert.equal(sent.length,1);
  assert.equal((await send('ACEPTO',2)).status,200);
  assert.equal(row.state.flow,'adult_name');
  assert.equal(row.state.status,'onboarding');
  assert.equal(sent.length,2);
  const scan=await native(base+'/internal/dispatch',{method:'POST',headers:{authorization:'Bearer '+env.CRON_SECRET}});
  const result=await scan.json();assert.equal(scan.status,200);assert.equal(result.ready,false);
  assert.equal(sent.length,2,'No proactive messages before template approval');
  const oldTs=Math.floor(Date.now()/1000)-25*3600;
  assert.equal((await send('Ana Maria',3,oldTs)).status,200);
  assert.equal(row.state.flow,'adult_name','Old webhook retry must not advance a profile');
  assert.equal(sent.length,2);
 }finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  globalThis.fetch=native;
  for(const key of Object.keys(env)){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];}
 }
});