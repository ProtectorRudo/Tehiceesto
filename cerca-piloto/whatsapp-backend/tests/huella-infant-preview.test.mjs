import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,processInbound} from '../src/flow.mjs';
import {generateInfantFocus,INFANT_FOCUS_SCHEMA} from '../src/huella-infant-ai.mjs';
import {handleInfantReview,infantReviewIntent,INFANT_REVIEW_REVISION,INFANT_REVIEW_REVISION_V2} from '../src/huella-infant-preview.mjs';

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

test('invalid generated target yields a traceable anonymous rule code',async()=>{
 const invalid=batch();invalid.missions[0].target='invented preference';
 await assert.rejects(generateInfantFocus(familyState(),'2026-11-23',{
  env,fetcher:async()=>new Response(JSON.stringify({status:'completed',
   output:[{content:[{type:'output_text',text:JSON.stringify(invalid)}]}]}),{status:200})
 }),err=>{
  assert.equal(err.message,'huella_ai_quality_rejected');
  assert.ok(err.issueCodes.includes('child0:conectar:target_not_from_profile'));
  assert.ok(!JSON.stringify(err.issueCodes).includes('Bebé'));return true;
 });
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
