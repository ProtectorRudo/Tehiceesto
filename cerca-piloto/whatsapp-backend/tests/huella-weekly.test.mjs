import test from 'node:test';
import assert from 'node:assert/strict';
import {generatePremiumWeek,validatePremiumWeek,contentModel} from '../src/huella-ai.mjs';
import {mondayOf,weeklyEnabled,prepareWeeklyDispatch,progressSummary,questionText,WEEKLY_SLOTS} from '../src/huella-weekly.mjs';
import {VERIFIED_STORIES,verifiedStoryFor,formatVerifiedStory} from '../src/huella-sources.mjs';
import {initialState,processInbound} from '../src/flow.mjs';

const PHONE='5492211234567';
const ENV={CERCA_PROVIDER:'evolution',CERCA_SEND_MODE:'test',CERCA_TEST_WA_IDS:PHONE,
 CERCA_EVOLUTION_SCHEDULED_ALLOWED:'true',EVOLUTION_TEMPLATE_DAILY:'daily_test',
 EVOLUTION_TEMPLATE_WEEKLY:'family_test',HUELLA_WEEKLY_V2_ENABLED:'true',
 HUELLA_SOLO_PILOT_ENABLED:'true',OPENAI_API_KEY:'fake-test-no-network'};
const NOW=day=>new Date(day+'T21:00:00Z');
const profile=()=>{
 const s=initialState();
 s.status='active';s.consentAt='2026-11-19T11:00:00Z';s.adultName='Nombre privado';
 s.deliveryTime='18:00';s.monthlyGoal='disfrutar momentos de conexión en familia';
 s.children=[
 {name:'Bebé',age:0,interests:['voces','sonidos'],goal:'atender mejor sus señales de comunicación'},
 {name:'Mayor',age:9,interests:['dibujar','inventar cuentos'],goal:'escuchar sus ideas con más paciencia'}];
 s.flow='idle';return s;
};
const mission=(kind,target,subj,i)=>({
 kind,title:'El encuentro especial de '+subj+' '+kind+' '+i,
 steps:[
  'Durante diez minutos, elegí con '+subj+' una experiencia para '+kind+' que respete su atención y su edad.',
  'En la misión '+kind+' para '+subj+', esperá su iniciativa, acompañá su decisión y anotá un detalle concreto.'
 ],
 why:'Esta propuesta ofrece la oportunidad de escuchar y respetar su participación sin convertirla en una evaluación.',
 observe:'Observá si mostró interés o si prefirió dejar la actividad para otro momento.',
 target
});
const fixture=()=>{
 const c=profile().children;
 return {children:c.map((x,i)=>({index:i,missions:
  ['conectar','comprender','sembrar'].map((kind,j)=>mission(kind,j===0?x.interests[0]:x.goal,x.name,i))})),
  family:{title:'La historia de nuestra semana juntos',
   steps:['Invitá a cada integrante a elegir un recuerdo pequeño y contarlo o mostrarlo a su manera.',
    'Escuchá sin interrumpir, respetá a quien no quiera hablar y decidí cómo guardar el recuerdo.'],
   why:'Conocer lo que fue significativo para cada integrante abre oportunidades para compartir sin exigencias.',
   observe:'Notá si surgió un detalle que desconocías o una preferencia que quieras respetar.'}};
};

