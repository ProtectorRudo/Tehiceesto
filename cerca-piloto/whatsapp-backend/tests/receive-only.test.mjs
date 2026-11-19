import test from 'node:test';
import assert from 'node:assert/strict';
import {inboundPolicy,isAllowedInboundRecipient,isAllowedRecipient,isSessionMessagingReady} from '../src/scheduler.mjs';

const PHONE='5492211234567';
const OTHER='5492218888888';
const SECRET='local-only-webhook-secret-32-characters-long';

test('Receive-only allowlist is independent of all outbound permissions',()=>{
 const env={CERCA_SEND_MODE:'disabled',CERCA_TEST_WA_IDS:PHONE,CERCA_PROVIDER:'evolution'};
 assert.equal(inboundPolicy(env),'test_allowlist');
 assert.equal(isAllowedInboundRecipient(PHONE,env),true);
 assert.equal(isAllowedInboundRecipient(OTHER,env),false);
 assert.equal(isAllowedRecipient(PHONE,env),false);
 assert.equal(isSessionMessagingReady(env),false);
 assert.equal(inboundPolicy({...env,CERCA_TEST_WA_IDS:''}),'blocked');
 assert.equal(isAllowedInboundRecipient(PHONE,{...env,CERCA_TEST_WA_IDS:''}),false);
 assert.equal(isAllowedInboundRecipient(PHONE,{...env,CERCA_SEND_MODE:'unexpected'}),false);
 assert.equal(isAllowedInboundRecipient(PHONE,{...env,CERCA_SEND_MODE:'test'}),true);
 assert.equal(isAllowedInboundRecipient(PHONE,{...env,CERCA_SEND_MODE:'production'}),false);
 assert.equal(isAllowedInboundRecipient(OTHER,{...env,CERCA_SEND_MODE:'production',CERCA_PRODUCTION_AUTHORIZED:'true'}),true);
});

test('Authenticated Evolution webhook stores only authorized inbound messages in receive-only mode, without queuing or sending',async()=>{
 const config={
  CERCA_PROVIDER:'evolution',CERCA_SEND_MODE:'disabled',CERCA_TEST_WA_IDS:PHONE,
  CERCA_TEST_REST_ADAPTER:'true',SUPABASE_URL:'https://fake-cerca-receive-only.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:'test-only-not-real',EVOLUTION_INSTANCE:'cerca-piloto',
  CERCA_BRIDGE_WEBHOOK_SECRET:SECRET,PORT:'0',OPENAI_API_KEY:''
 };
 const previous=Object.fromEntries(Object.keys(config).map(k=>[k,process.env[k]]));
 for(const [k,v] of Object.entries(config))process.env[k]=v;
 const native=globalThis.fetch;
 let row=null,commits=0,outgoing=0,queued=0;
 const ok=value=>new Response(JSON.stringify(value),{status:200,headers:{'content-type':'application/json'}});
 globalThis.fetch=async(url,options={})=>{
  const u=new URL(url);
  if(u.hostname!=='fake-cerca-receive-only.supabase.co'){outgoing++;throw Error('Unexpected outbound request');}
  if(u.pathname.endsWith('/cerca_families'))return ok(row?[row]:[]);
  if(u.pathname.endsWith('/rpc/cerca_commit')){
   const data=JSON.parse(options.body);
   commits++;queued+=data.p_outbox.length;
   row={id:'fake',wa_id:data.p_wa_id,revision:commits,state:data.p_state};
   return ok({status:'applied',revision:commits});
  }
  throw Error('Unexpected database route '+u.pathname);
 };
 let server;
 try{
  const {start}=await import('../src/server.mjs');
  server=start();await new Promise(resolve=>server.once('listening',resolve));
  const root='http://127.0.0.1:'+server.address().port;
  const health=await native(root+'/healthz');
  assert.equal((await health.json()).inbound,'test_allowlist');
  const makePayload=(phone,id)=>({event:'messages.upsert',instance:'cerca-piloto',
   data:{key:{id,fromMe:false,remoteJid:phone+'@s.whatsapp.net'},
   messageTimestamp:Math.floor(Date.now()/1000),message:{conversation:'Hola CERCA, quiero comenzar'}}});
  const post=async(phone,id,secret=SECRET)=>native(root+'/webhooks/evolution',{
   method:'POST',headers:{'content-type':'application/json','x-cerca-bridge-secret':secret},
   body:JSON.stringify(makePayload(phone,id))
  });
  assert.equal((await post(PHONE,'3EB0F1E2E3D498AC','wrong')).status,403);
  const outside=await post(OTHER,'3EB0F1E2E3D498AC');
  assert.equal(outside.status,200);
  assert.deepEqual(await outside.json(),{received:0});
  assert.equal(commits,0);
  const inside=await post(PHONE,'3EB0F1E2E3D498AD');
  assert.equal(inside.status,200);
  assert.deepEqual(await inside.json(),{received:1});
  assert.equal(commits,1);
  assert.equal(row.wa_id,PHONE);
  assert.equal(row.state.status,'pending');
  assert.equal(row.state.consentPrompted,true);
  assert.equal(queued,0,'No future outbox sends when outbound disabled');
  assert.equal(outgoing,0,'No WhatsApp send attempt when disabled');
 }finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  globalThis.fetch=native;
  for(const key of Object.keys(config)){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];}
 }
});
