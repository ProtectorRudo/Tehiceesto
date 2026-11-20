import test from 'node:test';
import assert from 'node:assert/strict';
import {familyCycleForDay,nextFamilyWeekStart,addCalendarDays,FAMILY_CYCLE_SLOTS} from '../src/huella-calendar.mjs';
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
test('date-based cycle starts TOMORROW even if registered Friday, Monday or Sunday',()=>{
 for(const registration of ['2026-11-20','2026-11-23','2026-11-29']){
  const first=addCalendarDays(registration,1);
  assert.equal(familyCycleForDay(registration,registration),null);
  assert.equal(familyCycleForDay(registration,first).slot,'family');
  assert.equal(familyCycleForDay(registration,addCalendarDays(first,1)).slot,'conectar');
  assert.equal(familyCycleForDay(registration,addCalendarDays(first,4)).slot,null);
  assert.equal(familyCycleForDay(registration,addCalendarDays(first,6)).slot,'reflection');
  const second=addCalendarDays(first,7);
  assert.deepEqual(
   {key:familyCycleForDay(registration,second).key,slot:familyCycleForDay(registration,second).slot},
   {key:second,slot:'family'}
  );
  assert.equal(nextFamilyWeekStart(registration,first),second);
 }
 assert.equal(FAMILY_CYCLE_SLOTS.length,7);
});
test('calendar arithmetic crosses months, years and leap dates without skipping the next day',()=>{
 assert.equal(addCalendarDays('2026-12-31',1),'2027-01-01');
 assert.equal(addCalendarDays('2028-02-28',1),'2028-02-29');
 assert.equal(addCalendarDays('2028-02-29',1),'2028-03-01');
 assert.equal(familyCycleForDay('2026-12-31','2027-01-01').slot,'family');
 assert.equal(familyCycleForDay('2026-02-30','2026-03-01'),null);
});
test('onboarding completion stores local registration date, not a Monday',()=>{
 const s=profile();s.status='onboarding';s.flow='delivery_time';s.huellaRegisteredDay=null;
 const r=processInbound('1',{state:s,today:'2026-11-20',now:'2026-11-20T18:30:00Z'});
 assert.equal(r.state.status,'active');
 assert.equal(r.state.huellaRegisteredDay,'2026-11-20');
 assert.match(r.messages[0].body,/2026-11-21/);
 assert.equal(r.state.deliveryTime,'08:00');
});
test('one generation, start day family then complete all seven days in order',async()=>{
 let s=profile(),calls=0;
 const maker=async()=>{calls++;return generate();};
 const results=[];
 for(let i=0;i<7;i++){
  const day=addCalendarDays('2026-11-21',i);
  const now=new Date(day+'T11:00:00Z');
  const r=await prepareWeeklyDispatch(s,PHONE,now,{env,generate:maker});
  if(i===4){assert.equal(r,null);continue;} // Rest day for THIS family, independent of weekday
  assert.ok(r,day);
  assert.equal(r.slot,FAMILY_CYCLE_SLOTS[i]);
  assert.equal(r.jobs.length,[1,2,1,2,0,2,1][i]);
  assert.ok(r.jobs.every(j=>j.expires_at===new Date(day+'T23:59:59-03:00').toISOString()));
  assert.equal(await prepareWeeklyDispatch(r.updated,PHONE,now,{env,generate:maker}),null);
  s=r.updated;results.push(r);
 }
 assert.equal(calls,1);
 assert.equal(s.huellaPilotStartDay,'2026-11-21');
 assert.equal(s.huellaWeekV2.key,'2026-11-21');
 assert.deepEqual(results.map(x=>x.slot),['family','conectar','story','comprender','sembrar','reflection']);
 assert.equal(s.history.length,3);
 assert.equal(s.flow,'weekly_reflection');
});
test('registration day, before chosen hour, after bounded trial and other phone send nothing',async()=>{
 const s=profile(), maker=async()=>{throw Error('unexpected generated API call');};
 for(const now of ['2026-11-20T11:00:00Z','2026-11-21T10:59:00Z','2026-11-28T11:00:00Z']){
  assert.equal(await prepareWeeklyDispatch(s,PHONE,new Date(now),{env,generate:maker}),null);
 }
 assert.equal(await prepareWeeklyDispatch(s,'5492219999999',new Date('2026-11-21T11:00:00Z'),{env,generate:maker}),null);
 assert.equal(await prepareWeeklyDispatch({...s,huellaRegisteredDay:null},PHONE,new Date('2026-11-21T11:00:00Z'),{env,generate:maker}),null);
});
