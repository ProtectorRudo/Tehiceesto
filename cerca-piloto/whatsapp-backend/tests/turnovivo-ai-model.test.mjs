import {test} from 'node:test';
import assert from 'node:assert/strict';
import {POST} from '../../app/api/turnovivo-ai/route.js';

test('TurnoVivo IA usa HUELLA Responses JSON estricto sin enviar ni registrar datos personales',async()=>{
 const original=globalThis.fetch;
 const originalKey=process.env.OPENAI_API_KEY;
 const serviceId='10000000-0000-4000-8000-000000000001';
 process.env.OPENAI_API_KEY='test-key-no-real-credential-aaaaaaaaaaaa';
 let coreCalls=0,providerCalls=0;
 globalThis.fetch=async(url,options={})=>{
  if(String(url).includes('turnovivo-core?action=dashboard')){
   coreCalls++;
   assert.match(options.headers.authorization,/^Bearer [a-f0-9]{64}$/);
   return Response.json({business:{id:'business-1',name:'Barbería de prueba',timezone:'America/Argentina/Buenos_Aires'},services:[{id:serviceId,name:'Corte de pelo'}]});
  }
  if(String(url)==='https://api.openai.com/v1/responses'){
   providerCalls++;
   assert.equal(options.headers.authorization,'Bearer '+process.env.OPENAI_API_KEY);
   const body=JSON.parse(options.body);
   assert.equal(body.model,'gpt-6.2-sol');
   assert.equal(body.store,false);
   assert.equal(body.text.format.type,'json_schema');
   assert.equal(body.text.format.strict,true);
   assert.deepEqual(body.text.format.schema.required,["action","client_name","client_phone","client_new_name","client_new_phone","client_email","service_id","service_name","service_new_name","duration_minutes","price_ars","date","time","from_date","from_time","report_from","report_to","report_metric","is_followup","clarification_question"]);
   return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({action:'book',client_name:'Mauro',client_phone:null,client_new_name:null,client_new_phone:null,service_id:serviceId,date:'2026-11-21',time:'15:00',from_date:null,from_time:null,client_email:null,service_name:null,service_new_name:null,duration_minutes:null,price_ars:null,report_from:null,report_to:null,report_metric:null,is_followup:false,clarification_question:null})}]}]});
  }
  throw Error('Unexpected URL');
 };
 try{
  const result=await POST(new Request('https://cerca-piloto.onrender.com/api/turnovivo-ai?action=extract',{
   method:'POST',headers:{authorization:'Bearer '+'a'.repeat(64),'content-type':'application/json',origin:'https://turnovivo-mvp-demo.vercel.app'},
   body:JSON.stringify({text:'Reservame a Mauro mañana a las 15 para corte de pelo',state:{}})
  }));
  assert.equal(result.status,200);
  const body=await result.json();
  assert.equal(body.values.action,'book');
  assert.equal(body.values.client_name,'Mauro');
  assert.equal(body.values.service_id,serviceId);
  assert.equal(body.values.time,'15:00');
  assert.equal(coreCalls,1);
  assert.equal(providerCalls,1);
 }finally{
  globalThis.fetch=original;
  if(originalKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=originalKey;
 }
});

