import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,processInbound} from '../src/flow.mjs';
import {generateInfantFocus,INFANT_FOCUS_SCHEMA} from '../src/huella-infant-ai.mjs';
import {handleInfantReview,infantReviewIntent,INFANT_REVIEW_REVISION,INFANT_REVIEW_REVISION_V2,INFANT_REVIEW_REVISION_V3} from '../src/huella-infant-preview.mjs';

const PHONE='5492211234567',NOW=new Date('2026-11-19T15:30:00Z');
const env={HUELLA_PREVIEW_ENABLED:'true',CERCA_PROVIDER:'evolution',CERCA_SEND_MODE:'test',
 CERCA_TEST_WA_IDS:PHONE,EVOLUTION_API_URL:'https://evolution.test/',
 EVOLUTION_API_KEY:'unit-test-placeholder-1234567890',EVOLUTION_INSTANCE:'huella-preview',
 CERCA_BRIDGE_WEBHOOK_SECRET:'test-secret-longer-than-thirty-two-characters',
 OPENAI_API_KEY:'fake-test-no-network'};
const message=(id,content='PREVIA BEBÉ')=>({id,text:content,phone:PHONE,receivedAt:NOW.toISOString()});
const mission=(kind,i)=>({
 kind,title:'Una experiencia cercana para compartir la atención '+kind+' '+i,
 intro:'Van a disfrutar un ratito cotidiano con una canción y un libro para bebés, sin buscar respuestas, señales especiales ni resultados.',
 setup:'Elegí un lugar cómodo para sentarte con tu bebé y tener cerca un libro de imágenes apropiado a su edad. No hace falta nada más.',
 opening:'«¿Miramos un poquito el libro y después cantamos nuestra canción? Estoy acá con vos.»',
 example:'Por ejemplo, mientras sostenés el libro señalá el dibujo de un animal y decí su nombre bajito. Si se distrae, cerrá el libro y acompañá ese momento.',
 ifNo:'Si prefiere descansar o necesita atención, dejá la propuesta para otro día y seguí acompañando su ritmo natural.',
 steps:kind==='conectar'?
 ['Buscá un momento en el que estén cómodos para mirar juntos una imagen de un libro para bebés mientras acompañás con tu voz.',
 'Cantá una parte breve de una canción familiar con suavidad y cerrá el libro si es momento de descansar.']:
 kind==='comprender'?
 ['Elegí dos imágenes grandes del libro y mostrale una sola mientras contás algo sencillo relacionado con lo que ven.',
 'Acompañá su atención si se dirige naturalmente a otra imagen; seguí nombrando aquello que comparten sin examinar sus movimientos.']:
 ['Elegí una página del libro y nombrá un animal con una voz suave, dejando tiempo para disfrutar el encuentro.',
 'Volvé a la canción que ya conocen y acompañá cualquier sonido espontáneo sin pedir repeticiones ni buscar una respuesta concreta.'],
 why:'Compartir una imagen y una canción en un momento tranquilo permite que tu voz sea parte de un encuentro cercano, sin evaluaciones ni ejercicios.',
 observe:'Si hay un momento agradable, podés disfrutarlo sin buscar una reacción determinada.',
 target:'voces',skill:kind==='sembrar'?'exploración visual acompañada':'no aplica'
});
const family={
 title:'Un momento musical compartido para nuestra familia',
 intro:'Van a elegir juntos una canción que les guste y disfrutarla en familia. La hija mayor puede elegir el tema y el bebé puede acompañar con comodidad.',
 setup:'Busquen un espacio tranquilo del living y una silla cómoda. No hace falta poner música en pantallas ni preparar materiales especiales.',
 opening:'«¿Elegimos una canción que nos guste a todos para cantar un ratito? Puede ser una que ya conozcamos.»',
 example:'Por ejemplo, la mayor elige una canción de un animal. Vos la tarareás con ella y el bebé acompaña cómodamente desde tus brazos, sin pedirle participar.',
 ifNo:'Si nadie tiene ganas de cantar, pueden elegir escuchar juntos un ratito de silencio o cambiar la canción para otra ocasión.',
 steps:['Ofrecé que la hija mayor elija una canción conocida o invente un fragmento breve, y acompañá su elección con tu propia voz.',
 'Mientras cantan, asegurate de que el bebé esté cómodo en una postura segura y cerrá el encuentro cuando la familia quiera.'],
 why:'Compartir una elección musical real de la hija mayor y acompañar con la voz ofrece a toda la familia un momento sencillo de cercanía sin exigencias.',
 observe:'Notá si alguien propone repetir la canción porque disfrutó compartirla.'
};
const batch=()=>({missions:['conectar','comprender','sembrar'].map(mission),family});
function familyState(months=5){
 const s=initialState();s.status='active';s.consentAt='2026-11-19T14:00:00Z';s.flow='idle';s.adultName='Adulto';
 s.children=[
  {name:'Mayor',age:9,interests:['dibujar','música'],goal:'compartir elecciones'},
  {name:'Bebé',age:0,ageMonths:months,interests:['voces'],goal:'acompañar sus señales'}];
 s.monthlyGoal='compartir más momentos';s.huellaPilotStartDay=null;
 s.huellaPreview={status:'ready',attempts:2,batch:{children:[{missions:[]},{missions:[]}]}};
 s.huellaQualityPreview={status:'ready',attempts:1,batch:{children:[{missions:[]},{missions:[]}]}};
 return s;
}
function fakeDb(initial=familyState()){
 const row={revision:1,state:structuredClone(initial)},seen=new Set(),jobs=[];
 return {
  row,jobs,
  async family(p){assert.equal(p,PHONE);return {revision:row.revision,state:structuredClone(row.state)};},
  async commit(p,revision,eventId,state,outbox){
   assert.equal(p,PHONE);if(seen.has(eventId))return {status:'duplicate'};
   if(revision!==row.revision)throw Error('database_409');
   assert.ok(outbox.every(x=>x.channel==='service'&&x.payload.body&&x.expires_at));
   seen.add(eventId);row.revision++;row.state=structuredClone(state);jobs.push(...outbox);
   return {status:'applied'};
  }
 };
}
test('focused generator sends only a minimal child profile plus siblings age and interests',async()=>{
 let calls=0;
 const result=await generateInfantFocus(familyState(),'2026-11-23',{env,
  fetcher:async(url,opts)=>{
   calls++;assert.equal(url,'https://api.openai.com/v1/responses');
   const req=JSON.parse(opts.body);
   assert.equal(req.model,'gpt-6.2-sol');
   assert.equal(req.reasoning.effort,'high');assert.equal(req.store,false);
   assert.equal(req.text.format.strict,true);assert.equal(req.text.format.type,'json_schema');
   assert.equal(req.text.format.schema.required.length,2);
   assert.equal(req.text.format.schema.properties.missions.items.required.includes('example'),true);
   assert.deepEqual(req.text.format.schema.properties.missions.items.properties.target.enum,['acompañar sus señales','voces','compartir más momentos']);
   assert.match(req.input,/"ageMonths":5/);
   assert.ok(!req.input.includes('Bebé'));assert.ok(!req.input.includes('Mayor'));
   assert.ok(!req.input.includes(PHONE));assert.ok(!req.input.includes('Adulto'));
   return new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(batch())}]}]}),{status:200});
  }
 });
 assert.equal(calls,1);assert.equal(result.ageMonths,5);
 assert.equal(result.missions.length,3);assert.equal(result.childName,'Bebé');
 assert.equal(result.family.kind,'familiar');
 assert.ok(INFANT_FOCUS_SCHEMA.properties.family);
});
test('missing or mismatched infant months rejects before ANY paid API call',async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw Error('must_not_call')};
 for(const invalid of [null,18]){
  const s=familyState(invalid);
  await assert.rejects(generateInfantFocus(s,'2026-11-23',{env,fetcher}),/huella_infant_months_missing/);
 }
 assert.equal(calls,0);
});
test('one WhatsApp command generates exactly one focus batch, leaves previous preview and pilot intact',async()=>{
 const db=fakeDb();let calls=0,flush=0;
 const old=structuredClone(db.row.state.huellaQualityPreview);
 const result=await handleInfantReview(message('focus-1'),{db,env,now:NOW,
  generate:async()=>{calls++;return {day:'2026-11-23',childName:'Bebé',childIndex:1,ageMonths:5,
   missions:batch().missions,family:{...family,kind:'familiar'}};},
  flush:async()=>flush++});
 assert.equal(result,'applied');assert.equal(calls,1);assert.equal(flush,2);
 assert.equal(db.row.state.huellaInfantReview.status,'ready');
 assert.equal(db.row.state.huellaInfantReview.revision,INFANT_REVIEW_REVISION);
 assert.deepEqual(db.row.state.huellaQualityPreview,old);
 assert.equal(db.row.state.huellaPilotStartDay,null);
 assert.equal(db.jobs.length,6,'one confirmation and five content messages');
 const sent=db.jobs.map(x=>x.payload.body).join('\n');
 assert.match(sent,/Preparación/);assert.match(sent,/Qué decir para empezar/);
 assert.match(sent,/familiar/i);
 await handleInfantReview(message('focus-2'),{db,env,now:NOW,generate:async()=>{throw Error('duplicate generation')}});
 assert.equal(calls,1);
 await handleInfantReview(message('focus-3','PREVIA BEBÉ VER'),{db,env,now:NOW,
  generate:async()=>{throw Error('must only replay cache')}});
 assert.equal(calls,1);
 assert.ok(db.jobs.length>6);
});
test('previous preview is not overwritten if focused review fails',async()=>{
 const db=fakeDb();let calls=0;
 const old=structuredClone(db.row.state.huellaPreview);
 await handleInfantReview(message('focus-fail'),{db,env,now:NOW,generate:async()=>{calls++;throw Error('huella_ai_quality_rejected')}});
 assert.equal(db.row.state.huellaInfantReview.status,'failed');
 assert.equal(db.row.state.huellaInfantReview.error,'huella_ai_quality_rejected');
 assert.deepEqual(db.row.state.huellaPreview,old);
 await handleInfantReview(message('focus-fail2'),{db,env,now:NOW,generate:async()=>{calls++;return batch()}});
 assert.equal(calls,1);
});
test('without months the adult is sent to a guided flow, with zero API calls',async()=>{
 const db=fakeDb(familyState(null));let calls=0;
 assert.equal(infantReviewIntent('PREVIA BEBE'),true);
 assert.equal(infantReviewIntent('PRÉVIA BEBÉ VER'),true);
 await handleInfantReview(message('focus-months'),{db,env,now:NOW,generate:async()=>{calls++}});
 assert.equal(calls,0);assert.equal(db.row.state.huellaInfantReview,undefined);
 assert.match(db.jobs[0].payload.body,/EDAD BEBÉ/);
 assert.equal(db.row.state.children[1].ageMonths,null);
});
test('no paid call for non-allowlisted/test-disabled households and opt-out blocks result',async()=>{
 const db=fakeDb(),blocked={...env,HUELLA_PREVIEW_ENABLED:'false'};
 let calls=0;
 assert.equal(await handleInfantReview(message('focus-unallowed'),{db,env:blocked,now:NOW,generate:async()=>{calls++}}),null);
 assert.equal(calls,0);assert.equal(db.jobs.length,0);
 const optout=await handleInfantReview(message('focus-optout'),{db,env,now:NOW,generate:async()=>{
  calls++;db.row.state.status='stopped';db.row.state.consentAt=null;db.row.revision++;
  return {childName:'Bebé',ageMonths:5,missions:batch().missions,family};
 }});
 assert.equal(optout,'cancelled');assert.equal(calls,1);
 assert.ok(!db.jobs.some(x=>x.payload.body.includes('Ejemplo de cómo')));
});
test('inbound guided age months for baby never changes sibling or completed preview',()=>{
 const s=familyState(null),old=structuredClone(s.huellaPreview);
 const first=processInbound('EDAD BEBÉ',{state:s,today:'2026-11-19',now:NOW.toISOString()});
 assert.equal(first.state.flow,'change_baby_months');
 const second=processInbound('5',{state:first.state,today:'2026-11-19',now:NOW.toISOString()});
 assert.equal(second.state.children[1].ageMonths,5);
 assert.equal(second.state.children[0].age,9);
 assert.deepEqual(second.state.huellaPreview,old);
 assert.equal(second.state.huellaPilotStartDay,null);
});

