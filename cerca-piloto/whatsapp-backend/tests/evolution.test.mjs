import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEvolutionWebhook,extractEvolutionMessage,sendEvolution,evolutionReady,fetchEvolutionQr,fetchEvolutionPairingCode,classifyEvolutionQrError} from '../src/evolution.mjs';
import {isSessionMessagingReady,isMessagingReady} from '../src/scheduler.mjs';

const SECRET='test-webhook-secret-should-be-32-plus-characters',PHONE='5492211234567';
const now=new Date('2026-11-17T11:00:00.000Z');
const env={CERCA_PROVIDER:'evolution',CERCA_SEND_MODE:'test',CERCA_TEST_WA_IDS:PHONE,EVOLUTION_API_URL:'https://evo.cerca.example/',EVOLUTION_API_KEY:'test-evolution-secret-32-chars',EVOLUTION_INSTANCE:'cerca-piloto',CERCA_BRIDGE_WEBHOOK_SECRET:SECRET,CERCA_EVOLUTION_SCHEDULED_ALLOWED:'false'};
const payload=(message='Hola',key={})=>({event:'messages.upsert',instance:'cerca-piloto',data:{key:{id:'3EB0F1E2E3D498AC',fromMe:false,remoteJid:PHONE+'@s.whatsapp.net',...key},messageTimestamp:Math.floor(now.getTime()/1000),message:{conversation:message}}});

test('Bridge is test-only until a deliberate scheduled go-live',()=>{
 assert.equal(evolutionReady(env),true);
 assert.equal(isSessionMessagingReady(env),true);
 assert.equal(isMessagingReady(env),false);
 assert.equal(isSessionMessagingReady({...env,CERCA_SEND_MODE:'disabled'}),false);
 assert.equal(isSessionMessagingReady({...env,CERCA_TEST_WA_IDS:''}),false);
 assert.equal(isSessionMessagingReady({...env,CERCA_SEND_MODE:'production'}),false);
 assert.equal(isMessagingReady({...env,CERCA_EVOLUTION_SCHEDULED_ALLOWED:'true',EVOLUTION_TEMPLATE_DAILY:'cerca_daily',EVOLUTION_TEMPLATE_WEEKLY:'cerca_weekly'}),true);
});

test('Webhook requires a strong exact secret',()=>{
 assert.equal(validateEvolutionWebhook(SECRET,SECRET),true);
 assert.equal(validateEvolutionWebhook('wrong',SECRET),false);
 assert.equal(validateEvolutionWebhook('',SECRET),false);
 assert.equal(validateEvolutionWebhook('short','short'),false);
});

test('A valid individual message becomes an inbound event',()=>{
 const m=extractEvolutionMessage(payload(),{instance:'cerca-piloto',now});
 assert.equal(m.id,'evolution:cerca-piloto:3EB0F1E2E3D498AC');
 assert.equal(m.phone,PHONE); assert.equal(m.text,'Hola');
 assert.equal(m.receivedAt,now.toISOString());
});

test('Groups, broadcast, fromMe, mismatched instance and unsupported events are ignored',()=>{
 for(const variant of [
  {...payload(),instance:'cotironda'},
  {...payload(),event:'send.message'},
  payload('Hi',{remoteJid:'120123456789@g.us'}),
  payload('Hi',{remoteJid:'status@broadcast'}),
  payload('Hi',{fromMe:true}),
  payload('Hi',{remoteJid:'fake@lid'}),
  payload('Hi',{id:'a'}),
 ])assert.equal(extractEvolutionMessage(variant,{instance:'cerca-piloto',now}),null);
});

test('WhatsApp LID only accepted with explicit numeric alternative',()=>{
 const p=payload('ACEPTO',{remoteJid:'3456@lid',remoteJidAlt:PHONE+'@s.whatsapp.net'});
 assert.equal(extractEvolutionMessage(p,{instance:'cerca-piloto',now})?.phone,PHONE);
 const lid=payload('Hola',{remoteJid:'123456@lid'});lid.sender=PHONE+'@s.whatsapp.net';
 assert.equal(extractEvolutionMessage(lid,{instance:'cerca-piloto',now})?.phone,PHONE);
 lid.sender='not-a-phone@lid';assert.equal(extractEvolutionMessage(lid,{instance:'cerca-piloto',now}),null);
});