test('TurnoVivo IA expone operaciones completas sin inventar atributos',async()=>{
 const original=globalThis.fetch,oldKey=process.env.OPENAI_API_KEY;
 process.env.OPENAI_API_KEY='test-key-no-real-credential-aaaaaaaaaaaa';
 const actions=["book","cancel","reschedule","availability","client_add","client_remove","client_edit","client_list","service_add","service_edit","service_remove","service_restore","service_list","report"];
 let index=0;
 globalThis.fetch=async(url,options={})=>{
  if(String(url).includes('turnovivo-core?action=dashboard'))return Response.json({business:{id:'tv-test-'+index,name:'Local de prueba',timezone:'America/Argentina/Buenos_Aires'},services:[{id:'10000000-0000-4000-8000-000000000001',name:'Corte',active:true}]});
  if(String(url)==='https://api.openai.com/v1/responses'){
   const body=JSON.parse(options.body),schema=body.text.format.schema;
   assert.deepEqual(schema.required,["action","client_name","client_phone","client_new_name","client_new_phone","client_email","service_id","service_name","service_new_name","duration_minutes","price_ars","date","time","from_date","from_time","report_from","report_to","report_metric","is_followup","clarification_question"]);assert.equal(schema.additionalProperties,false);
   for(const action of actions)assert.ok(schema.properties.action.enum.includes(action));
   const v=Object.fromEntries(schema.required.map(f=>[f,null]));v.action=actions[index++];v.is_followup=false;v.clarification_question=null;
   if(v.action==='service_edit'){v.service_id='10000000-0000-4000-8000-000000000001';v.price_ars='22000'}
   return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(v)}]}]});
  }
  throw Error('Unexpected fetch');
 };
 try{for(const act of actions){const response=await POST(new Request('https://cerca-piloto.onrender.com/api/turnovivo-ai?action=extract',{method:'POST',headers:{authorization:'Bearer '+'a'.repeat(64),'content-type':'application/json'},body:JSON.stringify({text:'Pedido de prueba '+act,state:{}})}));assert.equal(response.status,200);const body=await response.json();assert.equal(body.values.action,act)}}finally{globalThis.fetch=original;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey}
});

test('TurnoVivo IA distingue continuidad, mensajes nuevos y pregunta humana para ambigüedades',async()=>{
 const oldFetch=globalThis.fetch,oldKey=process.env.OPENAI_API_KEY;
 process.env.OPENAI_API_KEY='test-key-no-real-credential-aaaaaaaaaaaa';
 let call=0;
 globalThis.fetch=async(url,options={})=>{
  if(String(url).includes('turnovivo-core?action=dashboard'))
   return Response.json({business:{id:'test-natural-'+call,name:'Comercio',timezone:'America/Argentina/Buenos_Aires'},services:[{id:'10000000-0000-4000-8000-000000000001',name:'Corte',active:true}]});
  if(String(url)==='https://api.openai.com/v1/responses'){
   const request=JSON.parse(options.body);
   assert.equal(request.reasoning.effort,'high');
   assert.match(request.instructions,/errores tipográficos/);
   assert.match(request.instructions,/is_followup/);
   const fields=request.text.format.schema.required;
   const result=Object.fromEntries(fields.map(f=>[f,null]));
   result.action=call===0?'service_add':call===1?'client_add':'unknown';
   result.is_followup=call===0;
   result.clarification_question=call===2?'¿Querés cambiar un turno o su servicio?':null;
   if(call===0){result.service_name='Tintura';result.price_ars='15000';result.duration_minutes='45';}
   if(call===1)result.client_name='Lola';
   call++;
   return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(result)}]}]});
  }
  throw Error('Unexpected external call');
 };
 try{
  const cases=[
   {text:'sale 15 lucas y dura cuarenta y cinco',state:{action:'service_add',service_name:'Tintura'},expected:'service_add',followup:true},
   {text:'agregame a Lola',state:{action:'client_add',client_name:'Marta',client_phone:'2210000000'},expected:'client_add',followup:false},
   {text:'cambiale eso del viernes',state:{},expected:'unknown',followup:false}
  ];
  for(const c of cases){
   const r=await POST(new Request('https://cerca-piloto.onrender.com/api/turnovivo-ai?action=extract',{method:'POST',headers:{authorization:'Bearer '+'a'.repeat(64),'content-type':'application/json'},body:JSON.stringify({text:c.text,state:c.state})}));
   assert.equal(r.status,200);const d=await r.json();
   assert.equal(d.values.action,c.expected);assert.equal(d.values.is_followup,c.followup);
   if(c.expected==='unknown')assert.match(d.values.clarification_question,/turno/);
  }
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});
