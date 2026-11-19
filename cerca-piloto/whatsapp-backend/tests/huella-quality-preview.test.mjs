import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/flow.mjs';
import {handleQualityPreviewInbound,isQualityPreviewIntent,isRecoveryPreviewIntent,QUALITY_PREVIEW_REVISION,RECOVERY_PREVIEW_REVISION} from '../src/huella-quality-preview.mjs';

const PHONE='5492211234567';
const env={HUELLA_PREVIEW_ENABLED:'true',CERCA_PROVIDER:'evolution',CERCA_SEND_MODE:'test',
 CERCA_TEST_WA_IDS:PHONE,EVOLUTION_API_URL:'https://evolution.test/',
 EVOLUTION_API_KEY:'unit-test-placeholder-1234567890',EVOLUTION_INSTANCE:'huella-preview',
 CERCA_BRIDGE_WEBHOOK_SECRET:'test-secret-longer-than-thirty-two-characters',
 OPENAI_API_KEY:'fake-test-no-network'};
const time=new Date('2026-11-19T15:30:00Z');
const message=(id,text='PREVIA CALIDAD')=>({phone:PHONE,text,id,receivedAt:time.toISOString()});
const mission=(kind,topic)=>({
 kind,title:'Una aventura concreta y compartida para '+topic+' '+kind,
 intro:'Van a participar de una actividad imaginaria sencilla con papeles claros y decisiones compartidas, sin obligar a nadie a seguir la historia.',
 setup:'En la mesa, dejá una hoja y dos lápices. No hace falta preparar materiales especiales ni usar un dispositivo para jugar.',
 opening:'«¿Querés que inventemos juntos una aventura? Vos elegís adónde vamos y yo sigo las pistas.»',
 example:'Por ejemplo, si elige un bosque, dibujá un árbol y preguntá quién vive ahí. Si inventa una criatura, acompañá su historia sin corregirla.',
 ifNo:'Si hoy no quiere jugar, dejá la propuesta para otro momento y acompañá lo que sí quiera hacer, sin insistir.',
 steps:['Elegí un lugar cómodo, presentá la hoja y explicá que hoy van a inventar una aventura por turnos.',
 'Preguntá qué parte quiere inventar primero, escuchá su idea y agregá una propuesta solo cuando te lo pida.'],
 why:'Podés conocer cómo elige participar, escuchando sus ideas sin dirigir todo el juego; así ambos comparten un momento con decisiones reales.',
 observe:'Notá si propone una idea propia o prefiere escuchar; ambas formas son válidas.',
 target:'dibujar',skill:kind==='sembrar'?'iniciativa y colaboración':'no aplica'
});
function weekly(){
 const x=['conectar','comprender','sembrar'];
 return {day:'2026-11-23',children:[
 {name:'Hija mayor',missions:x.map(v=>mission(v,'la mayor'))},
 {name:'Bebé',missions:x.map(v=>({...mission(v,'el bebé'),target:'sonidos'}))}
 ],weekly:{title:'Recuerdos e ideas compartidas de la semana',
 intro:'Toda la familia va a elegir una idea o recuerdo para compartir de manera voluntaria y sin competir por cuál fue el más importante.',
 setup:'En el living, buscá un lugar cómodo para todos, con una hoja y un lápiz. El bebé puede acompañar en un lugar seguro.',
 opening:'«¿Quieren que contemos un pequeño recuerdo de la semana? Cada uno puede hacerlo a su manera.»',
 example:'Por ejemplo, alguien recuerda una caminata y cuenta qué vio. Si otro quiere solo escuchar, no necesita hablar ni demostrar nada.',
 ifNo:'Si hoy no tienen ganas, cierren la actividad sin insistir; pueden retomarla otro día cuando la familia tenga más energía.',
 steps:['Invitá a quien quiera participar a elegir un pequeño recuerdo y contar qué pasó.',
 'Escuchá las elecciones sin interrumpir y dejá que alguien guarde el recuerdo en una hoja si quiere.'],
 why:'Escuchar lo que cada persona considera importante puede abrir una conversación sencilla y respetuosa sin exigir una respuesta perfecta.',
 observe:'Observá si alguna persona agrega un detalle o prefiere simplemente escuchar.'}};
}
function profile(){
 const s=initialState();s.status='active';s.flow='idle';s.consentAt='2026-11-17T15:00:00Z';
 s.children=[
 {name:'Hija mayor',age:9,interests:['dibujar'],goal:'escuchar más sus elecciones'},
 {name:'Bebé',age:0,ageMonths:5,interests:['sonidos'],goal:'acompañar sus señales'}];
 s.monthlyGoal='estar juntos';s.huellaPilotStartDay=null;
 s.huellaPreview={status:'ready',weekKey:'2026-11-23',attempts:2,batch:weekly(),runId:'old-preview'};
 return s;
}
function fakeDb(initial=profile()){
 const record={state:structuredClone(initial),revision:1};
 const seen=new Set(),jobs=[];
 return {
  record,jobs,seen,
  async family(p){assert.equal(p,PHONE);return {state:structuredClone(record.state),revision:record.revision};},
  async commit(p,rev,event,newState,outbox){
   assert.equal(p,PHONE);
   if(seen.has(event))return {status:'duplicate'};
   if(rev!==record.revision)throw Error('database_409');
   seen.add(event);record.state=structuredClone(newState);record.revision++;
   assert.ok(outbox.every(j=>j.channel==='service'&&j.payload.body&&j.expires_at));
   jobs.push(...outbox);
   return {status:'applied'};
  }
 };
}
test('only the explicit private quality-preview phrase is recognized',()=>{
 assert.equal(isQualityPreviewIntent('PRÉVIA CALIDAD'),true);
 assert.equal(isQualityPreviewIntent('PREVIA'),false);
 assert.equal(isQualityPreviewIntent('qué opinás de la crianza'),false);
});
test('one authorized quality preview makes ONE AI call and retains original two attempts and pilot state',async()=>{
 const db=fakeDb();let calls=0,flushes=0;
 const r=await handleQualityPreviewInbound(message('quality:1'),{db,env,now:time,
  generate:async(lookback,weekStart)=>{
   calls++;assert.equal(weekStart,'2026-11-23');
   assert.equal(lookback.huellaPreview.attempts,2);
   assert.ok(lookback.history.some(h=>h.day==='editorial-reference'));
   return weekly();
  },flush:async()=>flushes++});
 assert.equal(r,'applied');assert.equal(calls,1);
 assert.equal(flushes,2);
 assert.equal(db.record.state.huellaPreview.attempts,2);
 assert.equal(db.record.state.huellaQualityPreview.revision,QUALITY_PREVIEW_REVISION);
 assert.equal(db.record.state.huellaQualityPreview.status,'ready');
 assert.equal(db.record.state.huellaQualityPreview.attempts,1);
 assert.equal(db.record.state.huellaPilotStartDay,null);
 assert.equal(db.record.state.history.length,0);
 const composed=db.jobs.map(j=>j.payload.body).join('\n');
 assert.match(composed,/Qué decir para empezar/);
 assert.match(composed,/Ejemplo de cómo jugar/);
 assert.match(composed,/Qué buscamos con esta experiencia/);
 assert.match(composed,/UNICEF/);
 assert.ok(db.jobs.length<=13);
 await handleQualityPreviewInbound(message('quality:2'),{db,env,now:time,
  generate:async()=>{throw Error('duplicate paid call')}});
 assert.equal(calls,1);
 assert.equal(db.record.state.huellaPreview.attempts,2);
});
test('quality preview returns immediately and only starts AI after durable reservation',async()=>{
 const db=fakeDb();let pending=null,calls=0;
 const r=await handleQualityPreviewInbound(message('quality:3'),{db,env,now:time,
  defer:work=>{pending=work;return 'applied';},
  generate:async()=>{calls++;return weekly();}});
 assert.equal(r,'applied');assert.equal(calls,0);
 assert.equal(db.record.state.huellaQualityPreview.status,'processing');
 await handleQualityPreviewInbound(message('quality:4'),{db,env,now:time,
  generate:async()=>{throw Error('second call attempted')}});
 assert.equal(calls,0);
 assert.equal(await pending(),'applied');
 assert.equal(calls,1);
 assert.equal(db.record.state.huellaQualityPreview.status,'ready');
});
test('failure never retries on its own, nor overwrites the existing valid preview',async()=>{
 const db=fakeDb();let calls=0;
 const original=structuredClone(db.record.state.huellaPreview);
 await handleQualityPreviewInbound(message('quality:5'),{db,env,now:time,
  generate:async()=>{calls++;throw Error('huella_ai_quality_rejected');}});
 assert.equal(db.record.state.huellaQualityPreview.status,'failed');
 assert.equal(db.record.state.huellaQualityPreview.error,'huella_ai_quality_rejected');
 assert.deepEqual(db.record.state.huellaPreview,original);
 await handleQualityPreviewInbound(message('quality:6'),{db,env,now:time,
  generate:async()=>{calls++;return weekly();}});
 assert.equal(calls,1);
 assert.ok(db.jobs.some(x=>x.payload.body.includes('No haré más llamadas pagas')));
 assert.ok(!db.jobs.some(x=>x.payload.body.includes('LUNES · Experiencia familiar')));
});
test('opt-out during generation blocks all final missions',async()=>{
 const db=fakeDb();
 const result=await handleQualityPreviewInbound(message('quality:7'),{db,env,now:time,generate:async()=>{
  db.record.state.status='stopped';db.record.state.consentAt=null;db.record.revision++;
  return weekly();
 }});
 assert.equal(result,'cancelled');
 assert.ok(!db.jobs.some(x=>x.payload.body.includes('MARTES')));
 assert.equal(db.record.state.huellaPilotStartDay,null);
});
test('allowlists and consent are checked before even reserving a paid call',async()=>{
 const db=fakeDb();
 assert.equal(await handleQualityPreviewInbound(message('quality:8'),{db,env:{...env,HUELLA_PREVIEW_ENABLED:'false'},now:time}),null);
 assert.equal(await handleQualityPreviewInbound(message('quality:9'),{db,env:{...env,CERCA_TEST_WA_IDS:PHONE+',5492219000000'},now:time}),null);
 assert.equal(db.jobs.length,0);
 const stopped=fakeDb({...profile(),status:'stopped',consentAt:null});
 assert.equal(await handleQualityPreviewInbound(message('quality:10'),{db:stopped,env,now:time}),'not_active');
});