test('a harmless imperfect target becomes editorial feedback, never a dropped baby mission',async()=>{
 const invalid=batch();invalid.missions[0].target='invented preference';
 const prepared=await generateInfantFocus(familyState(),'2026-11-23',{
  env,fetcher:async()=>new Response(JSON.stringify({status:'completed',
   output:[{content:[{type:'output_text',text:JSON.stringify(invalid)}]}]}),{status:200})
 });
 assert.equal(prepared.missions.length,3);
 assert.ok(prepared.editorialWarnings.includes('child0:conectar:target_not_from_profile'));
 assert.ok(!JSON.stringify(prepared.editorialWarnings).includes('Bebé'));
});
test('quality failure persists anonymous diagnostic codes without saving generated content',async()=>{
 const db=fakeDb();
 await handleInfantReview(message('focus-diagnostic'),{db,env,now:NOW,
  generate:async()=>{const e=Error('huella_ai_quality_rejected');
   e.issueCodes=['child0:comprender:steps','family:why','A private raw message','child0:sembrar:skill'];throw e;}
 });
 assert.equal(db.row.state.huellaInfantReview.status,'failed');
 assert.deepEqual(db.row.state.huellaInfantReview.issueCodes,
 ['child0:comprender:steps','family:why','child0:sembrar:skill']);
 assert.equal(db.row.state.huellaInfantReview.batch,undefined);
 assert.equal(db.row.state.huellaPilotStartDay,null);
});

