import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {parseTwilioForm,validateTwilioSignature,extractTwilioMessage,extractTwilioStatus,formatTwilioReply,sendTwilio} from '../src/twilio.mjs';
import {isSessionMessagingReady,isMessagingReady} from '../src/scheduler.mjs';

const AC='AC'+'a'.repeat(32),SM='SM'+'b'.repeat(32),FROM='whatsapp:+14155238886',PHONE='5492211234567';
const WEBHOOK_URL='https://cerca-piloto.onrender.com/webhooks/twilio';
const STATUS='https://cerca-piloto.onrender.com/webhooks/twilio/status';
const sign=(url,params,token)=>createHmac('sha1',token).update(url+Object.keys(params).sort().map(k=>k+params[k]).join('')).digest('base64');
const env={CERCA_PROVIDER:'twilio',CERCA_SEND_MODE:'test',CERCA_TEST_WA_IDS:PHONE,TWILIO_ACCOUNT_SID:AC,TWILIO_AUTH_TOKEN:'test-token-42',TWILIO_WHATSAPP_FROM:FROM,TWILIO_WEBHOOK_URL:WEBHOOK_URL,TWILIO_STATUS_WEBHOOK_URL:STATUS,CERCA_TEMPLATES_APPROVED:'false'};

test('Twilio allowlist permits only sandbox session; scheduled messages remain blocked',()=>{
 assert.equal(isSessionMessagingReady(env),true);
 assert.equal(isMessagingReady(env),false);
 assert.equal(isSessionMessagingReady({...env,CERCA_SEND_MODE:'disabled'}),false);
 assert.equal(isSessionMessagingReady({...env,CERCA_TEST_WA_IDS:''}),false);
 assert.equal(isSessionMessagingReady({...env,TWILIO_WEBHOOK_URL:'http://bad'}),false);
 assert.equal(isMessagingReady({...env,CERCA_TEMPLATES_APPROVED:'true',TWILIO_CONTENT_SID_DAILY:'HX'+'c'.repeat(32),TWILIO_CONTENT_SID_WEEKLY:'HX'+'d'.repeat(32)}),true);
});

test('signed form webhook rejects tampering, invalid secrets and non-HTTPS',()=>{
 const params={AccountSid:AC,MessageSid:SM,From:'whatsapp:+'+PHONE,To:FROM,Body:'Hola CERCA',ExtraField:'100% test'};
 const signature=sign(WEBHOOK_URL,params,env.TWILIO_AUTH_TOKEN);
 assert.equal(validateTwilioSignature(WEBHOOK_URL,params,signature,env.TWILIO_AUTH_TOKEN),true);
 assert.equal(validateTwilioSignature(WEBHOOK_URL,{...params,Body:'BAJA'},signature,env.TWILIO_AUTH_TOKEN),false);
 assert.equal(validateTwilioSignature(WEBHOOK_URL,params,signature,'wrong'),false);
 assert.equal(validateTwilioSignature('http://localhost',params,signature,env.TWILIO_AUTH_TOKEN),false);
 assert.equal(validateTwilioSignature(WEBHOOK_URL,params,'garbage',env.TWILIO_AUTH_TOKEN),false);
 assert.equal(validateTwilioSignature(WEBHOOK_URL+'?x=1',params,signature,env.TWILIO_AUTH_TOKEN),false);
});

test('form parser decodes Unicode and rejects duplicate keys and oversized data',()=>{
 assert.deepEqual({...parseTwilioForm('Body=Hola+CERCA%21&From=whatsapp%3A%2B5492211234567')},{Body:'Hola CERCA!',From:'whatsapp:+'+PHONE});
 assert.throws(()=>parseTwilioForm('Body=A&Body=B'),/duplicate_twilio_form_key/);
 assert.throws(()=>parseTwilioForm('Body='+('x'.repeat(8200))),/twilio_form_exceeds_limits/);
});

test('inbound only accepts correct account, business number and valid sender',()=>{
 const params={AccountSid:AC,MessageSid:SM,From:'whatsapp:+'+PHONE,To:FROM,Body:'Hola'};
 const actual=extractTwilioMessage(params,{accountSid:AC,fromNumber:FROM});
 assert.equal(actual.text,'Hola'); assert.equal(actual.phone,PHONE); assert.equal(actual.id,'twilio:'+SM);
 assert.equal(extractTwilioMessage({...params,To:'whatsapp:+19999999999'},{accountSid:AC,fromNumber:FROM}),null);
 assert.equal(extractTwilioMessage({...params,AccountSid:'AC'+'f'.repeat(32)},{accountSid:AC,fromNumber:FROM}),null);
 assert.equal(extractTwilioMessage({...params,From:'sms:+5492211234567'},{accountSid:AC,fromNumber:FROM}),null);
 assert.equal(extractTwilioMessage({...params,MessageSid:'SM123'},{accountSid:AC,fromNumber:FROM}),null);
 assert.equal(extractTwilioMessage({...params,ButtonPayload:'ACEPTO'},{accountSid:AC,fromNumber:FROM}).text,'ACEPTO');
});

