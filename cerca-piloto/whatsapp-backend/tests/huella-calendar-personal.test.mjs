import test from 'node:test';
import assert from 'node:assert/strict';
import {familyCycleForDay,nextFamilyWeekStart,addCalendarDays,calendarWeekStart,FAMILY_CYCLE_SLOTS} from '../src/huella-calendar.mjs';
import {initialState,processInbound} from '../src/flow.mjs';
import {prepareWeeklyDispatch} from '../src/huella-weekly.mjs';

const PHONE='5492211234567';
const env={
 CERCA_PROVIDER:'whapi',CERCA_SEND_MODE:'test',CERCA_TEST_WA_IDS:PHONE,
 HUELLA_WEEKLY_V2_ENABLED:'true',HUELLA_SOLO_PILOT_ENABLED:'true',
 HUELLA_WHAPI_SCHEDULED_ALLOWED:'true',
 HUELLA_WHAPI_PILOT_START_DAY:'2026-11-21',
 HUELLA_WHAPI_PILOT_END_DAY:'2026-11-27',
 WHAPI_TOKEN:'private-test-token-1234567890',
 WHAPI_WEBHOOK_SECRET:'private-webhook-test-secret-123456789012345',
 WHAPI_CHANNEL_ID:'CAPTAM-NWK3P',OPENAI_API_KEY:'test-token'
};
const profile=(registered='2026-11-20')=>{
 const s=initialState();
 s.status='active';s.flow='idle';s.consentAt='2026-11-20T18:30:00.000Z';
 s.huellaRegisteredDay=registered;s.deliveryTime='08:00';s.adultName='Nombre oculto';
 s.children=[{name:'Hija mayor',age:9,interests:['animales'],goal:'conexión'},
             {name:'Bebé',age:0,ageMonths:6,interests:['sonidos'],goal:'conexión'}];
 return s;
};
const mission=kind=>({
 kind,title:'Experiencia breve con la familia '+kind,intro:'Propuesta de ejemplo para la prueba',
 steps:['Primero, invitá al encuentro.','Después, respetá las ganas de participar.'],
 why:'Una oportunidad de disfrutar juntos sin presión.',
 observe:'Ver si se produjo una elección libre.'
});
const generate=async()=>({
 children:[{name:'Hija mayor',missions:['conectar','comprender','sembrar'].map(mission)},
           {name:'Bebé',missions:['conectar','comprender','sembrar'].map(mission)}],
 weekly:{title:'Primer encuentro de la familia',intro:'Elegimos una experiencia',
  steps:['Preguntá si quieren compartir un rato.','Acompañá a quienes elijan participar.'],
  why:'Compartir tiempo elegido libremente.',observe:'Respetar el deseo de cada integrante.'}
});
test('weekdays NEVER shift: Monday family, Tue connect, Wed story, Thu understand, Friday rest, Sat grow, Sunday reflection',()=>{
 const weekdays=['family','conectar','story','comprender',null,'sembrar','reflection'];
 assert.deepEqual(FAMILY_CYCLE_SLOTS,weekdays);
 for(let i=0;i<7;i++){
  const day=addCalendarDays('2026-11-23',i);
  const r=familyCycleForDay('2026-11-19',day);
  assert.equal(r.slot,weekdays[i],day);
  assert.equal(r.key,'2026-11-23');
  assert.equal(r.slotIndex,i);
 }
});
test('registration Friday => Saturday grow, Sunday reflect, Monday family; no artificial delay until Monday',()=>{
 assert.equal(familyCycleForDay('2026-11-20','2026-11-20'),null);
 assert.deepEqual(
  ['2026-11-21','2026-11-22','2026-11-23','2026-11-24','2026-11-25','2026-11-26','2026-11-27']
   .map(d=>familyCycleForDay('2026-11-20',d)?.slot),
  ['sembrar','reflection','family','conectar','story','comprender',null]);
 assert.equal(familyCycleForDay('2026-11-20','2026-11-21').key,'2026-11-16');
 assert.equal(familyCycleForDay('2026-11-20','2026-11-23').key,'2026-11-23');
 assert.equal(nextFamilyWeekStart('2026-11-20','2026-11-22'),'2026-11-23');
});
test('registration on other days activates tomorrow without shifting the fixed weekday',()=>{
 const samples=[
  ['2026-11-23','2026-11-24','conectar'],
  ['2026-11-24','2026-11-25','story'],
  ['2026-11-25','2026-11-26','comprender'],
  ['2026-11-26','2026-11-27',null], // Friday is still a rest day
  ['2026-11-28','2026-11-29','reflection'],
  ['2026-11-29','2026-11-30','family']
 ];
 for(const [registration,next,slot] of samples){
  assert.equal(familyCycleForDay(registration,registration),null);
  assert.equal(familyCycleForDay(registration,next).slot,slot,next);
  assert.equal(familyCycleForDay(registration,next).key,calendarWeekStart(next));
 }
});
test('fixed calendar crosses years and leap dates without losing weekday alignment',()=>{
 assert.equal(addCalendarDays('2026-12-31',1),'2027-01-01');
 assert.equal(addCalendarDays('2028-02-28',1),'2028-02-29');
 assert.equal(addCalendarDays('2028-02-29',1),'2028-03-01');
 assert.equal(familyCycleForDay('2026-12-31','2027-01-01').slot,null);
 assert.equal(familyCycleForDay('2028-02-28','2028-02-29').slot,'conectar');
 assert.equal(familyCycleForDay('2026-02-30','2026-03-01'),null);
 assert.equal(nextFamilyWeekStart('2026-11-20','2026-11-23'),'2026-11-30');
});
test('onboarding completion stores the precise local registration date; start tomorrow',()=>{
 const s=profile();s.status='onboarding';s.flow='delivery_time';s.huellaRegisteredDay=null;
 const r=processInbound('1',{state:s,today:'2026-11-20',now:'2026-11-20T18:30:00Z'});
 assert.equal(r.state.status,'active');
 assert.equal(r.state.huellaRegisteredDay,'2026-11-20');
 assert.match(r.messages[0].body,/2026-11-21/);
 assert.equal(r.state.deliveryTime,'08:00');
});
test('one generation per CALENDAR week, begin Saturday and do not repeat weekday sends',async()=>{
 let s=profile(),calls=0;const maker=async()=>{calls++;return generate();};
 const dates=[
  ['2026-11-21','sembrar',2,'2026-11-16'],
  ['2026-11-22','reflection',1,'2026-11-16'],
  ['2026-11-23','family',1,'2026-11-23'],
  ['2026-11-24','conectar',2,'2026-11-23'],
  ['2026-11-25','story',1,'2026-11-23'],
  ['2026-11-26','comprender',2,'2026-11-23']
 ];
 for(const [day,slot,count,key] of dates){
  const now=new Date(day+'T11:00:00Z');
  const r=await prepareWeeklyDispatch(s,PHONE,now,{env,generate:maker});
  assert.ok(r,day);
  assert.equal(r.slot,slot);assert.equal(r.weekKey,key);
  assert.equal(r.jobs.length,count);
  assert.ok(r.jobs.every(j=>j.expires_at===new Date(day+'T23:59:59-03:00').toISOString()));
  assert.equal(await prepareWeeklyDispatch(r.updated,PHONE,now,{env,generate:maker}),null);
  s=r.updated;
 }
 assert.equal(await prepareWeeklyDispatch(s,PHONE,new Date('2026-11-27T11:00:00Z'),{env,generate:maker}),null);
 assert.equal(calls,2);
 assert.equal(s.huellaPilotStartDay,'2026-11-21');
 assert.equal(s.huellaWeekV2.key,'2026-11-23');
 assert.equal(s.history.length,3);
});
test('registration day, before chosen hour, after trial, strangers and unregistered profiles never dispatch',async()=>{
 const s=profile(), maker=async()=>{throw Error('unexpected generated API call');};
 for(const now of ['2026-11-20T11:00:00Z','2026-11-21T10:59:00Z','2026-11-28T11:00:00Z']){
  assert.equal(await prepareWeeklyDispatch(s,PHONE,new Date(now),{env,generate:maker}),null);
 }
 assert.equal(await prepareWeeklyDispatch(s,'5492219999999',new Date('2026-11-21T11:00:00Z'),{env,generate:maker}),null);
 assert.equal(await prepareWeeklyDispatch({...s,huellaRegisteredDay:null},PHONE,new Date('2026-11-21T11:00:00Z'),{env,generate:maker}),null);
});