test('single approved V2 retest is isolated from failed V1 and starts only on explicit command',async()=>{
 const original=familyState(6);
 original.huellaInfantReview={revision:INFANT_REVIEW_REVISION,status:'failed',attempts:1,
  error:'huella_ai_quality_rejected',finishedAt:NOW.toISOString()};
 const db=fakeDb(original);
 const baseline=structuredClone(db.row.state.huellaInfantReview);
 const oldPreview=structuredClone(db.row.state.huellaPreview);
 const priorQuality=structuredClone(db.row.state.huellaQualityPreview);
 let calls=0;
 assert.equal(infantReviewIntent('PREVIA BEBÉ 2'),true);
 assert.equal(infantReviewIntent('PREVIA BEBE 2 VER'),true);
 const result=await handleInfantReview(message('v2-1','PREVIA BEBÉ 2'),{db,env,now:NOW,generate:async()=>{
  calls++;
  return {day:'2026-11-23',childName:'Bebé',childIndex:1,ageMonths:6,
   missions:batch().missions,family:{...family,kind:'familiar'}};
 }});
 assert.equal(result,'applied');assert.equal(calls,1);
 assert.equal(db.row.state.huellaInfantReviewV2.revision,INFANT_REVIEW_REVISION_V2);
 assert.equal(db.row.state.huellaInfantReviewV2.status,'ready');
 assert.equal(db.row.state.huellaInfantReviewV2.attempts,1);
 assert.deepEqual(db.row.state.huellaInfantReview,baseline);
 assert.deepEqual(db.row.state.huellaPreview,oldPreview);
 assert.deepEqual(db.row.state.huellaQualityPreview,priorQuality);
 assert.equal(db.row.state.huellaPilotStartDay,null);
 const count=db.jobs.length;
 await handleInfantReview(message('v2-2','PREVIA BEBÉ 2'),{db,env,now:NOW,generate:async()=>{calls++;throw Error('double API charge')}});
 assert.equal(calls,1);
 assert.equal(db.jobs.length,count+1);
 await handleInfantReview(message('v2-3','PREVIA BEBÉ 2 VER'),{db,env,now:NOW,generate:async()=>{calls++;throw Error('double API charge')}});
 assert.equal(calls,1);
 assert.equal(db.jobs.length,count+6);
});
test('V2 requires actual failed V1, not an ordinary new request from any family',async()=>{
 const db=fakeDb(familyState(6));let calls=0;
 const result=await handleInfantReview(message('v2-block','PREVIA BEBÉ 2'),{
  db,env,now:NOW,generate:async()=>{calls++;return batch();}
 });
 assert.equal(result,'applied');assert.equal(calls,0);
 assert.equal(db.row.state.huellaInfantReviewV2,undefined);
 assert.match(db.jobs[0].payload.body,/anterior fallida/);
});
test('failed V2 records anonymous diagnostics and never retries automatically',async()=>{
 const base=familyState(6);
 base.huellaInfantReview={revision:INFANT_REVIEW_REVISION,status:'failed',attempts:1,
  error:'huella_ai_quality_rejected'};
 const db=fakeDb(base);
 let calls=0;
 await handleInfantReview(message('v2-fail','PREVIA BEBÉ 2'),{
  db,env,now:NOW,generate:async()=>{
   calls++;const e=Error('huella_ai_quality_rejected');
   e.issueCodes=['child0:conectar:why','family:example'];throw e;
  }
 });
 assert.equal(calls,1);
 assert.equal(db.row.state.huellaInfantReviewV2.status,'failed');
 assert.deepEqual(db.row.state.huellaInfantReviewV2.issueCodes,['child0:conectar:why','family:example']);
 const old=structuredClone(db.row.state.huellaInfantReview);
 await handleInfantReview(message('v2-fail-again','PREVIA BEBÉ 2'),{
  db,env,now:NOW,generate:async()=>{calls++;return batch();}
 });
 assert.equal(calls,1);
 assert.deepEqual(db.row.state.huellaInfantReview,old);
 assert.equal(db.row.state.huellaPilotStartDay,null);
});
test('V2 opt-out while generating prevents the final missions and preserves safety',async()=>{
 const base=familyState(6);
 base.huellaInfantReview={revision:INFANT_REVIEW_REVISION,status:'failed',attempts:1};
 const db=fakeDb(base);
 const result=await handleInfantReview(message('v2-optout','PREVIA BEBÉ 2'),{
  db,env,now:NOW,generate:async()=>{
   db.row.state.status='stopped';db.row.state.consentAt=null;db.row.revision++;
   return {day:'2026-11-23',childName:'Bebé',childIndex:1,ageMonths:6,
    missions:batch().missions,family:{...family,kind:'familiar'}};
  }
 });
 assert.equal(result,'cancelled');
 assert.ok(!db.jobs.some(x=>x.payload.body.includes('Cómo hacerlo')));
 assert.equal(db.row.state.huellaPilotStartDay,null);
});