test('formats guided options as plain text for Sandbox, without unsupported buttons',()=>{
 assert.equal(formatTwilioReply({body:'¿Aceptás?',options:['ACEPTO','NO']}),'¿Aceptás?\n\nRespondé: ACEPTO | NO');
});

test('send API uses official Twilio endpoint, authenticated POST and valid WhatsApp addresses',async()=>{
 let parsed;
 const id='SM'+'c'.repeat(32);
 const fetcher=async(url,opts)=>{
  parsed={url,opts,params:Object.fromEntries(new URLSearchParams(opts.body))};
  return new Response(JSON.stringify({sid:id}),{status:201,headers:{'content-type':'application/json'}});
 };
 const result=await sendTwilio({body:'Primera pregunta',options:['ACEPTO','NO']},PHONE,{env,fetcher});
 assert.equal(result,id);
 assert.equal(parsed.url,`https://api.twilio.com/2010-04-01/Accounts/${AC}/Messages.json`);
 assert.equal(parsed.params.From,FROM);assert.equal(parsed.params.To,'whatsapp:+'+PHONE);
 assert.match(parsed.params.Body,/Respondé: ACEPTO \| NO/);
 assert.equal(parsed.params.StatusCallback,STATUS);
 assert.match(parsed.opts.headers.authorization,/^Basic /);
 assert.ok(!parsed.opts.body.includes('test-token-42'));
});

test('outbound templates require approved Twilio ContentSid',async()=>{
 let calls=0;
 const fetcher=async()=>{calls++;return new Response(JSON.stringify({sid:SM}),{status:201});};
 await assert.rejects(sendTwilio({kind:'template',name:'HX'+'a'.repeat(32),params:['hello','world']},PHONE,{env,fetcher}),/twilio_template_not_approved/);
 assert.equal(calls,0);
 let payload;
 const approved={...env,CERCA_TEMPLATES_APPROVED:'true'};
 await sendTwilio({kind:'template',name:'HX'+'a'.repeat(32),params:['hello','world']},PHONE,{env:approved,fetcher:async(_url,opts)=>{payload=Object.fromEntries(new URLSearchParams(opts.body));return new Response(JSON.stringify({sid:SM}),{status:201});}});
 assert.equal(payload.ContentSid,'HX'+'a'.repeat(32)); assert.deepEqual(JSON.parse(payload.ContentVariables),{'1':'hello','2':'world'});
});

test('delivery status callback maps completed and failed only',()=>{
 assert.deepEqual(extractTwilioStatus({AccountSid:AC,MessageSid:SM,MessageStatus:'delivered'},{accountSid:AC}),{messageId:SM,status:'delivered'});
 assert.deepEqual(extractTwilioStatus({AccountSid:AC,MessageSid:SM,MessageStatus:'undelivered'},{accountSid:AC}),{messageId:SM,status:'failed'});
 assert.equal(extractTwilioStatus({AccountSid:AC,MessageSid:SM,MessageStatus:'queued'},{accountSid:AC}),null);
 assert.equal(extractTwilioStatus({AccountSid:'AC'+'0'.repeat(32),MessageSid:SM,MessageStatus:'delivered'},{accountSid:AC}),null);
});