test('premium editorial output must match real child goals and pass quality checks',()=>{
 const s=profile(),b=fixture();assert.equal(validatePremiumWeek(s,b),true);
 b.children[0].missions[0].target='le encanta el fútbol';
 assert.equal(validatePremiumWeek(s,b),false,'invented preferences are rejected');
});
test('premium model uses GPT-6.2 Sol high, strict JSON, no names, phone numbers or remote storage',async()=>{
 const s=profile(),week='2026-11-23';let called=0;
 const batch=await generatePremiumWeek(s,week,{env:{...ENV,OPENAI_MODEL:'gpt-6.1-terra'},fetcher:async(url,opts)=>{
  called++;assert.equal(url,'https://api.openai.com/v1/responses');
  const q=JSON.parse(opts.body);
  assert.equal(q.model,'gpt-6.2-sol');assert.equal(q.store,false);
  assert.equal(q.reasoning.effort,'high');
  assert.equal(q.text.format.type,'json_schema');assert.equal(q.text.format.strict,true);
  assert.ok(!q.input.includes('Nombre privado'));
  assert.ok(!q.input.includes('Bebé'));
  assert.ok(!q.input.includes(PHONE));
  assert.ok(q.input.includes('escuchar sus ideas con más paciencia'));
  return new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(fixture())}]}]}),{status:200});
 }});
 assert.equal(called,1);assert.equal(batch.children.length,2);
 assert.equal(batch.children[1].name,'Mayor');
 assert.equal(batch.children[0].missions[0].source,'ai_reviewed');
 assert.equal(contentModel({OPENAI_MODEL:'gpt-6.1-terra'}),'gpt-6.2-sol');
});
test('invalid or missing AI output is rejected, never replaced by generic missions',async()=>{
 const s=profile(),env={...ENV};
 await assert.rejects(generatePremiumWeek(s,'2026-11-23',{env:{...env,OPENAI_API_KEY:''}}),/huella_ai_not_configured/);
 await assert.rejects(generatePremiumWeek(s,'2026-11-23',{env,fetcher:async()=>new Response('{}',{status:429})}),/huella_ai_http_429/);
 await assert.rejects(generatePremiumWeek(s,'2026-11-23',{env,fetcher:async()=>new Response(JSON.stringify({status:'incomplete',output:[]}),{status:200})}),/huella_ai_incomplete/);
});
test('verified stories have identified publications and only stored source URLs are allowed',()=>{
 assert.ok(VERIFIED_STORIES.length>=3);
 assert.ok(VERIFIED_STORIES.every(x=>x.url.startsWith('https://www.unicef.org/')&&x.text.length>100));
 const story=verifiedStoryFor(profile(),'2026-11-23'),text=formatVerifiedStory(story);
 assert.match(text,/Historia real/);assert.match(text,/UNICEF/);assert.match(text,/https:\/\//);
 assert.throws(()=>formatVerifiedStory({id:'false',url:'https://invented.example'}),/unverified_story/);
});
test('weekly gate requires approved single-number consented pilot; nothing is scheduled by default',()=>{
 assert.equal(weeklyEnabled(ENV),true);
 for(const value of [
  {...ENV,HUELLA_WEEKLY_V2_ENABLED:'false'},
  {...ENV,HUELLA_SOLO_PILOT_ENABLED:'false'},
  {...ENV,CERCA_TEST_WA_IDS:PHONE+',5492219876543'},
  {...ENV,CERCA_SEND_MODE:'production'},
  {...ENV,CERCA_EVOLUTION_SCHEDULED_ALLOWED:'false'},
  {...ENV,OPENAI_API_KEY:''}
 ])assert.equal(weeklyEnabled(value),false);
 assert.equal(Object.keys(WEEKLY_SLOTS).length,6);
 assert.equal(WEEKLY_SLOTS.Fri,undefined);
});
test('premium week sends only the named slot on Mon Tue Wed Thu Sat Sun, with no Friday, no duplicates',async()=>{
 let s=profile(),generated=0,sent=[];
 const generate=async()=>{generated++;return {day:'2026-11-23',
  children:fixture().children.map((c,i)=>({name:s.children[i].name,missions:c.missions})),weekly:fixture().family};};
 const dates=[['2026-11-23','family',1],['2026-11-24','conectar',2],['2026-11-25','story',1],
 ['2026-11-26','comprender',2],['2026-11-28','sembrar',2],['2026-11-29','reflection',1]];
 for(const [day,slot,count] of dates){
  const r=await prepareWeeklyDispatch(s,PHONE,NOW(day),{env:ENV,generate});
  assert.ok(r,'expected '+day);assert.equal(r.slot,slot);assert.equal(r.jobs.length,count);
  assert.ok(r.jobs.every(job=>job.channel==='marketing'&&job.expires_at===new Date(day+'T23:59:59-03:00').toISOString()));
  assert.ok(r.jobs.every(job=>job.payload.params[1].length<=880));
  assert.equal(await prepareWeeklyDispatch(r.updated,PHONE,NOW(day),{env:ENV,generate}),null);
  sent.push(...r.jobs.map(job=>job.key));s=r.updated;
 }
 assert.equal(generated,1,'one high-quality API request per week');
 assert.equal(new Set(sent).size,sent.length);
 assert.equal(s.history.length,3,'only three mission days in history');
 assert.equal(s.huellaWeekV2.sentSlots.length,6);
 assert.equal(s.flow,'weekly_reflection');
 assert.equal(await prepareWeeklyDispatch(s,PHONE,NOW('2026-11-27'),{env:ENV,generate}),null,'Friday stays free');
 assert.equal(await prepareWeeklyDispatch(s,PHONE,new Date('2026-11-30T20:59:00Z'),{env:ENV,generate}),null,'no early scheduling');
 assert.equal(await prepareWeeklyDispatch(s,'5492219999999',NOW('2026-11-30'),{env:ENV,generate}),null,'other phone forbidden');
 assert.equal(s.huellaPilotStartDay,'2026-11-23');
});
test('weekly balance only uses recorded experience, never fabricates improvements',()=>{
 const s=profile();
 assert.match(progressSummary(s,'2026-11-23'),/no tenemos experiencias registradas/i);
 assert.doesNotMatch(progressSummary(s,'2026-11-23'),/mejoraste como padre/i);
 s.feedbackLog=[{day:'2026-11-24',childIndex:1,kind:'conectar',answer:'hecha',recordedAt:'2026-11-24T22:00:00Z'}];
 assert.match(progressSummary(s,'2026-11-23'),/Registraste 1 experiencia/);
 assert.match(progressSummary(s,'2026-11-23'),/Mayor/);
 assert.match(questionText(s,'2026-11-23'),/Podés contestar/);
});
test('one requested weekly reflection is safely recorded without starting an open chat',()=>{
 let s=profile();s.flow='weekly_reflection';s.huellaWeekV2={key:'2026-11-23',batch:null,sentSlots:['reflection']};
 let r=processInbound('Hoy escuché más y descubrí que le gusta dibujar',{state:s,today:'2026-11-29',now:'2026-11-29T22:00:00Z'});
 assert.equal(r.state.flow,'idle');
 assert.equal(r.state.weeklyReflections.length,1);
 assert.equal(r.state.weeklyReflections[0].weekKey,'2026-11-23');
 r=processInbound('No sabés lo que pasó con mi hija',{state:r.state,today:'2026-11-29',now:'2026-11-29T22:01:00Z'});
 assert.match(r.messages[0].body,/HUELLA funciona/);
});
test('30-day pilot refuses to schedule past its boundary',async()=>{
 const s=profile();s.huellaPilotStartDay='2026-10-01';
 const result=await prepareWeeklyDispatch(s,PHONE,NOW('2026-11-23'),{env:ENV,generate:async()=>{throw Error('must not run')}});
 assert.equal(result,null);
 assert.equal(mondayOf('2026-11-29'),'2026-11-23');
});