test('focused model locally cleans grammar then validates safety before sending',async()=>{
 const result=batch();
 result.missions[0].ifNo='Si está cansada, atendela primero y dejá el juego para otra ocasión tranquila con tiempo para compartir.';
 const fetcher=async()=>new Response(JSON.stringify({status:'completed',output:[
  {content:[{type:'output_text',text:JSON.stringify(result)}]}
 ]}),{status:200});
 const generated=await generateInfantFocus(familyState(5),'2026-11-23',{env,fetcher});
 assert.match(generated.missions[0].ifNo,/necesita descansar/);
 assert.match(generated.missions[0].ifNo,/atendé primero sus necesidades/);
 assert.doesNotMatch(generated.missions[0].ifNo,/cansada|atendela/);
 const unsafe=batch();
 unsafe.missions[2].steps[0]='Colocá un globo de colores cerca del bebé para que lo toque durante la canción y puedan compartir el momento con alegría.';
 const partial=await generateInfantFocus(familyState(5),'2026-11-23',{env,
  fetcher:async()=>new Response(JSON.stringify({status:'completed',output:[
   {content:[{type:'output_text',text:JSON.stringify(unsafe)}]}
  ]}),{status:200})});
 assert.equal(partial.missions.length,3,'HUELLA must fill every daily mission slot');
 assert.deepEqual(partial.missions.map(m=>m.kind),['conectar','comprender','sembrar']);
 assert.equal(partial.missions[2].source,'curated_safe_alternative');
 assert.ok(partial.replaced.includes('child0:sembrar'));
 assert.deepEqual(partial.withheld,[]);
 assert.ok(partial.family,'keep safe family mission');
 assert.ok(!JSON.stringify(partial).includes('Colocá un globo'),'unsafe text is never retained');
});

