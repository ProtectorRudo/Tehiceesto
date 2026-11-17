import test from 'node:test';import assert from 'node:assert/strict';
import {initialState,processInbound,REDIRECT,formatMissions} from '../src/flow.mjs';
import {editorialBatch,validateBatch} from '../src/missions.mjs';
import {localClock,prepareDay,scheduledOutbox,isMessagingReady} from '../src/scheduler.mjs';
import {validSignature,extractMessages,buildPayload} from '../src/meta.mjs';
import {createHmac} from 'node:crypto';
const today='2026-11-16',now='2026-11-16T20:00:00Z';
function feed(seq,s=initialState()){
 let logs=[];for(const input of seq){const r=processInbound(input,{state:s,today,now});s=r.state;logs.push(...r.messages);}return {state:s,logs};
}
const ana=['hola','ACEPTO','Ana María','2','Leticia','9','dibujar, crear mundos','que pueda expresarse con confianza','Tomás','4','autos, bloques','jugar juntos sin apurarlo','mejorar los momentos de conversación','18:00'];
const registered=()=>feed(ana).state;
test('consent required, complete multi-child onboarding via finite stages',()=>{
 let r=feed(ana);assert.equal(r.state.status,'active');assert.ok(r.state.consentAt);assert.equal(r.state.children.length,2);assert.deepEqual(r.state.children.map(c=>c.age),[9,4]);assert.equal(r.state.deliveryTime,'18:00');assert.equal(r.state.monthlyGoal,'mejorar los momentos de conversación');
});
test('non-requested chat is never interpreted or answered conversationally',()=>{
 let s=registered();let a=feed(['No sabés lo que me pasó hoy con Leticia'],s);assert.equal(a.logs[0].body,REDIRECT);let b=feed(['Te cuento todo, fue increíble'],a.state);assert.equal(b.logs.length,0);
});
test('the user can opt out immediately; other messages are ignored',()=>{
 let a=feed(['BAJA','No sabés lo que me pasó hoy'],registered());assert.equal(a.state.status,'stopped');assert.equal(a.logs.length,1);assert.equal(a.state.consentAt,null);
});
test('deleting data wipes profile while preserving minimal suppression tombstone',()=>{
 const r=feed(['BORRAR','ELIMINAR'],registered());assert.equal(r.state.deleted,true);assert.equal(r.state.children.length,0);assert.equal(r.state.adultName,'');assert.equal(r.state.status,'stopped');
});
test('actual emergency redirection does not open advice conversation',()=>{
 const r=feed(['Mi hijo no respira'],registered());assert.match(r.logs[0].body,/emergencias/);assert.equal(r.logs.length,1);
});
test('editorial batch has exactly three missions per child and weekly family mission',()=>{
 const r=editorialBatch(registered(),today);assert.equal(r.children.length,2);assert.deepEqual(r.children.map(c=>c.missions.length),[3,3]);assert.equal(validateBatch(registered(),r),true);assert.ok(formatMissions(r).includes('Leticia'));assert.ok(formatMissions(r).includes('Tomás'));
});
test('age appropriateness and rotation',()=>{
 const st=registered();st.children[0].age=0;st.children[1].age=15;
 const a=editorialBatch(st,today);st.history=[a];const b=editorialBatch(st,'2026-11-17');
 assert.ok(a.children[0].missions.every(m=>!/(escribir|avanzada)/i.test(m.how)));assert.ok(a.children[1].missions.length===3);assert.notEqual(a.children[0].missions[0].title,b.children[0].missions[0].title);
});
test('weekly/daily schedule respects selected local hour and deduplicates',async()=>{
 let st=registered();const before=new Date('2026-11-16T20:59:00Z'); // Argentina 17:59
 assert.equal(await prepareDay(st,before,{templateDaily:'approved',generate:async(s,d)=>editorialBatch(s,d)}),null);
 const due=new Date('2026-11-16T21:00:00Z'); // Argentina 18:00
 const r=await prepareDay(st,due,{templateDaily:'approved',generate:async(s,d)=>editorialBatch(s,d)});assert.ok(r);assert.equal(r.updated.lastDailyDay,'2026-11-16');assert.equal(scheduledOutbox('5492211234567',r.batch,{templateDaily:'approved'}).length,2);
 assert.equal(await prepareDay(r.updated,due,{templateDaily:'approved',generate:async(s,d)=>editorialBatch(s,d)}),null);
 const all=scheduledOutbox('5492211234567',r.batch,{weekly:true,templateDaily:'approved',templateWeekly:'approved_week'});assert.equal(all.length,3);assert.equal(new Set(all.map(x=>x.key)).size,3);
});
test('Meta HMAC signatures protect webhook, interactive response parsed',()=>{
 const raw=Buffer.from('{"entry":[]}');const secret='a-test-secret';const signature='sha256='+createHmac('sha256',secret).update(raw).digest('hex');
 assert.equal(validSignature(raw,signature,secret),true);assert.equal(validSignature(Buffer.from('evil'),signature,secret),false);
 const data={entry:[{changes:[{value:{messages:[{id:'wamid.ABC',from:'5492211234567',timestamp:'1794873600',type:'interactive',interactive:{button_reply:{id:'ACEPTO'}}}]}}]}]};
 assert.equal(extractMessages(data)[0].text,'ACEPTO');
 assert.equal(buildPayload({body:'Elegí',options:['ACEPTO','NO']},'5492211234567').type,'interactive');
 assert.equal(buildPayload({kind:'template',name:'approved',params:['Ana','Texto']},'5492211234567').type,'template');
});