test('HTTP Twilio Sandbox: signed webhook onboarding + BAJA + invalid sender and status',async()=>{
 const settings={...env,CERCA_TEST_REST_ADAPTER:'true',SUPABASE_URL:'https://fake-twilio-cerca.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'local-fake-only',PORT:'0',OPENAI_API_KEY:'',CERCA_MONTHLY_CAP_USD:'10'};
 const prev=Object.fromEntries(Object.keys(settings).map(k=>[k,process.env[k]]));
 for(const [k,v] of Object.entries(settings))process.env[k]=v;
 const originalFetch=globalThis.fetch;
 let family=null; const events=new Set(),outbox=new Map(),sent=[];
 const ok=(v)=>new Response(JSON.stringify(v),{status:200,headers:{'content-type':'application/json'}});
 globalThis.fetch=async(url,opts={})=>{
  const u=new URL(url),path=u.pathname;
  if(u.hostname==='api.twilio.com'){
   const params=Object.fromEntries(new URLSearchParams(opts.body));sent.push(params);
   return new Response(JSON.stringify({sid:'SM'+String(sent.length).padStart(32,'0')}),{status:201});
  }
  if(u.hostname!=='fake-twilio-cerca.supabase.co')throw Error('unexpected outbound host: '+u.hostname);
  if(path.endsWith('/rpc/cerca_commit')){
   const p=JSON.parse(opts.body);
   if(events.has(p.p_event_id))return ok({status:'duplicate',revision:family.revision});
   if(family&&family.revision!==p.p_expected_revision)return new Response('conflict',{status:409});
   if(!family)family={id:'fake',wa_id:p.p_wa_id,revision:0,state:{}};
   family.revision++;family.state=p.p_state; events.add(p.p_event_id);
   if(family.state.status==='stopped')for(const j of outbox.values())if(j.status==='pending')j.status='cancelled';
   for(const j of p.p_outbox)outbox.set(j.key,{job_key:j.key,wa_id:p.p_wa_id,payload:j.payload,channel:j.channel,attempts:0,status:'pending',expires_at:j.expires_at});
   return ok({status:'applied',revision:family.revision});
  }
  if(path.endsWith('/cerca_families'))return ok(family?[family]:[]);
  if(path.endsWith('/cerca_outbox')){
   if(opts.method==='PATCH'){
    const key=u.searchParams.get('job_key')?.slice(3),pid=u.searchParams.get('provider_message_id')?.slice(3);
    const job=key?outbox.get(key):[...outbox.values()].find(x=>x.provider_message_id===pid);
    if(job)Object.assign(job,JSON.parse(opts.body));return ok(null);
   }
   if(u.searchParams.get('status')==='eq.sent')return ok([...outbox.values()].filter(x=>x.status==='sent').map(x=>({channel:x.channel})));
   return ok([...outbox.values()].filter(x=>x.status==='pending'));
  }
  throw Error('unexpected db route: '+path);
 };
 let server;
 try{
  const {start}=await import('../src/server.mjs');server=start();
  await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=async(text,id,{to=FROM,from='whatsapp:+'+PHONE,account=AC,signatureCorrect=true}={})=>{
   const payload={AccountSid:account,MessageSid:'SM'+String(id).padStart(32,'0'),From:from,To:to,Body:text};
   const signature=sign(WEBHOOK_URL,payload,env.TWILIO_AUTH_TOKEN);
   const r=await originalFetch(base+'/webhooks/twilio',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','x-twilio-signature':signatureCorrect?signature:'wrong'},body:new URLSearchParams(payload)});
   return r;
  };
  assert.equal((await post('hola',1,{signatureCorrect:false})).status,403);
  assert.equal((await post('hola',1,{to:'whatsapp:+19999999999'})).status,200);
  assert.equal(sent.length,0);
  const first=await post('hola',1); assert.equal(first.status,200);assert.match(await first.text(),/<Response\/>/);
  assert.match(sent[0].Body,/Aceptás recibir/);
  assert.match(sent[0].Body,/ACEPTO \| NO/);
  assert.equal((await post('hola',1)).status,200);assert.equal(sent.length,1,'deduplicated Twilio MessageSid');
  assert.equal((await post('ACEPTO',2)).status,200); assert.equal(family.state.flow,'adult_name');
  assert.equal((await post('BAJA',3)).status,200);assert.equal(family.state.status,'stopped');
  const scheduled=await originalFetch(base+'/internal/dispatch',{method:'POST'});assert.equal(scheduled.status,403);
  const delivery={AccountSid:AC,MessageSid:'SM'+String(sent.length).padStart(32,'0'),MessageStatus:'delivered'};
  const status=await originalFetch(base+'/webhooks/twilio/status',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','x-twilio-signature':sign(STATUS,delivery,env.TWILIO_AUTH_TOKEN)},body:new URLSearchParams(delivery)});
  assert.equal(status.status,200);assert.equal([...outbox.values()].filter(j=>j.delivery_status==='delivered').length,1);
 } finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  globalThis.fetch=originalFetch;
  for(const k of Object.keys(settings)){if(prev[k]===undefined)delete process.env[k];else process.env[k]=prev[k];}
 }
});