test('focused baby generation keeps valid content despite old pseudo-psychological editorial rules',async()=>{
 const output=batch();
 output.missions[0].title='Corta';
 output.missions[1].target='invented-but-harmless label';
 output.missions[2].skill='amor';
 const r=await generateInfantFocus(familyState(6),'2026-11-23',{env,
  fetcher:async()=>new Response(JSON.stringify({status:'completed',output:[{
   content:[{type:'output_text',text:JSON.stringify(output)}]}]}),{status:200})
 });
 assert.equal(r.missions.length,3);
 assert.ok(r.editorialWarnings.length>0);
 assert.equal(r.ageMonths,6);
});

test('V3 is an isolated single authorized quality test of the safety-only delivery path',async()=>{
 const prior=familyState(6);
 prior.huellaInfantReview={revision:INFANT_REVIEW_REVISION,status:'failed',attempts:1};
 prior.huellaInfantReviewV2={revision:INFANT_REVIEW_REVISION_V2,status:'failed',attempts:1,
  error:'huella_ai_quality_rejected',issueCodes:['child0:conectar:infant_gender_assumption']};
 const db=fakeDb(prior),old=structuredClone(db.row.state);
 let calls=0,flushes=0;
 assert.equal(infantReviewIntent('PREVIA BEBÉ 3'),true);
 assert.equal(infantReviewIntent('PREVIA BEBE 3 VER'),true);
 const make=async()=>{
  calls++;
  return {day:'2026-11-23',childName:'Bebé',childIndex:1,ageMonths:6,
   missions:batch().missions,family:{...family,kind:'familiar'},
   editorialWarnings:['child0:conectar:title','child0:comprender:target_not_from_profile']};
 };
 const result=await handleInfantReview(message('v3-first','PREVIA BEBÉ 3'),{
  db,env,now:NOW,generate:make,flush:async()=>{flushes++;}
 });
 assert.equal(result,'applied');assert.equal(calls,1);
 assert.equal(flushes,2);
 assert.equal(db.row.state.huellaInfantReviewV3.revision,INFANT_REVIEW_REVISION_V3);
 assert.equal(db.row.state.huellaInfantReviewV3.status,'ready');
 assert.equal(db.row.state.huellaInfantReviewV3.attempts,1);
 assert.equal(db.row.state.huellaInfantReviewV3.batch.editorialWarnings.length,2);
 assert.deepEqual(db.row.state.huellaInfantReviewV2,old.huellaInfantReviewV2);
 assert.deepEqual(db.row.state.huellaInfantReview,old.huellaInfantReview);
 assert.deepEqual(db.row.state.huellaPreview,old.huellaPreview);
 assert.deepEqual(db.row.state.huellaQualityPreview,old.huellaQualityPreview);
 assert.equal(db.row.state.huellaPilotStartDay,null);
 assert.equal(db.jobs.length,6,'ack + intro + 3 missions + family');
 const size=db.jobs.length;
 await handleInfantReview(message('v3-repeat','PREVIA BEBÉ 3'),{
  db,env,now:NOW,generate:make
 });
 assert.equal(calls,1,'never call OpenAI a second time for this revision');
 assert.equal(db.jobs.length,size+1);
 await handleInfantReview(message('v3-view','PREVIA BEBÉ 3 VER'),{
  db,env,now:NOW,generate:make
 });
 assert.equal(calls,1);
 assert.equal(db.jobs.length,size+6,'saved result can be replayed without cost');
});
test('V3 cannot start without a failed V2 and respects opt-out and allowlist',async()=>{
 const noV2=fakeDb(familyState(6));let calls=0;
 await handleInfantReview(message('v3-not-yet','PREVIA BEBÉ 3'),{
  db:noV2,env,now:NOW,generate:async()=>{calls++;}
 });
 assert.equal(calls,0);
 assert.equal(noV2.row.state.huellaInfantReviewV3,undefined);
 const hasFailed=familyState(6);
 hasFailed.huellaInfantReviewV2={revision:INFANT_REVIEW_REVISION_V2,status:'failed',attempts:1};
 const blocked=fakeDb(hasFailed);
 const notAllowed={...env,CERCA_TEST_WA_IDS:'5492210000000'};
 assert.equal(await handleInfantReview(message('v3-unallowed','PREVIA BEBÉ 3'),{
  db:blocked,env:notAllowed,now:NOW,generate:async()=>{calls++;}
 }),null);
 assert.equal(calls,0);
 const optout=fakeDb(hasFailed);
 const stopped=await handleInfantReview(message('v3-stopped','PREVIA BEBÉ 3'),{
  db:optout,env,now:NOW,generate:async()=>{
   calls++;optout.row.state.status='stopped';optout.row.state.consentAt=null;optout.row.revision++;
   return {day:'2026-11-23',childName:'Bebé',childIndex:1,ageMonths:6,
    missions:batch().missions,family:{...family,kind:'familiar'}};
  }
 });
 assert.equal(stopped,'cancelled');
 assert.equal(calls,1);
 assert.equal(optout.row.state.huellaPilotStartDay,null);
 assert.ok(!optout.jobs.some(x=>x.payload.body.includes('Cómo hacerlo')));
});
test('V3 errors consume the one authorization and retain non-identifying safety reasons',async()=>{
 const state=familyState(6);
 state.huellaInfantReviewV2={revision:INFANT_REVIEW_REVISION_V2,status:'failed',attempts:1};
 const db=fakeDb(state),before=structuredClone(db.row.state.huellaInfantReviewV2);
 let calls=0;
 await handleInfantReview(message('v3-failure','PREVIA BEBÉ 3'),{db,env,now:NOW,
  generate:async()=>{
   calls++;
   const e=Error('huella_ai_safety_or_structure');
   e.issueCodes=['child0:sembrar:infant_hazard'];
   throw e;
  }});
 assert.equal(db.row.state.huellaInfantReviewV3.status,'failed');
 assert.equal(db.row.state.huellaInfantReviewV3.attempts,1);
 assert.equal(db.row.state.huellaInfantReviewV3.error,'huella_ai_safety_or_structure');
 assert.deepEqual(db.row.state.huellaInfantReviewV3.issueCodes,['child0:sembrar:infant_hazard']);
 assert.deepEqual(db.row.state.huellaInfantReviewV2,before);
 await handleInfantReview(message('v3-second-message','PREVIA BEBÉ 3'),{db,env,now:NOW,
  generate:async()=>{calls++;}});
 assert.equal(calls,1);
});