function kaiaOnly(){
 const kinds=['conectar','comprender','sembrar'];
 return {day:'2026-11-23',childName:'Kaia',childIndex:1,ageMonths:6,
 missions:kinds.map(kind=>({...mission(kind,'Kaia'),target:'sonidos'})),
 family:null,replaced:[],withheld:[],editorialWarnings:[]};
}
test('PREVIA KAIA (and the previously instructed PREVIA COMPLETA) sends only three Kaia missions',async()=>{
 assert.equal(isRecoveryPreviewIntent('PRÉVIA KAIA'),true);
 assert.equal(isRecoveryPreviewIntent('PREVIA COMPLETA'),true);
 assert.equal(isRecoveryPreviewIntent('PREVIA'),false);
 const prior=profile();
 prior.children[1].name='Kaia';
 prior.children[1].ageMonths=6;
 prior.huellaQualityPreview={revision:QUALITY_PREVIEW_REVISION,status:'ready',attempts:1,batch:weekly()};
 prior.huellaInfantReviewV3={status:'failed',attempts:1};
 const original=structuredClone(prior);
 const db=fakeDb(prior);let calls=0;
 const run=async id=>handleQualityPreviewInbound(message(id,'PREVIA KAIA'),{
  db,env,now:time,
  generate:async()=>{throw Error('whole family should never generate')},
  generateInfant:async(state,week,opts)=>{
   calls++;
   assert.equal(week,'2026-11-23');
   assert.equal(opts.includeFamily,false);
   assert.equal(state.huellaPreview.attempts,2);
   assert.equal(state.huellaInfantReviewV3.status,'failed');
   return kaiaOnly();
  }
 });
 assert.equal(await run('kaia:1'),'applied');
 assert.equal(calls,1);
 assert.equal(db.record.state.huellaRecoveryPreview.revision,RECOVERY_PREVIEW_REVISION);
 assert.equal(db.record.state.huellaRecoveryPreview.status,'ready');
 assert.equal(db.record.state.huellaRecoveryPreview.attempts,1);
 assert.equal(db.record.state.huellaRecoveryPreview.batch.childName,'Kaia');
 assert.equal(db.record.state.huellaRecoveryPreview.batch.missions.length,3);
 assert.equal(db.record.state.huellaRecoveryPreview.batch.family,null);
 assert.deepEqual(db.record.state.huellaPreview,original.huellaPreview);
 assert.deepEqual(db.record.state.huellaQualityPreview,original.huellaQualityPreview);
 assert.deepEqual(db.record.state.huellaInfantReviewV3,original.huellaInfantReviewV3);
 assert.equal(db.record.state.huellaPilotStartDay,null);
 const bodies=db.jobs.map(j=>j.payload.body).join('\n');
 assert.match(bodies,/Kaia/);
 assert.ok(!bodies.includes('Allegra'));
 assert.ok(!bodies.includes('Experiencia familiar'));
 assert.ok(!bodies.includes('Hija mayor'));
 assert.equal(await run('kaia:2'),'applied');
 assert.equal(calls,1,'duplicate must not use another API call');
});
test('Kaia-only failure stays consumed; wrong profile and allowlist cannot spend',async()=>{
 const prior=profile();prior.children[1].name='Kaia';prior.children[1].ageMonths=6;
 const db=fakeDb(prior);let calls=0;
 const run=(id,settings=env)=>handleQualityPreviewInbound(message(id,'PREVIA COMPLETA'),{
  db,env:settings,now:time,generateInfant:async()=>{
   calls++;throw Error('huella_ai_http_503');
  }
 });
 assert.equal(await run('kaia:failure'),'applied');
 assert.equal(db.record.state.huellaRecoveryPreview.status,'failed');
 assert.equal(await run('kaia:repeat'),'applied');
 assert.equal(calls,1);
 assert.equal(db.record.state.huellaPreview.attempts,2);
 assert.equal(db.record.state.huellaPilotStartDay,null);
 assert.ok(db.jobs.some(x=>x.payload.body.includes('otra llamada paga')));
 const denied=fakeDb(prior);
 assert.equal(await handleQualityPreviewInbound(message('kaia:deny','PREVIA KAIA'),{
  db:denied,env:{...env,CERCA_TEST_WA_IDS:PHONE+',5492219000000'},now:time
 }),null);
 assert.equal(denied.jobs.length,0);
 const noKaia=fakeDb(profile());
 assert.equal(await handleQualityPreviewInbound(message('kaia:missing','PREVIA KAIA'),{
  db:noKaia,env,now:time,
  generateInfant:async()=>{throw Error('should not generate')}
 }),'applied');
 assert.equal(noKaia.record.state.huellaRecoveryPreview,undefined);
});
