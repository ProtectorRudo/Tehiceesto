import test from 'node:test';
import assert from 'node:assert/strict';
import {multiFamilyCapacity,permittedFamilyPhone,schedulingCapacity} from '../src/huella-enrollment.mjs';
import {initialState,processInbound} from '../src/flow.mjs';
import {prepareWeeklyDispatch} from '../src/huella-weekly.mjs';
import {generatePremiumWeek} from '../src/huella-ai.mjs';

const A='5492211234567',B='5492218765432',C='5492219876543';
const env={
 CERCA_PROVIDER:'whapi',CERCA_SEND_MODE:'test',CERCA_TEST_WA_IDS:A,
 HUELLA_WEEKLY_V2_ENABLED:'true',HUELLA_SOLO_PILOT_ENABLED:'true',
 HUELLA_WHAPI_SCHEDULED_ALLOWED:'true',HUELLA_MULTI_FAMILY_ENABLED:'true',
 HUELLA_MULTI_MAX_FAMILIES:'3',
 HUELLA_WHAPI_PILOT_START_DAY:'2026-11-21',
 HUELLA_WHAPI_PILOT_END_DAY:'2026-11-27',
 WHAPI_TOKEN:'fake-outbound-token-long-enough-00000',
 WHAPI_WEBHOOK_SECRET:'fake-webhook-secret-long-enough-00000',
 WHAPI_CHANNEL_ID:'CAPTAM-NWK3P',OPENAI_API_KEY:'mock-only-not-real'
};
test('multi-family registration is off by default and never opens a public chatbot',async()=>{
 const db={isInvited:async()=>{throw Error('DB must not be called without opt-in');}};
 assert.equal(multiFamilyCapacity({...env,HUELLA_MULTI_FAMILY_ENABLED:'false'}),0);
 assert.equal(schedulingCapacity({...env,HUELLA_MULTI_FAMILY_ENABLED:'false'}),1);
 assert.equal(await permittedFamilyPhone(A,{env:{...env,HUELLA_MULTI_FAMILY_ENABLED:'false'},db}),true);
 assert.equal(await permittedFamilyPhone(B,{env:{...env,HUELLA_MULTI_FAMILY_ENABLED:'false'},db}),false);
 for(const update of [{CERCA_SEND_MODE:'production'},{CERCA_PROVIDER:'evolution'},
  {HUELLA_MULTI_MAX_FAMILIES:'6'},{CERCA_TEST_WA_IDS:A+','+B},
  {HUELLA_SOLO_PILOT_ENABLED:'false'}]){
  assert.equal(multiFamilyCapacity({...env,...update}),0);
 }
 assert.equal(multiFamilyCapacity(env),3);
 assert.equal(schedulingCapacity(env),3);
});
test('operator invites only specific verified WhatsApp IDs, suspensions stop delivery',async()=>{
 const permitted=new Set([B,C]);
 const db={isInvited:async(phone,max)=>{
  assert.equal(max,2);
  return permitted.has(phone);
 }};
 assert.equal(await permittedFamilyPhone(A,{env,db}),true);
 assert.equal(await permittedFamilyPhone(B,{env,db}),true);
 assert.equal(await permittedFamilyPhone(C,{env,db}),true);
 assert.equal(await permittedFamilyPhone('5492200000000',{env,db}),false);
 permitted.delete(B);
 assert.equal(await permittedFamilyPhone(B,{env,db}),false);
 assert.equal(await permittedFamilyPhone('A-not-a-phone',{env,db}),false);
 assert.equal(await permittedFamilyPhone(B,{env,db:{}}),false);
});
const makeProfile=(name,childName,interest)=>{
 const state=initialState();
 state.status='onboarding';state.flow='adult_name';
 state.consentAt='2026-11-20T12:00:00Z';
 const items=[name,'Mamá','1',childName,'9',interest,'1','08:00'];
 let s=state;
 for(const item of items){
  const answer=processInbound(item,{state:s,today:'2026-11-20',now:'2026-11-20T18:00:00Z'});
  s=answer.state;
 }
 assert.equal(s.status,'active');
 assert.equal(s.huellaRegisteredDay,'2026-11-20');
 return s;
};
const missions=name=>['conectar','comprender','sembrar'].map(kind=>({
 kind,title:'Misión creada para '+name+' '+kind,
 intro:'Actividad personal de ejemplo',steps:['Invitar sin presión','Respetar su decisión'],
 why:'Compartir un momento de presencia',observe:'Escuchar una preferencia'
}));
const generate=async(state)=>{
 const child=state.children[0];
 return {children:[{name:child.name,missions:missions(child.name)}],
 weekly:{title:'Momento familiar de '+state.adultName,
  intro:'Tiempo en familia',steps:['Compartir','Escuchar'],
  why:'Estar presentes',observe:'Intereses expresados'}
 };
};
test('two adult records and mission outputs never inherit the other family name or interests',async()=>{
 const states=new Map([
  [A,makeProfile('Ana','Luz','dibujar')],
  [B,makeProfile('Beatriz','Nico','fútbol')]
 ]);
 assert.notEqual(states.get(A),states.get(B));
 assert.equal(states.get(A).children[0].name,'Luz');
 assert.equal(states.get(B).children[0].name,'Nico');
 assert.deepEqual(states.get(A).children[0].interests,['dibujar']);
 assert.deepEqual(states.get(B).children[0].interests,['fútbol']);
 const now=new Date('2026-11-21T11:00:00Z');
 for(const [phone,state] of states){
  const result=await prepareWeeklyDispatch(state,phone,now,{
   env,generate,approvedInvited:phone===B
  });
  assert.ok(result);
  assert.equal(result.jobs.length,1);
  assert.equal(result.slot,'sembrar');
  const body=result.jobs[0].payload.params[1];
  assert.match(body,new RegExp(phone===A?'Luz':'Nico'));
  assert.doesNotMatch(body,new RegExp(phone===A?'Nico':'Luz'));
  assert.notEqual(result.jobs[0].key,(await prepareWeeklyDispatch(states.get(phone===A?B:A),phone===A?B:A,now,
   {env,generate,approvedInvited:true})).jobs[0].key);
  states.set(phone,result.updated);
 }
 assert.equal(states.get(A).adultName,'Ana');
 assert.equal(states.get(B).adultName,'Beatriz');
 assert.equal(states.get(A).history[0].children[0].name,'Luz');
 assert.equal(states.get(B).history[0].children[0].name,'Nico');
 assert.equal(await prepareWeeklyDispatch(states.get(A),A,now,{env,generate}),null);
 assert.equal(await prepareWeeklyDispatch(states.get(B),B,now,{env,generate,approvedInvited:true}),null);
 assert.equal(await prepareWeeklyDispatch(makeProfile('Intruso','X','juego'),C,now,{env,generate}),null);
});
test('AI input receives only the selected family minimal profile, never another adult or number',async()=>{
 const names=[['Ana','Luz','dibujar'],['Beatriz','Nico','fútbol']];
 const captured=[];
 for(const [adult,child,interest] of names){
  const s=makeProfile(adult,child,interest);
  await generatePremiumWeek(s,'2026-11-16',{env,fetcher:async(_url,opts)=>{
   const payload=JSON.parse(opts.body);
   captured.push(JSON.stringify(JSON.parse(payload.input)));
   return new Response(JSON.stringify({status:'completed',output:[{content:[{
    type:'output_text',text:JSON.stringify({children:[],family:null})
   }]}]}),{status:200});
  }});
 }
 assert.match(captured[0],/Luz/);
 assert.doesNotMatch(captured[0],/Nico|Beatriz|5492218765432/);
 assert.match(captured[1],/Nico/);
 assert.doesNotMatch(captured[1],/Luz|Ana|5492211234567/);
});