test('one real paid infant generation can send its safe missions even when Sembrar is quarantined',async()=>{
 const state=familyState(6);state.huellaInfantReviewV2={revision:INFANT_REVIEW_REVISION_V2,status:'failed',attempts:1};
 const db=fakeDb(state);let inference=0;
 const result=await handleInfantReview(message('safe-salvage','PREVIA BEBÉ 3'),{
  db,env,now:NOW,generate:async()=>{
   inference++;
   return {day:'2026-11-23',childName:'Bebé',childIndex:1,ageMonths:6,
    missions:batch().missions.slice(0,2),family:{...family,kind:'familiar'},
    withheld:['child0:sembrar:infant_hazard']};
  }
 });
 assert.equal(result,'applied');assert.equal(inference,1);
 assert.equal(db.row.state.huellaInfantReviewV3.status,'ready');
 assert.equal(db.row.state.huellaInfantReviewV3.batch.missions.length,2);
 assert.deepEqual(db.row.state.huellaInfantReviewV3.batch.withheld,['child0:sembrar:infant_hazard']);
 const bodies=db.jobs.map(x=>x.payload.body).join('\n');
 assert.match(bodies,/2 misión\(es\)/);
 assert.match(bodies,/apartada/);
 assert.match(bodies,/Momento familiar/);
 assert.ok(!db.jobs.some(x=>x.payload.body.includes('exploración visual acompañada')));
 const before=db.jobs.length;
 await handleInfantReview(message('safe-salvage-again','PREVIA BEBÉ 3'),{
  db,env,now:NOW,generate:async()=>{inference++;throw Error('unexpected charge');}
 });
 assert.equal(inference,1);assert.equal(db.jobs.length,before+1);
});
test('quarantined content never silently becomes a missing child mission with bogus status',async()=>{
 const output=batch();
 output.missions[1].steps[0]='Ofrecé unas cuentas pequeñas y un cordón al bebé para que pueda agarrarlos mientras comparten el momento.';
 const result=await generateInfantFocus(familyState(6),'2026-11-23',{
  env,fetcher:async()=>new Response(JSON.stringify({status:'completed',output:[
   {content:[{type:'output_text',text:JSON.stringify(output)}]}]}),{status:200})
 });
 assert.deepEqual(result.missions.map(x=>x.kind),['conectar','comprender','sembrar']);
 assert.ok(result.replaced.includes('child0:comprender'));
 assert.equal(result.missions[1].source,'curated_safe_alternative');
 assert.deepEqual(result.withheld,[]);
 assert.equal(result.family.kind,'familiar');
 assert.ok(!JSON.stringify(result).includes('Ofrecé unas cuentas'));
});

