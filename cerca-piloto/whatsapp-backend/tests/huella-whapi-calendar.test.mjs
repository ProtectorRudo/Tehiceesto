import test from 'node:test';
import assert from 'node:assert/strict';
import {weeklyEnabled,prepareWeeklyDispatch,WEEKLY_SLOTS} from '../src/huella-weekly.mjs';
import {isMessagingReady} from '../src/scheduler.mjs';
import {formatWhapiText,sendWhapi} from '../src/whapi.mjs';

const PHONE='5492211234567';
const ENV={
 CERCA_PROVIDER:'whapi',CERCA_SEND_MODE:'test',CERCA_TEST_WA_IDS:PHONE,
 HUELLA_WEEKLY_V2_ENABLED:'true',HUELLA_SOLO_PILOT_ENABLED:'true',
 HUELLA_WHAPI_SCHEDULED_ALLOWED:'true',
 HUELLA_WHAPI_PILOT_START_DAY:'2026-11-23',HUELLA_WHAPI_PILOT_END_DAY:'2026-11-26',
 WHAPI_TOKEN:'private-mock-token-123456789012',WHAPI_WEBHOOK_SECRET:'mock-secret-0123456789012345678901234567',
 WHAPI_CHANNEL_ID:'CAPTAM-NWK3P',OPENAI_API_KEY:'mock-no-network'
};
const state=()=>{
 const s={status:'active',consentAt:'2026-11-19T13:00:00Z',flow:'idle',deleted:false,
 deliveryTime:'08:00',timezone:'America/Argentina/Buenos_Aires',
 huellaWeekV2:null,huellaPilotStartDay:null,history:[],feedbackLog:[],
 children:[{name:'Mayor',age:9,interests:['dibujar']},{name:'Bebé',age:0,ageMonths:6,interests:['canciones']}]};
 return s;
};
const mini={kind:'conectar',title:'Nuestro momento de prueba',intro:'Un juego simple',
 steps:['Primera actividad','Segunda actividad'],why:'Mirarnos y escucharnos',observe:'¿Qué descubrimos?'};
const batch=()=>{
 return {children:[
  {name:'Mayor',missions:[mini]},
  {name:'Bebé',missions:[mini]}
 ],weekly:{title:'La propuesta de nuestra familia',intro:'El juego',
  steps:['Todos escuchamos juntos','Todos saludamos juntos'],why:'Compartir un rato',observe:'Respetar decisiones'}};
};
test('Whapi weekly requires exactly one test number, AI, exact dates and opt-in',()=>{
 assert.equal(weeklyEnabled(ENV),true);
 assert.equal(isMessagingReady(ENV),true);
 for(const change of [
  {HUELLA_WHAPI_SCHEDULED_ALLOWED:'false'},
  {HUELLA_WEEKLY_V2_ENABLED:'false'},
  {HUELLA_SOLO_PILOT_ENABLED:'false'},
  {CERCA_SEND_MODE:'production'},
  {CERCA_TEST_WA_IDS:PHONE+',5492210000000'},
  {OPENAI_API_KEY:''},
  {WHAPI_TOKEN:''},{WHAPI_WEBHOOK_SECRET:''},
  {HUELLA_WHAPI_PILOT_START_DAY:''},
  {HUELLA_WHAPI_PILOT_END_DAY:'2026-12-30'}
 ]) {
  assert.equal(weeklyEnabled({...ENV,...change}),false,JSON.stringify(change));
 }
});
test('Monday family event is generated once and uses Whapi-only pilot payload',async()=>{
 let count=0,s=state();
 const now=new Date('2026-11-23T11:00:00Z');
 const generator=async()=>{count++;return batch();};
 const first=await prepareWeeklyDispatch(s,PHONE,now,{env:ENV,generate:generator});
 assert.equal(first.slot,'family');
 assert.equal(first.jobs.length,1);
 assert.equal(first.jobs[0].channel,'marketing');
 assert.equal(first.jobs[0].payload.kind,'template');
 assert.equal(first.jobs[0].payload.name,'HUELLA_WHAPI_PILOT');
 assert.equal(formatWhapiText(first.jobs[0].payload,{env:ENV,now}).includes('Momento familiar'),true);
 assert.equal(first.updated.huellaPilotStartDay,'2026-11-23');
 assert.equal(await prepareWeeklyDispatch(first.updated,PHONE,now,{env:ENV,generate:generator}),null);
 assert.equal(count,1);
 assert.equal(WEEKLY_SLOTS.Fri,undefined);
});
test('Calendar forbids Friday, Saturday past trial, Sunday past trial, too early, and outsiders',async()=>{
 let gen=0;const generator=async()=>{gen++;return batch();};
 const before=await prepareWeeklyDispatch(state(),PHONE,new Date('2026-11-21T11:00:00Z'),{env:ENV,generate:generator});
 const after=await prepareWeeklyDispatch(state(),PHONE,new Date('2026-11-28T11:00:00Z'),{env:ENV,generate:generator});
 const early=await prepareWeeklyDispatch(state(),PHONE,new Date('2026-11-23T10:59:00Z'),{env:ENV,generate:generator});
 const other=await prepareWeeklyDispatch(state(),'5492219999999',new Date('2026-11-23T11:00:00Z'),{env:ENV,generate:generator});
 assert.equal(before,null);assert.equal(after,null);assert.equal(early,null);assert.equal(other,null);assert.equal(gen,0);
});
test('Whapi outbound refuses any unsolicited scheduled content after trial and invalid template',async()=>{
 const fake={kind:'template',name:'HUELLA_WHAPI_PILOT',params:['Familia','Texto de misión verificada']};
 const send=()=>{throw Error('forbidden network request');};
 assert.equal(formatWhapiText(fake,{env:ENV,now:new Date('2026-11-23T11:00:00Z')}),'Texto de misión verificada');
 for(const dt of ['2026-11-20T11:00:00Z','2026-11-27T11:00:00Z']){
  await assert.rejects(sendWhapi(fake,PHONE,{env:ENV,now:new Date(dt),fetcher:send}),/whapi_scheduled_disabled/);
 }
 await assert.rejects(sendWhapi({...fake,name:'other'},PHONE,{env:ENV,now:new Date('2026-11-23T11:00:00Z'),fetcher:send}),/whapi_scheduled_disabled/);
 await assert.rejects(sendWhapi(fake,PHONE,{env:{...ENV,HUELLA_WHAPI_SCHEDULED_ALLOWED:'false'},now:new Date('2026-11-23T11:00:00Z'),fetcher:send}),/whapi_scheduled_disabled/);
});
