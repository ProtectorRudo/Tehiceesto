import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/flow.mjs';
import {previewIntent,previewPermitted,previewMessages,handlePreviewInbound} from '../src/huella-preview.mjs';

const PHONE='5492211234567';
const env={HUELLA_PREVIEW_ENABLED:'true',CERCA_PROVIDER:'evolution',CERCA_SEND_MODE:'test',
 CERCA_TEST_WA_IDS:PHONE,EVOLUTION_API_URL:'https://evolution.test/',
 EVOLUTION_API_KEY:'unit-test-api-key-not-real-1234567890',EVOLUTION_INSTANCE:'huella-preview',
 CERCA_BRIDGE_WEBHOOK_SECRET:'test-secret-longer-than-thirty-two-characters',
 OPENAI_API_KEY:'fake-test-no-network'};
const now=new Date('2026-11-19T14:30:00Z');
const phoneMessage=(text,id)=>({phone:PHONE,text,id:id||'evolution:test:abcdef',receivedAt:now.toISOString()});
const state=()=>{
 const s=initialState();
 s.status='active';s.flow='idle';s.consentAt='2026-11-18T15:00:00Z';
 s.adultName='Adulto';
 s.children=[
  {name:'Bebé',age:0,interests:['sonidos'],goal:'observar mejor sus señales de comunicación'},
  {name:'Mayor',age:9,interests:['dibujar'],goal:'escuchar mejor sus intereses'}];
 s.monthlyGoal='estar más presente con mis hijos';return s;
};
const mission=(kind,i,day)=>({
 kind,title:'Un encuentro especial con '+(i===0?'bebé':'la mayor')+' para '+kind,
 steps:['Elegí un momento tranquilo para compartir diez minutos siguiendo la atención del niño.',
  'Ofrecé una elección adecuada a su edad, escuchá su reacción y respetá cuando quiera terminar.'],
 why:'Esta propuesta ofrece tiempo de escucha y respeto de sus decisiones sin forzar resultados.',
 observe:'Observá una preferencia o señal real que descubras durante el momento compartido.',
 target:i===0?'sonidos':'dibujar'
});
const week=()=>{
 const p=state();
 return {day:'2026-11-23',
 children:p.children.map((c,i)=>({name:c.name,missions:['conectar','comprender','sembrar'].map(kind=>mission(kind,i))})),
 weekly:{title:'Nuestros momentos favoritos de noviembre',
  steps:['Cada persona puede elegir un pequeño momento para recordar durante la comida familiar.',
   'Escuchen las elecciones sin interrumpir y escriban un recuerdo compartido en una hoja.'],
  why:'Una rutina compartida puede crear una oportunidad de encuentro sin pedir perfección.',
  observe:'Observá si aparece una preferencia que no conocías y anotala si la persona quiere.'}};
};
function fakeDb(initial=state()){
 const record={revision:1,state:structuredClone(initial)};
 const events=new Set(),outbox=[];
 return {
  record,outbox,events,
  async family(p){assert.equal(p,PHONE);return {id:'fixture',revision:record.revision,state:structuredClone(record.state)};},
  async commit(p,revision,eventId,newState,jobs){
   assert.equal(p,PHONE);
   if(events.has(eventId))return {status:'duplicate',revision:record.revision};
   if(record.revision!==revision)throw Error('database_409');
   if(jobs.length>15)throw Error('too_many_jobs');
   assert.ok(jobs.every(x=>x.channel==='service'&&x.payload?.body&&x.expires_at));
   events.add(eventId);record.revision++;record.state=structuredClone(newState);
   outbox.push(...jobs);
   return {status:'applied',revision:record.revision};
  }
 };
}
test('preview is hidden until enabled, only for ONE allowlisted phone and never public',()=>{
 assert.equal(previewIntent('PRÉVIA'),true);
 assert.equal(previewIntent('PREVIA VER'),true);
 assert.equal(previewIntent('Una consulta personal'),false);
 assert.equal(previewPermitted(PHONE,env),true);
 for(const altered of [
  {...env,HUELLA_PREVIEW_ENABLED:'false'},
  {...env,CERCA_TEST_WA_IDS:PHONE+',5492219876543'},
  {...env,CERCA_SEND_MODE:'production'},
  {...env,OPENAI_API_KEY:''},
  {...env,CERCA_PROVIDER:'meta'},
 ])assert.equal(previewPermitted(PHONE,altered),false);
 assert.equal(previewPermitted('5492210000000',env),false);
});
test('formatter sends complete missions, why/how/observe and sourced story without truncation',()=>{
 const messages=previewMessages(week(),state(),'2026-11-23');
 assert.ok(messages.length>=5&&messages.length<=12);
 const bodies=messages.map(x=>x.body).join('\n');
 assert.match(bodies,/CON[fN]?ECTAR|conectar/i);
 assert.match(bodies,/JUEVES/);assert.match(bodies,/SÁBADO/);
 assert.match(bodies,/Por qué/);assert.match(bodies,/Qué observar/);
 assert.match(bodies,/UNICEF/);assert.match(bodies,/Domingo/i);
 assert.ok(messages.every(x=>x.body.length<=3600));
});
test('one PREVIA makes exactly one AI call, records immutable reservation and previews without starting pilot',async()=>{
 const db=fakeDb();let generations=0,flushes=0;
 const gen=async()=>{generations++;return week();};
 const r=await handlePreviewInbound(phoneMessage('PREVIA','evolution:abc:100'),{db,env,now,generate:gen,flush:async()=>flushes++});
 assert.equal(r,'applied');assert.equal(generations,1);assert.equal(flushes,2);
 assert.equal(db.record.state.huellaPreview.status,'ready');
 assert.equal(db.record.state.huellaPreview.weekKey,'2026-11-23');
 assert.equal(db.record.state.huellaPilotStartDay,null);
 assert.equal(db.record.state.children.length,2);
 assert.ok(db.outbox.some(x=>x.payload.body.includes('No activan el calendario')));
 assert.equal(db.record.state.history.length,0);
 const count=db.outbox.length;
 assert.ok(count>=6&&count<=13);
 const replay=await handlePreviewInbound(phoneMessage('PREVIA','evolution:abc:100'),{db,env,now,generate:gen});
 assert.equal(replay,'duplicate');assert.equal(generations,1);
 const again=await handlePreviewInbound(phoneMessage('PREVIA','evolution:abc:101'),{db,env,now,generate:gen});
 assert.equal(again,'applied');assert.equal(generations,1);
 assert.equal(db.outbox.length,count+1);
 const view=await handlePreviewInbound(phoneMessage('PREVIA VER','evolution:abc:102'),{db,env,now,generate:gen});
 assert.equal(view,'applied');assert.equal(generations,1);
 assert.ok(db.outbox.length>count+1);
});
test('model failure never sends made-up content; a deliberate retry is allowed once',async()=>{
 const db=fakeDb();let generations=0;
 const gen=async()=>{generations++;throw Error('huella_ai_http_403');};
 await handlePreviewInbound(phoneMessage('PREVIA','evolution:abc:201'),{db,env,now,generate:gen});
 assert.equal(db.record.state.huellaPreview.status,'failed');
 assert.equal(db.record.state.huellaPreview.error,'huella_ai_http_403');
 assert.equal(db.record.state.huellaPreview.attempts,1);
 assert.ok(db.outbox.some(x=>x.payload.body.includes('no pudo preparar')));
 assert.ok(!db.outbox.some(x=>x.payload.body.includes('*MARTES')));
 await handlePreviewInbound(phoneMessage('PREVIA','evolution:abc:202'),{db,env,now,generate:gen});
 assert.equal(generations,1);
 await handlePreviewInbound(phoneMessage('PREVIA REINTENTAR','evolution:abc:203'),{db,env,now,generate:gen});
 assert.equal(generations,2);
 assert.equal(db.record.state.huellaPreview.attempts,2);
 await handlePreviewInbound(phoneMessage('PREVIA REINTENTAR','evolution:abc:204'),{db,env,now,generate:gen});
 assert.equal(generations,2,'weekly hard maximum is two API calls');
});
test('user can opt out while AI is generating; no final messages are sent after opt-out',async()=>{
 const db=fakeDb();let generations=0;
 const gen=async()=>{
  generations++;
  db.record.state.status='stopped';db.record.state.consentAt=null;db.record.revision++;
  return week();
 };
 const r=await handlePreviewInbound(phoneMessage('PREVIA','evolution:abc:301'),{db,env,now,generate:gen});
 assert.equal(r,'cancelled');assert.equal(generations,1);
 assert.ok(!db.outbox.some(x=>x.payload.body.includes('MISIÓN')));
});
test('guard ignores unregistered and unauthorized users before touching OpenAI',async()=>{
 const db=fakeDb({...state(),status:'stopped',consentAt:null});
 const generate=async()=>{throw Error('should not be called')};
 assert.equal(await handlePreviewInbound(phoneMessage('PREVIA','evolution:abc:401'),{db,env,now,generate}),'not_active');
 assert.equal(await handlePreviewInbound(phoneMessage('PREVIA','evolution:abc:402'),{db,env:{...env,HUELLA_PREVIEW_ENABLED:'false'},now,generate}),null);
 assert.equal(db.outbox.length,0);
});
test('format rejects incomplete missions rather than letting WhatsApp send a truncated activity',()=>{
 const invalid=week();
 invalid.children[1].missions=[];
 assert.throws(()=>previewMessages(invalid,state(),'2026-11-23'),/preview_incomplete_missions/);
});