test('one paid generation with an unsafe Sembrar is fully replaced before WhatsApp delivery',async()=>{
 const state=familyState(6);
 state.huellaInfantReviewV2={revision:INFANT_REVIEW_REVISION_V2,status:'failed',attempts:1};
 const db=fakeDb(state);
 let aiCalls=0;
 const generate=async()=>{
  const response=batch();
  response.missions[2].steps[0]='Ofrecé un globo al bebé para que lo toque y puedan practicar juntos durante la actividad.';
  return generateInfantFocus(state,'2026-11-23',{env,
   fetcher:async()=>{aiCalls++;return new Response(JSON.stringify({status:'completed',output:[
    {content:[{type:'output_text',text:JSON.stringify(response)}]}
   ]}),{status:200});}});
 };
 const result=await handleInfantReview(message('complete-v3','PREVIA BEBÉ 3'),{
  db,env,now:NOW,generate
 });
 assert.equal(result,'applied');assert.equal(aiCalls,1);
 const batchResult=db.row.state.huellaInfantReviewV3.batch;
 assert.equal(db.row.state.huellaInfantReviewV3.status,'ready');
 assert.equal(batchResult.missions.length,3);
 assert.equal(batchResult.family.kind,'familiar');
 assert.deepEqual(batchResult.replaced,['child0:sembrar']);
 assert.equal(batchResult.missions[2].source,'curated_safe_alternative');
 const joined=db.jobs.map(m=>m.payload.body).join('\n');
 assert.match(joined,/3 misión\(es\)/);
 assert.match(joined,/biblioteca editorial/);
 assert.match(joined,/SEMbrar/i);
 assert.ok(!joined.includes('Ofrecé un globo'));
 assert.equal(db.row.state.huellaPilotStartDay,null);
});