test('Text, guided selection and short-lived wrapped messages are parsed',()=>{
 const p=payload();p.data.message={extendedTextMessage:{text:'BAJA'}};
 assert.equal(extractEvolutionMessage(p,{instance:'cerca-piloto',now})?.text,'BAJA');
 p.data.message={ephemeralMessage:{message:{buttonsResponseMessage:{selectedButtonId:'ACEPTO'}}}};
 assert.equal(extractEvolutionMessage(p,{instance:'cerca-piloto',now})?.text,'ACEPTO');
 p.data.message={imageMessage:{caption:'not accepted'}};
 assert.equal(extractEvolutionMessage(p,{instance:'cerca-piloto',now}),null);
});

test('Stale and future timestamps are rejected',()=>{
 const p=payload();p.data.messageTimestamp=Math.floor(now.getTime()/1000)-24*3600;
 assert.equal(extractEvolutionMessage(p,{instance:'cerca-piloto',now}),null);
 p.data.messageTimestamp=Math.floor(now.getTime()/1000)+3600;
 assert.equal(extractEvolutionMessage(p,{instance:'cerca-piloto',now}),null);
 p.data.messageTimestamp='not a date';
 assert.equal(extractEvolutionMessage(p,{instance:'cerca-piloto',now}),null);
});

test('Evolution URL is HTTPS and rejects unsafe/malformed configurations',()=>{
 assert.equal(evolutionReady({...env,EVOLUTION_API_URL:'http://evo.cerca.example/'}),false);
 assert.equal(evolutionReady({...env,EVOLUTION_API_URL:'https://evo.cerca.example/tenant'}),false);
 assert.equal(evolutionReady({...env,EVOLUTION_API_URL:'https://user:secret@evo.cerca.example/'}),false);
 assert.equal(evolutionReady({...env,EVOLUTION_INSTANCE:'../cotironda'}),false);
 assert.equal(evolutionReady({...env,EVOLUTION_API_KEY:''}),false);
});

test('Outgoing message uses scoped instance and apikey; only text formatting',async()=>{
 let request;
 const fetcher=async(url,opts)=>{request={url,opts,payload:JSON.parse(opts.body)};return new Response(JSON.stringify({key:{id:'3EB0E98989898F0D'}}),{status:201});};
 const id=await sendEvolution({body:'¿Aceptás recibir misiones?',options:['ACEPTO','NO']},PHONE,{env,fetcher});
 assert.equal(id,'3EB0E98989898F0D');
 assert.equal(request.url,'https://evo.cerca.example/message/sendText/cerca-piloto');
 assert.equal(request.opts.headers.apikey,env.EVOLUTION_API_KEY);
 assert.equal(request.payload.number,PHONE);
 assert.match(request.payload.text,/Respondé: ACEPTO \| NO/);
 assert.ok(!JSON.stringify(request.payload).includes(SECRET));
});

test('Owner QR access validates response shape and never needs to expose Evolution API credentials',async()=>{
 const b64=Buffer.from('a'.repeat(100)).toString('base64');
 let requested;
 const qr=await fetchEvolutionQr({env,fetcher:async(url,options)=>{
  requested={url,options};return new Response(JSON.stringify({base64:'data:image/png;base64,'+b64}),{status:200});
 }});
 assert.equal(requested.url,'https://evo.cerca.example/instance/connect/cerca-piloto');
 assert.equal(requested.options.headers.apikey,env.EVOLUTION_API_KEY);
 assert.equal(qr,'data:image/png;base64,'+b64);
 assert.equal(await fetchEvolutionQr({env,fetcher:async()=>new Response(JSON.stringify({base64:'<script>x</script>'}),{status:200})}),null);
});

test('Pairing code is available privately for a single-phone operator',async()=>{
 const code=await fetchEvolutionPairingCode(PHONE,{env,fetcher:async(url,opts)=>{
  assert.match(url,/instance\/connect\/cerca-piloto\?number=5492211234567/);
  assert.equal(opts.headers.apikey,env.EVOLUTION_API_KEY);
  return new Response(JSON.stringify({pairingCode:'AAAA-BBBB'}),{status:200});
 }});
 assert.equal(code,'AAAABBBB');
 await assert.rejects(fetchEvolutionPairingCode('..bad',{env,fetcher:async()=>{throw new Error('must not send')}}),/evolution_pairing_not_configured/);
});

