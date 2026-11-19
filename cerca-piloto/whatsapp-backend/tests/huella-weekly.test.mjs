import test from 'node:test';
import assert from 'node:assert/strict';
import {generatePremiumWeek,validatePremiumWeek,premiumWeekQuality,deliveryReadiness,partitionDeliverableWeek,completeMissionSlots,contentModel,neutralizeInfantWording,containsInfantHazardInstruction} from '../src/huella-ai.mjs';
import {mondayOf,weeklyEnabled,prepareWeeklyDispatch,progressSummary,questionText,splitLongMission,WEEKLY_SLOTS} from '../src/huella-weekly.mjs';
import {VERIFIED_STORIES,verifiedStoryFor,formatVerifiedStory} from '../src/huella-sources.mjs';
import {initialState,processInbound,formatMissions} from '../src/flow.mjs';

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
 {name:'Bebé',age:0,ageMonths:5,interests:['voces','sonidos'],goal:'atender mejor sus señales de comunicación'},
 {name:'Mayor',age:9,interests:['dibujar','inventar cuentos'],goal:'escuchar sus ideas con más paciencia'}];
 s.flow='idle';return s;
};
const mission=(kind,target,subj,i)=>({
 kind,title:'El encuentro especial de '+subj+' '+kind+' '+i,
 intro:'Hoy van a compartir una actividad sencilla que aprovecha sus intereses para estar presentes, escuchar y seguir su iniciativa sin apurarse.',
 setup:'La misión se hace en casa, con una hoja y un lápiz que ya tengas. Elegí una mesa despejada y dejá que quien participa decida dónde sentarse.',
 opening:'«¿Te gustaría que hagamos un juego corto juntos? Vos podés elegir cómo comenzamos y yo te acompaño.»',
 example:'Por ejemplo, si elige dibujar una puerta imaginaria, preguntale adónde lleva. Si inventa un bosque, aceptá ese lugar y agregá una idea solo si lo pide.',
 ifNo:'Si hoy no quiere participar, dejá la hoja guardada y ofrecé compartir un momento tranquilo en otra ocasión, sin insistir.',
 steps:[
  'Durante diez minutos, elegí con '+subj+' una experiencia para '+kind+' que respete su atención y su edad.',
  'En la misión '+kind+' para '+subj+', esperá su iniciativa, acompañá su decisión y anotá un detalle concreto.'
 ],
 why:'Esta propuesta ofrece la oportunidad de escuchar y respetar su participación sin convertirla en una evaluación.',
 observe:'Observá si mostró interés o si prefirió dejar la actividad para otro momento.',
 target,skill:kind==='sembrar'?'exploración e iniciativa':'no aplica'
});
const fixture=()=>{
 const c=profile().children;
 return {children:c.map((x,i)=>({index:i,missions:
  ['conectar','comprender','sembrar'].map((kind,j)=>mission(kind,j===0?x.interests[0]:x.goal,x.name,i))})),
  family:{title:'La historia de nuestra semana juntos',
   intro:'Van a elegir entre todos un recuerdo pequeño para compartir, sin competir por cuál fue más importante ni exigir que nadie participe.',
   setup:'En el living o la mesa, dejá a mano una hoja y un lápiz; no se requiere nada especial. El bebé puede acompañar desde un lugar seguro y cómodo.',
   opening:'«¿Les parece que compartamos un recuerdo pequeño de la semana? Cada persona puede participar a su manera.»',
   example:'Por ejemplo, alguien recuerda un paseo; podés preguntarle qué detalle le llamó la atención. El bebé puede estar cerca, sin tener que hacer ninguna actividad.',
   ifNo:'Si alguien no tiene ganas de contar nada, puede escuchar. Si hoy no se da, guarden la propuesta para otro día sin insistir.',
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
 assert.ok(VERIFIED_STORIES.every(x=>x.url.startsWith('https://www.unicef.org/')&&x.paragraphs?.length===3&&x.paragraphs.every(p=>p.length>100)));
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
  assert.ok(r.jobs.every(job=>job.payload.params[1].length<=3400));
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
 assert.equal(r.state.flow,'weekly_goal_choice');
 assert.equal(r.state.weeklyReflections.length,1);
 assert.equal(r.state.weeklyReflections[0].weekKey,'2026-11-23');
 assert.match(r.messages.at(-1).body,/objetivo/i);
 r=processInbound('0',{state:r.state,today:'2026-11-29',now:'2026-11-29T22:01:00Z'});
 assert.equal(r.state.flow,'weekly_goal_choice');
 r=processInbound('0',{state:r.state,today:'2026-11-29',now:'2026-11-29T22:02:00Z'});
 assert.equal(r.state.flow,'idle');
 r=processInbound('No sabés lo que pasó con mi hija',{state:r.state,today:'2026-11-29',now:'2026-11-29T22:03:00Z'});
 assert.match(r.messages[0].body,/HUELLA funciona/);
});
test('30-day pilot refuses to schedule past its boundary',async()=>{
 const s=profile();s.huellaPilotStartDay='2026-10-01';
 const result=await prepareWeeklyDispatch(s,PHONE,NOW('2026-11-23'),{env:ENV,generate:async()=>{throw Error('must not run')}});
 assert.equal(result,null);
 assert.equal(mondayOf('2026-11-29'),'2026-11-23');
});
test('quality gate distinguishes practiceable skills from affectionate-only rituals',()=>{
 const s=profile(),valid=fixture();
 assert.equal(validatePremiumWeek(s,valid),true);
 const a=structuredClone(valid);
 a.children[1].missions[2].skill='cariño';
 assert.equal(validatePremiumWeek(s,a),false,'a generic affection label is not a skill');
 const b=structuredClone(valid);
 b.children[1].missions[0].skill='autonomía';
 assert.equal(validatePremiumWeek(s,b),false,'connecting must not pretend to be sowing a skill');
});
test('without a declared child gender, infant mission cannot assume masculine or feminine agreement',()=>{
 const s=profile(),valid=fixture();
 for(const phrase of ['Cuando esté despierto, elegí un momento tranquilo para iniciar la actividad compartida.',
                       'Al cambiarlo de posición, esperá un momento para acompañar lo que le interese.']){
  const b=structuredClone(valid);b.children[0].missions[0].steps[0]=phrase;
  assert.equal(validatePremiumWeek(s,b),false,phrase);
 }
});

test('an explanatory introduction is required for every real weekly mission',()=>{
 const s=profile(),batch=fixture();
 assert.equal(validatePremiumWeek(s,batch),true);
 const missing=structuredClone(batch);
 delete missing.children[0].missions[0].intro;
 assert.equal(validatePremiumWeek(s,missing),false);
 const unhelpful=structuredClone(batch);
 unhelpful.children[1].missions[2].intro='Jugá.';
 assert.equal(validatePremiumWeek(s,unhelpful),false);
 const noFamilyContext=structuredClone(batch);
 delete noFamilyContext.family.intro;
 assert.equal(validatePremiumWeek(s,noFamilyContext),false);
});
test('storytelling preserves a documented challenge, a decision and an outcome',()=>{
 const hazem=VERIFIED_STORIES.find(x=>x.id==='hazem');
 const text=formatVerifiedStory(hazem);
 assert.match(text,/Mona y Elsayed/);
 assert.match(text,/Eman/);
 assert.match(text,/talleres de crianza positiva/);
 assert.match(text,/Hassan/);
 assert.match(text,/Fuente original:/);
 assert.ok(text.indexOf('Eman')<text.indexOf('Hassan'),'challenge and action precede outcome');
 for(const story of VERIFIED_STORIES){
  const result=formatVerifiedStory(story);
  assert.ok(result.length<=2100,story.id+' must fit in one pilot WhatsApp message');
  assert.ok(!result.includes('[pendiente]'));
  assert.ok(story.paragraphs.length===3);
 }
});
test('mixed-age families receive stories for both stages over consecutive weeks',()=>{
 const s=profile();
 const a=verifiedStoryFor(s,'2026-11-23'),b=verifiedStoryFor(s,'2026-11-30');
 const babyRelevant=x=>x.minAge===0;
 assert.notEqual(babyRelevant(a),babyRelevant(b));
});

test('MISIONES command explains each real premium mission without undefined or oversized combined text',()=>{
 const s=profile(),batch=fixture();
 s.history=[{day:'2026-11-24',children:batch.children.map((c,index)=>({
  name:s.children[index].name,missions:c.missions.filter(m=>m.kind==='conectar')
 })),weekly:null}];
 const response=processInbound('MISIONES',{state:s,today:'2026-11-24',now:'2026-11-24T18:00:00Z'});
 assert.equal(response.messages.length,2,'one readable reply per child instead of a merged oversized message');
 assert.ok(response.messages.every(m=>m.body.includes('De qué se trata:')&&m.body.includes('Cómo hacerlo:')));
 assert.ok(response.messages.every(m=>m.body.includes('Qué buscamos con esta experiencia:')));
 assert.ok(response.messages.every(m=>!m.body.includes('undefined')&&m.body.length<3600));
 assert.match(formatMissions({day:'2026-11-24',children:[s.history[0].children[0]],weekly:null}),/De qué se trata/);
});

test('a playable mission requires specific preparation, invitation, demonstration, and fallback',()=>{
 const s=profile(),good=fixture();
 assert.equal(validatePremiumWeek(s,good),true);
 for(const field of ['setup','opening','example','ifNo']){
  const b=structuredClone(good);delete b.children[1].missions[1][field];
  assert.equal(validatePremiumWeek(s,b),false,'missing '+field+' must reject an incomplete mission');
  const family=structuredClone(good);delete family.family[field];
  assert.equal(validatePremiumWeek(s,family),false,'family mission missing '+field);
 }
});
test('WhatsApp daily and family missions explain how to start and play, not just promise a connection',async()=>{
 const {missionText,familyText}=await import('../src/huella-weekly.mjs');
 const batch=fixture();
 const daily=missionText('Mayor',batch.children[1].missions[1]);
 const family=familyText(batch.family);
 for(const text of [daily,family]){
  assert.match(text,/Preparación:/);
  assert.match(text,/Qué decir para empezar:/);
  assert.match(text,/Cómo hacerlo:/);
  assert.match(text,/Ejemplo de cómo (?:jugar|hacerlo):/);
  assert.match(text,/Qué buscamos con esta experiencia:/);
  assert.ok(text.length<=3400,'no truncated WhatsApp payload');
 }
});

test('a fictional world must be mapped to actual playable places, not just described metaphorically',()=>{
 const profileState=profile(),b=fixture(),m=b.children[1].missions[1];
 m.intro='Van a convertir la plaza en un mundo Pokémon imaginario para que uno decida qué aventuras inventar y el otro siga las reglas del juego.';
 m.setup='Reunite en la plaza, observá los lugares disponibles y buscá un espacio tranquilo donde puedan comenzar la aventura sin materiales.';
 m.example='Por ejemplo, cuando lleguen a la plaza preguntale qué Pokémon le gustaría imaginar allí y seguí la idea que proponga mientras caminan.';
 assert.equal(validatePremiumWeek(profileState,b),false,'a catchy metaphor is not a playable set of instructions');
 m.setup='Un árbol será el Bosque Pokémon y el banco hará de Centro Pokémon; usen esos dos lugares reales como escenarios imaginarios sin materiales.';
 assert.equal(validatePremiumWeek(profileState,b),true,'physical-to-imaginary mappings make the scene actionable');
});
test('the invitation must contain words the adult can literally say, not a vague suggestion',()=>{
 const b=fixture(),m=b.children[1].missions[0];
 m.opening='Invitá a participar de un juego interesante y empezá a compartir un rato juntos, de forma natural.';
 assert.equal(validatePremiumWeek(profile(),b),false);
 m.opening='«¿Te gustaría que hoy inventemos una aventura juntos? Vos elegís el primer paso y yo te acompaño.»';
 assert.equal(validatePremiumWeek(profile(),b),true);
});

test('infant monthly age must be present before a paid weekly generation',async()=>{
 const s=profile(),mock=async()=>{throw Error('MUST NOT CALL API')};
 delete s.children[0].ageMonths;
 await assert.rejects(generatePremiumWeek(s,'2026-11-23',{env:ENV,fetcher:mock}),/huella_infant_months_missing/);
 s.children[0].ageMonths=18;
 await assert.rejects(generatePremiumWeek(s,'2026-11-23',{env:ENV,fetcher:mock}),/huella_infant_months_missing/);
});
test('infant editorial gate rejects artificial motor-response experiments',()=>{
 const s=profile(),valid=fixture();
 assert.equal(validatePremiumWeek(s,valid),true);
 const artificial=structuredClone(valid);
 artificial.children[0].missions[1].example='Si mueve una pierna, respondé con una O y volvé a esperar unos segundos para ver qué sucede durante la interacción compartida.';
 assert.equal(validatePremiumWeek(s,artificial),false);
});

test('protective language is not rejected by a blacklist intended for harmful instructions',()=>{
 const s=profile(),original=fixture(),safe=structuredClone(original);
 safe.children[0].missions[0].ifNo='Si no tiene ganas de participar, no lo fuerces ni lo obligues: acompañá lo que necesite en ese momento y dejá el juego para otro día.';
 const checked=premiumWeekQuality(s,safe);
 assert.deepEqual(checked.codes,[],JSON.stringify(checked.codes));
 const harmful=structuredClone(original);
 harmful.children[0].missions[0].ifNo='Si rechaza el juego, obligalo a participar de todos modos y continuá aunque se resista, sin detener la actividad propuesta.';
 const result=premiumWeekQuality(s,harmful);
 assert.equal(result.ok,false);
 assert.ok(result.codes.includes('child0:conectar:ifNo'));
});
test('quality rejection reveals only non-identifying field codes, not child names or raw mission content',()=>{
 const s=profile(),v=fixture();
 v.children[0].missions[0].target='inventé algo que el perfil nunca mencionó';
 const report=premiumWeekQuality(s,v);
 assert.equal(report.ok,false);
 assert.ok(report.codes.includes('child0:conectar:target_not_from_profile'));
 assert.ok(!JSON.stringify(report).includes('Bebé'));
 assert.ok(!JSON.stringify(report).includes('inventé algo'));
 const invalid=structuredClone(v);
 invalid.children[0].missions[1].example='Un ejemplo muy corto';
 assert.ok(premiumWeekQuality(s,invalid).codes.includes('child0:comprender:example'));
});

test('infant safety gate distinguishes clear hazard-prevention text from use of dangerous objects',()=>{
 const positive=[
  'Colocá un globo cerca del bebé para jugar mientras se encuentra en brazos.',
  'No uses globos, pero colocá una tapita cerca del bebé para que pueda tocarla.',
  'Dejá al bebé solo con un cordón sobre la mesa.',
  'Ofrecé unas cuentas de colores para que pueda tocarlas y explorarlas.',
  'Poné una tapita pequeña al alcance del bebé y esperá a que la toque.',
  'Usá un cordón de tela para mostrarle cómo se mueve sobre la mesa.',
  'Extendé una manta sobre la cara para continuar el juego.'
 ];
 for(const instruction of positive)assert.equal(containsInfantHazardInstruction(instruction),true,instruction);
 const protective=[
  'No uses globos ni cordones durante el juego.',
  'Evitá los globos y las cuentas pequeñas; compartí un libro de imágenes de cartón.',
  'Hacé el juego sin tapitas y sin piezas pequeñas.',
  'Tené en cuenta el ritmo del bebé y mantené la postura cómoda.',
  'No dejes al bebé solo durante la actividad.',
  'No colocar una manta sobre la cara.'
 ];
 for(const instruction of protective)assert.equal(containsInfantHazardInstruction(instruction),false,instruction);
});
test('protective infant risk wording no longer blocks an otherwise valid mission, but unsafe proposals still fail',()=>{
 const state=profile(),safe=fixture();
 safe.children[0].missions[2].steps[0]=
  'Elegí un momento tranquilo sin globos y sin objetos pequeños; compartí una canción conocida al lado del bebé.';
 assert.equal(validatePremiumWeek(state,safe),true,JSON.stringify(premiumWeekQuality(state,safe).codes));
 const dangerous=structuredClone(safe);
 dangerous.children[0].missions[2].steps[0]=
  'Colocá un globo de colores cerca del bebé para que lo toque durante la canción y puedan compartir un rato.';
 const report=premiumWeekQuality(state,dangerous);
 assert.equal(report.ok,false);
 assert.ok(report.codes.includes('child0:sembrar:infant_hazard'));
});
test('neutralizes limited gender-agreement phrasing without changing actions, goals or safety-relevant objects',()=>{
 const mission={kind:'conectar',title:'Juego corto',
  intro:'Si está despierto podemos compartir un rato.',
  setup:'No hace falta cambiarla de posición para comenzar; dejá el libro donde está.',
  opening:'«Cuando esté despierta y a gusto podemos mirar un libro.»',
  example:'Si está inquieta, atendela primero y respetá que pueda descansar.',
  steps:['Cuando esté despierto, hablá con calma.'],
  ifNo:'Si está cansada, terminá el juego.',
  why:'No estamos probando habilidades.',
  observe:'Si está contenta, acompañá su tranquilidad.'};
 const original=structuredClone(mission);
 const normalized=neutralizeInfantWording(mission);
 assert.ok(!JSON.stringify(normalized).match(/despiert[oa]|inquiet[oa]|cansad[oa]|content[oa]|cambiarla|atendela/i));
 assert.equal(normalized.kind,mission.kind);assert.equal(normalized.title,mission.title);
 assert.ok(normalized.setup.includes('libro'));
 assert.deepEqual(mission,original,'do not mutate original generation');
});

test('editorial preferences, arbitrary lengths, and repeated wording NEVER block a safe mission',()=>{
 const p=profile(),week=fixture();
 const m=week.children[0].missions[0];
 m.target='Una variación que el usuario no escribió literalmente';
 m.title='Corta';
 m.opening='Podés proponer una canción corta y familiar.';
 m.intro='Hagan una canción juntos';
 week.children[1].missions[1].title=week.children[1].missions[0].title;
 const strict=premiumWeekQuality(p,week);
 assert.equal(strict.ok,false,'editorial issues should still be diagnosed');
 const deliver=deliveryReadiness(p,week);
 assert.equal(deliver.ok,true,JSON.stringify(deliver.hard));
 assert.ok(deliver.advisories.some(x=>x.includes('target_not_from_profile')));
 assert.ok(deliver.advisories.some(x=>x.includes('title_repeated')));
});
test('only unusable instructions and definite safety risks block delivery',()=>{
 const p=profile();
 const malformed=fixture();malformed.children[0].missions[0].steps=[];
 const a=deliveryReadiness(p,malformed);
 assert.equal(a.ok,false);assert.ok(a.hard.includes('child0:conectar:missing_essential_content'));
 const dangerous=fixture();
 dangerous.children[0].missions[2].steps[0]=
  'Colocá un globo delante del bebé para que lo toque y jueguen con ese objeto pequeño al alcance de su cuerpo.';
 const b=deliveryReadiness(p,dangerous);
 assert.equal(b.ok,false);assert.ok(b.hard.includes('child0:sembrar:infant_hazard'));
 const protectedInstructions=fixture();
 protectedInstructions.children[0].missions[2].steps[0]=
  'Cantá una canción suave sin globos ni cordones cerca del bebé, compartiendo un momento tranquilo y seguro.';
 const c=deliveryReadiness(p,protectedInstructions);
 assert.equal(c.ok,true,JSON.stringify(c.hard));
});
test('a whole-week Sol generation delivers complete, harmless missions even with editorial warnings',async()=>{
 const p=profile(),obj=fixture();
 obj.children[1].missions[1].title=obj.children[1].missions[0].title;
 const r=await generatePremiumWeek(p,'2026-11-23',{env:ENV,
  fetcher:async()=>new Response(JSON.stringify({status:'completed',output:[{
   content:[{type:'output_text',text:JSON.stringify(obj)}]}]}),{status:200})
 });
 assert.equal(r.children.length,2);
 assert.equal(r.children[1].missions.length,3);
 assert.ok(r.editorialWarnings.some(x=>x.includes('title_repeated')));
});

test('long safe mission text is split at paragraphs instead of rejected',()=>{
 const source=['Alfa: '+('x'.repeat(850)),'Beta: '+('y'.repeat(850)),
  'Gamma: '+('z'.repeat(850)),'Delta: '+('w'.repeat(850))].join('\n\n');
 const parts=splitLongMission(source,2000);
 assert.ok(parts.length>1);
 assert.ok(parts.every(part=>part.length<=2000));
 assert.equal(parts.join('\n\n'),source);
});

test('a single unsafe infant skill is quarantined but the other six missions and family survive',async()=>{
 const profileState=profile(),output=fixture();
 const child=output.children[0];
 child.missions[2].steps[0]='Ofrecé un globo de colores al bebé para sostenerlo y jugar con sus manos durante la canción.';
 const reviewed=partitionDeliverableWeek(profileState,output);
 assert.equal(reviewed.ok,true);
 assert.ok(reviewed.withheld.includes('child0:sembrar:infant_hazard'));
 assert.deepEqual(reviewed.children[0].missions.map(x=>x.kind),['conectar','comprender']);
 assert.equal(reviewed.children[1].missions.length,3);
 assert.ok(reviewed.family);
 const generated=await generatePremiumWeek(profileState,'2026-11-23',{env:ENV,
  fetcher:async()=>new Response(JSON.stringify({status:'completed',output:[
   {content:[{type:'output_text',text:JSON.stringify(output)}]}]}),{status:200})
 });
 assert.deepEqual(generated.withheld,[]);
 assert.ok(generated.replaced.includes('child0:sembrar'));
 assert.equal(generated.children[0].missions.length,3);
 assert.equal(generated.children[0].missions[2].source,'curated_safe_alternative');
 assert.equal(generated.children[1].missions.length,3);
 assert.equal(generated.weekly.title,output.family.title);
 assert.ok(!JSON.stringify(generated).includes('Ofrecé un globo'));
});
test('quarantined baby skill does not prevent sibling skill being delivered on Saturday',async()=>{
 let state=profile(),generation=0;
 const initial=fixture();
 initial.children[0].missions.splice(2,1);
 const produce=async()=>{
  generation++;
  return {day:'2026-11-23',children:[
   {name:state.children[0].name,missions:initial.children[0].missions},
   {name:state.children[1].name,missions:initial.children[1].missions}
  ],weekly:initial.family,withheld:['child0:sembrar:infant_hazard']};
 };
 const monday=await prepareWeeklyDispatch(state,PHONE,NOW('2026-11-23'),{env:ENV,generate:produce});
 assert.equal(monday.jobs.length,1);
 state=monday.updated;
 const saturday=await prepareWeeklyDispatch(state,PHONE,NOW('2026-11-28'),{env:ENV,generate:produce});
 assert.equal(saturday.jobs.length,1,'safe sibling skill is still delivered');
 assert.match(saturday.jobs[0].payload.params[1],/SEMBRAR/);
 assert.ok(!saturday.jobs[0].payload.params[1].includes('Bebé'));
 assert.equal(generation,1);
 assert.equal(saturday.updated.history.at(-1).children[0].missions.length,0);
 assert.equal(saturday.updated.history.at(-1).children[1].missions.length,1);
 assert.equal(await prepareWeeklyDispatch(saturday.updated,PHONE,NOW('2026-11-28'),{env:ENV,generate:produce}),null);
});
test('a quarantined family activity does not force a second paid model generation next day',async()=>{
 const p=profile(),obj=fixture();
 obj.family.steps[0]='Ofrecé unos globos y cuentas pequeñas al bebé para que juegue con ellos.';
 const part=partitionDeliverableWeek(p,obj);
 assert.equal(part.ok,true);
 assert.equal(part.family,null);
 assert.ok(part.withheld.includes('family:infant_hazard'));
 let count=0;
 const generate=async()=>{
  count++;
  return {day:'2026-11-23',children:part.children.map((c,i)=>({name:p.children[i].name,missions:c.missions})),
   weekly:null,withheld:part.withheld};
 };
 const monday=await prepareWeeklyDispatch(p,PHONE,NOW('2026-11-23'),{env:ENV,generate});
 assert.equal(monday.generationBlocked,true);
 assert.equal(monday.jobs.length,0);
 assert.equal(monday.updated.huellaPilotStartDay,null);
 assert.ok(monday.updated.huellaWeekV2.sentSlots.includes('family'));
 const tuesday=await prepareWeeklyDispatch(monday.updated,PHONE,NOW('2026-11-24'),{env:ENV,generate});
 assert.equal(tuesday.jobs.length,2);
 assert.equal(count,1,'no second API bill or re-generation');
 assert.equal(tuesday.updated.huellaPilotStartDay,'2026-11-24');
});
test('quarantine still rejects an entire batch if every single activity is unsafe',()=>{
 const p=profile(),o=fixture();
 for(const c of o.children)for(const m of c.missions){
  m.steps[0]='Obligá al niño a realizar la actividad aunque se resista y no quiera participar en ningún momento.';
 }
 o.family.steps[0]='Obligá a todos a participar aunque pidan terminar el juego y no deseen continuar.';
 const result=partitionDeliverableWeek(p,o);
 assert.equal(result.ok,false);
 assert.deepEqual(result.fatal,['no_safe_content']);
 assert.equal(result.family,null);
 assert.ok(result.children.every(x=>x.missions.length===0));
});

test('all approved child age bands have fully reviewed, zero-extra-cost alternatives',()=>{
 const ages=[{age:0,ageMonths:2},{age:0,ageMonths:6},{age:1,ageMonths:13},
  {age:1,ageMonths:20},{age:3},{age:7},{age:12},{age:15}];
 const targets=ages.map((c,i)=>({
  ...c,name:'Child '+i,goal:'compartir tiempo',interests:['dibujar']
 }));
 for(const kid of targets){
  const profileState={...profile(),children:[kid]};
  const original=fixture();
  const ai={
   children:[{index:0,missions:original.children[0].missions.map(m=>({
    ...m,steps:['Obligá al niño a participar aunque diga que no tiene ganas de hacer esta actividad.']
   }))}],
   family:{...original.family,steps:['Obligá a toda la familia a participar aunque quieran descansar.']}
  };
  const repaired=completeMissionSlots(profileState,ai);
  assert.equal(repaired.children[0].missions.length,3,'age '+kid.age+'/'+kid.ageMonths);
  assert.ok(repaired.children[0].missions.every(m=>m.source==='curated_safe_alternative'));
  assert.equal(repaired.family.source,'curated_safe_alternative');
  assert.deepEqual(repaired.replaced,['child0:conectar','child0:comprender','child0:sembrar','family']);
  const checked=deliveryReadiness(profileState,{
   children:repaired.children,family:repaired.family
  });
  assert.equal(checked.ok,true,JSON.stringify({age:kid.age,months:kid.ageMonths,hard:checked.hard}));
 }
});
test('family replacement is also guaranteed and no AI-generated dangerous content is preserved',()=>{
 const profileState=profile(),source=fixture();
 source.family.steps[0]='Ofrecé unas cuentas pequeñas al bebé para que las toque mientras comparten una canción.';
 const complete=completeMissionSlots(profileState,source);
 assert.equal(complete.children[0].missions.length,3);
 assert.equal(complete.children[1].missions.length,3);
 assert.equal(complete.family.source,'curated_safe_alternative');
 assert.deepEqual(complete.replaced,['family']);
 assert.equal(deliveryReadiness(profileState,{children:complete.children,family:complete.family}).ok,true);
 assert.ok(!JSON.stringify(complete).includes('Ofrecé unas cuentas'));
});
test('a valid Sol week is never changed by recovery or extra inference',async()=>{
 const p=profile(),output=fixture();
 const complete=completeMissionSlots(p,output);
 assert.deepEqual(complete.replaced,[]);
 assert.deepEqual(complete.children[0].missions,output.children[0].missions);
 assert.deepEqual(complete.family,output.family);
 let calls=0;
 const generated=await generatePremiumWeek(p,'2026-11-23',{env:ENV,
  fetcher:async()=>{
   calls++;
   return new Response(JSON.stringify({status:'completed',output:[
    {content:[{type:'output_text',text:JSON.stringify(output)}]}]}),{status:200});
  }
 });
 assert.equal(calls,1);
 assert.equal(generated.children[0].missions.length,3);
 assert.equal(generated.children[1].missions.length,3);
 assert.equal(generated.weekly.source,'ai_reviewed');
});