test('infant-only generation asks OpenAI for exactly three missions, not a family plan',async()=>{
 let calls=0;
 const output={missions:batch().missions};
 const response=await generateInfantFocus(familyState(6),'2026-11-23',{
  env,includeFamily:false,fetcher:async(url,opts)=>{
   calls++;
   const req=JSON.parse(opts.body);
   assert.equal(req.text.format.name,'huella_infant_only_v1');
   assert.deepEqual(req.text.format.schema.required,['missions']);
   assert.equal(req.text.format.schema.properties.family,undefined);
   assert.match(req.instructions,/SOLO TRES misiones/);
   assert.equal(req.reasoning.effort,'high');
   return new Response(JSON.stringify({status:'completed',output:[
    {content:[{type:'output_text',text:JSON.stringify(output)}]}
   ]}),{status:200});
  }
 });
 assert.equal(calls,1);
 assert.equal(response.missions.length,3);
 assert.deepEqual(response.missions.map(m=>m.kind),['conectar','comprender','sembrar']);
 assert.equal(response.family,null);
 assert.deepEqual(response.replaced,[],'safe Sol activities must not be rejected solely because family is not requested');
 assert.deepEqual(response.missions.map(m=>m.source),['ai_reviewed','ai_reviewed','ai_reviewed']);
 assert.deepEqual(response.missions.map(m=>m.title),output.missions.map(m=>m.title));
 assert.ok(!response.editorialWarnings.includes('family:missing'));
 assert.equal(response.ageMonths,6);
});

test('infant-only recovery fills one structurally missing activity, without replacing the other two',async()=>{
 const output={missions:structuredClone(batch().missions)};
 output.missions[2].steps=[];
 let calls=0;
 const result=await generateInfantFocus(familyState(6),'2026-11-23',{env,includeFamily:false,
  fetcher:async()=>{calls++;return new Response(JSON.stringify({status:'completed',output:[
   {content:[{type:'output_text',text:JSON.stringify(output)}]}
  ]}),{status:200});}
 });
 assert.equal(calls,1);
 assert.equal(result.family,null);
 assert.equal(result.missions.length,3);
 assert.deepEqual(result.replaced,['child0:sembrar']);
 assert.deepEqual(result.missions.map(m=>m.source),
  ['ai_reviewed','ai_reviewed','curated_safe_alternative']);
 assert.deepEqual(result.missions.slice(0,2).map(m=>m.title),
  output.missions.slice(0,2).map(m=>m.title));
 assert.ok(!result.editorialWarnings.includes('family:missing'));
});