test('weekly mission is never marked delivered without approved template',async()=>{
 let st=registered();const due=new Date('2026-11-16T21:00:00Z');
 const noWeekly=await prepareDay(st,due,{templateDaily:'approved',generate:async(s,d)=>editorialBatch(s,d)});
 assert.ok(noWeekly);assert.equal(noWeekly.weekly,false);assert.equal(noWeekly.updated.lastWeeklyWeek,null);
 const valid=await prepareDay(st,due,{templateDaily:'approved',templateWeekly:'approved_week',generate:async(s,d)=>editorialBatch(s,d)});
 assert.ok(valid.weekly);assert.ok(valid.updated.lastWeeklyWeek);
 assert.equal(isMessagingReady({META_ACCESS_TOKEN:'x',META_PHONE_NUMBER_ID:'x',META_TEMPLATE_DAILY:'x',META_APP_SECRET:'x',META_VERIFY_TOKEN:'x'}),false);
});

test('first unsolicited ACEPTO cannot bypass showing informed opt-in question',()=>{
 let r=feed(['ACEPTO']);assert.equal(r.state.status,'pending');assert.equal(r.state.consentAt,null);assert.match(r.logs[0].body,/¿Aceptás recibir/);
 r=feed(['ACEPTO'],r.state);assert.equal(r.state.status,'onboarding');assert.ok(r.state.consentAt);
});

test('MENÚ during registration resumes required question instead of stranding onboarding',()=>{
 const r=feed(['hola','ACEPTO','Ana','MENÚ','2']);
 assert.equal(r.state.flow,'child_name');assert.equal(r.state.expectedChildren,2);
 assert.equal(r.state.status,'onboarding');
});

test('feedback is tied to a specific child and mission, not an ambiguous whole-day response',()=>{
 let st=registered();st.history=[editorialBatch(st,today)];
 const r=feed(['HECHA','2','Sembrar'],st);
 assert.equal(r.state.flow,'idle');assert.equal(r.state.feedbackLog.length,1);
 assert.deepEqual(Object.fromEntries(['childIndex','kind','answer'].map(k=>[k,r.state.feedbackLog[0][k]])),{childIndex:1,kind:'sembrar',answer:'hecha'});
 const updated=feed(['NO PUDE','2','Sembrar'],r.state);
 assert.equal(updated.state.feedbackLog.length,1);assert.equal(updated.state.feedbackLog[0].answer,'no pude');
});

test('BAJA does not block explicit deletion request',()=>{
 const r=feed(['BAJA','BORRAR','ELIMINAR'],registered());
 assert.equal(r.state.deleted,true);assert.equal(r.state.children.length,0);
});

test('no feedback is attributed when there are no missions today',()=>{
 const r=feed(['HECHA'],registered());assert.equal(r.state.feedbackLog.length,0);
 assert.match(r.logs[0].body,/Todavía no generamos/);
});

test('outbound transmission fails closed and test mode is recipient-allowlisted',async()=>{
 const {isAllowedRecipient}=await import('../src/scheduler.mjs');
 const creds={META_ACCESS_TOKEN:'t',META_PHONE_NUMBER_ID:'p',META_TEMPLATE_DAILY:'d',META_TEMPLATE_WEEKLY:'w',META_APP_SECRET:'s',META_VERIFY_TOKEN:'v'};
 assert.equal(isMessagingReady(creds),false);
 assert.equal(isMessagingReady({...creds,CERCA_SEND_MODE:'production'}),false);
 assert.equal(isMessagingReady({...creds,CERCA_SEND_MODE:'production',CERCA_PRODUCTION_AUTHORIZED:'true'}),true);
 assert.equal(isMessagingReady({...creds,CERCA_SEND_MODE:'test',CERCA_TEST_WA_IDS:'5492211234567'}),true);
 assert.equal(isAllowedRecipient('5492211234567',{CERCA_SEND_MODE:'test',CERCA_TEST_WA_IDS:'5492211234567'}),true);
 assert.equal(isAllowedRecipient('5492217654321',{CERCA_SEND_MODE:'test',CERCA_TEST_WA_IDS:'5492211234567'}),false);
});


test('Meta delivery receipts do not become chatbot inputs',async()=>{
 const {extractStatuses,extractMessages}=await import('../src/meta.mjs');
 const event={entry:[{changes:[{value:{statuses:[{id:'wamid.ABCD',status:'delivered',recipient_id:'5492211234567'},{id:'wamid.XYZ',status:'read'}]}}]}]};
 assert.deepEqual(extractMessages(event),[]);
 assert.deepEqual(extractStatuses(event),[{messageId:'wamid.ABCD',status:'delivered'},{messageId:'wamid.XYZ',status:'read'}]);
});


test('editorial fallback passes quality rules through 30 consecutive days in every age band',()=>{
 for(const age of [0,4,9,15]){
  const st=initialState();st.children=[{name:'Luz',age,interests:['historias'],goal:'confianza'}];
  for(let d=0;d<30;d++){
   const day=new Date(Date.UTC(2026,10,16+d)).toISOString().slice(0,10);
   const batch=editorialBatch(st,day);
   assert.equal(validateBatch(st,batch),true,`Misión fuera de estándar edad=${age} día=${day}`);
   st.history.push(batch);st.history=st.history.slice(-30);
  }
 }
});