test('No marketing without separate activation; invalid API acceptance is not treated as delivery' ,async()=>{
 let called=0;
 const fetcher=async()=>{called++;return new Response('{}',{status:200});};
 await assert.rejects(sendEvolution({kind:'template',name:'daily',params:['A','B']},PHONE,{env,fetcher}),/evolution_scheduled_disabled/);
 assert.equal(called,0);
 await assert.rejects(sendEvolution({body:'Hi'},PHONE,{env,fetcher}),/evolution_missing_message_id/);
 assert.equal(called,1);
});

test('HTTP Bridge pipeline: authenticated webhook -> consent -> deduplication -> BAJA',async()=>{
 const config={...env,CERCA_TEST_REST_ADAPTER:'true',SUPABASE_URL:'https://fake-evolution-cerca.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'fake-local-only',PORT:'0',OPENAI_API_KEY:'',CERCA_MONTHLY_CAP_USD:'10',CERCA_OPERATOR_PASSWORD:'owner-password-at-least-thirty-two-bytes-long'};
 const previous=Object.fromEntries(Object.keys(config).map(k=>[k,process.env[k]]));
 for(const [k,v] of Object.entries(config))process.env[k]=v;
 const originalFetch=globalThis.fetch;let family=null;
 const events=new Set(),outbox=new Map(),sent=[];
 const ok=(obj)=>new Response(JSON.stringify(obj),{status:200,headers:{'content-type':'application/json'}});
 globalThis.fetch=async(url,opts={})=>{
  const parsed=new URL(url),path=parsed.pathname;
  if(parsed.hostname==='evo.cerca.example'){
   assert.equal(opts.headers.apikey,env.EVOLUTION_API_KEY);
   if(path.startsWith('/instance/connect/'))return ok(parsed.searchParams.has('number')?{pairingCode:'AAABBB11'}:{base64:'data:image/png;base64,'+Buffer.from('a'.repeat(100)).toString('base64')});
   sent.push(JSON.parse(opts.body));
   return new Response(JSON.stringify({key:{id:'3EB0'+String(sent.length).padStart(16,'0')}}),{status:201});
  }
  if(parsed.hostname!=='fake-evolution-cerca.supabase.co')throw Error('Unexpected external host: '+parsed.hostname);
  if(path.endsWith('/rpc/cerca_commit')){
   const p=JSON.parse(opts.body);
   if(events.has(p.p_event_id))return ok({status:'duplicate',revision:family.revision});
   if(family&&p.p_expected_revision!==family.revision)return new Response('conflict',{status:409});
   if(!family)family={id:'fake',wa_id:p.p_wa_id,revision:0,state:{}};
   family.revision++;family.state=p.p_state;events.add(p.p_event_id);
   if(family.state.status==='stopped')for(const job of outbox.values())if(job.status==='pending')job.status='cancelled';
   for(const job of p.p_outbox)outbox.set(job.key,{job_key:job.key,wa_id:p.p_wa_id,payload:job.payload,channel:job.channel,attempts:0,status:'pending',expires_at:job.expires_at});
   return ok({status:'applied',revision:family.revision});
  }
  if(path.endsWith('/cerca_families'))return ok(family?[family]:[]);
  if(path.endsWith('/cerca_outbox')){
   if(opts.method==='PATCH'){
    const key=parsed.searchParams.get('job_key')?.slice(3),pid=parsed.searchParams.get('provider_message_id')?.slice(3);
    const job=key?outbox.get(key):[...outbox.values()].find(j=>j.provider_message_id===pid);
    if(job)Object.assign(job,JSON.parse(opts.body));return ok(null);
   }
   if(parsed.searchParams.get('status')==='eq.sent')return ok([...outbox.values()].filter(x=>x.status==='sent').map(x=>({channel:x.channel})));
   return ok([...outbox.values()].filter(x=>x.status==='pending'));
  }
  throw Error('Unexpected fake DB endpoint: '+path);
 };
 let server;
 try {
  const {start}=await import('../src/server.mjs');server=start();
  await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const send=async(text,id,{secret=SECRET,instance=env.EVOLUTION_INSTANCE,key={}}={})=>{
   const event={...payload(text,key),instance};
   event.data.key.id='3EB0'+String(id).padStart(16,'0');
   event.data.messageTimestamp=Math.floor(Date.now()/1000);
   return originalFetch(base+'/webhooks/evolution',{method:'POST',headers:{'content-type':'application/json','x-cerca-bridge-secret':secret},body:JSON.stringify(event)});
  };
  assert.equal((await originalFetch(base+'/internal/bridge')).status,401);
  const auth='Basic '+Buffer.from('cerca-admin:'+config.CERCA_OPERATOR_PASSWORD).toString('base64');
  const admin=await originalFetch(base+'/internal/bridge',{headers:{authorization:auth}});
  assert.equal(admin.status,200);assert.match(await admin.text(),/QR de vinculación/);
  assert.equal((await originalFetch(base+'/internal/bridge/pair',{method:'POST',headers:{'content-type':'application/json','x-cerca-admin':'1'},body:JSON.stringify({number:PHONE})})).status,401);
  const pairing=await originalFetch(base+'/internal/bridge/pair',{method:'POST',headers:{'content-type':'application/json','x-cerca-admin':'1',authorization:auth,origin:'https://cerca-piloto.onrender.com'},body:JSON.stringify({number:PHONE})});
  assert.equal(pairing.status,200);assert.equal((await pairing.json()).code,'AAABBB11');
  assert.equal((await send('hola',1,{secret:'wrong'})).status,403);
  assert.equal(sent.length,0);
  assert.equal((await send('hola',1,{instance:'cotironda'})).status,200);
  assert.equal(sent.length,0);
  assert.equal((await send('hola',1,{key:{remoteJid:'123456789@g.us'}})).status,200);
  assert.equal(sent.length,0);
  assert.equal((await send('hola',1)).status,200);
  assert.equal(sent.length,1);
  assert.match(sent.at(-1).text,/Aceptás recibir/);
  assert.equal((await send('hola',1)).status,200);
  assert.equal(sent.length,1,'redelivery must be idempotent');
  assert.equal((await send('ACEPTO',2)).status,200);
  assert.equal(family.state.flow,'adult_name');
  assert.equal((await send('BAJA',3)).status,200);
  assert.equal(family.state.status,'stopped');
  assert.equal((await originalFetch(base+'/internal/dispatch',{method:'POST'})).status,403);
  assert.equal((await originalFetch(base+'/webhooks/evolution',{method:'POST',headers:{'content-type':'application/json','x-cerca-bridge-secret':SECRET},body:'broken json'})).status,400);
 } finally {
  if(server)await new Promise(r=>server.close(r));
  globalThis.fetch=originalFetch;
  for(const k of Object.keys(config)){if(previous[k]===undefined)delete process.env[k];else process.env[k]=previous[k];}
 }
});
test('QR operator diagnostics return fixed categories without leaking secrets or raw URLs',()=>{
 const cases=[
  [new Error('evolution_not_configured'),'configuracion_incompleta'],
  [new Error('evolution_qr_http_401'),'clave_evolution_rechazada'],
  [new Error('evolution_qr_http_403'),'clave_evolution_rechazada'],
  [new Error('evolution_qr_http_404'),'ruta_o_instancia_no_encontrada'],
  [new Error('evolution_qr_http_502'),'error_del_servidor_evolution'],
  [Object.assign(new Error('The URL contains a secret'),{name:'AbortError'}),'tiempo_de_espera'],
  [Object.assign(new Error('unsafe secret!'),{cause:{code:'ENOTFOUND'}}),'dns'],
  [Object.assign(new Error('unsafe secret!'),{cause:{code:'UNABLE_TO_VERIFY_LEAF_SIGNATURE'}}),'certificado_tls'],
  [new Error('private:password'),'conexion_fallida']
 ];
 for(const [error,expected] of cases){const actual=classifyEvolutionQrError(error);assert.equal(actual,expected);assert.ok(!actual.includes('secret')&&!actual.includes('password'));}
});
