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
   assert.deepEqual(body.text.format.schema.required,['action','client_name','client_phone','service_id','date','time']);
   return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({action:'book',client_name:'Mauro',client_phone:null,service_id:serviceId,date:'2026-11-21',time:'15:00'})}]}]});
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
