import test from "node:test";
import assert from "node:assert/strict";
import {getOpenAIModel,isAIConfigured,callOpenAI,verifyOpenAI,getSafeReason} from "../lib/openai-client.mjs";
const KEY="sk-test-01234567890-not-a-real-key";
test("sin clave el backend no intenta llamar a OpenAI",async()=>{
 let requests=0;
 const x=await callOpenAI({key:"",fetcher:async()=>{requests++;throw Error("should not call")}});
 assert.equal(x.ok,false);assert.equal(x.reason,"not_configured");assert.equal(requests,0);
 assert.equal(isAIConfigured({}),false);
});
test("modelo económico por defecto y modelos explícitos limitados",()=>{
 assert.equal(getOpenAIModel({}),"gpt-6-luna");
 assert.equal(getOpenAIModel({OPENAI_MODEL:"gpt-6.1-terra"}),"gpt-6.1-terra");
 assert.equal(getOpenAIModel({OPENAI_MODEL:"inventado"}),"gpt-6-luna");
});
test("solicitud de respuesta no almacena conversaciones y acota tokens",async()=>{
 let request;
 const fetcher=async(uri,init)=>{request={uri,init};return Response.json({status:"completed",output:[{content:[{type:"output_text",text:"Una nota cariñosa"}]}]})};
 const result=await callOpenAI({key:KEY,instructions:"Sos Cómplice",input:"Quiero sorprender",maxOutputTokens:9999,fetcher});
 assert.equal(result.ok,true);assert.equal(result.text,"Una nota cariñosa");
 assert.equal(request.uri,"https://api.openai.com/v1/responses");
 assert.equal(request.init.headers.Authorization,"Bearer "+KEY);
 const body=JSON.parse(request.init.body);
 assert.equal(body.store,false);
 assert.equal(body.model,"gpt-6-luna");
 assert.equal(body.max_output_tokens,750);
 assert.equal(body.reasoning.effort,"none");
});
test("solicitudes estructuradas incluyen JSON schema estricto",async()=>{
 let body;
 const schema={type:"object",additionalProperties:false,required:["title"],properties:{title:{type:"string"}}};
 await callOpenAI({key:KEY,instructions:"Escribí un título",input:"Sorpresa",schema,fetcher:async(_url,init)=>{body=JSON.parse(init.body);return Response.json({output:[{content:[{type:"output_text",text:'{"title":"Un paseo"}'}]}]})}});
 assert.equal(body.text.format.type,"json_schema");
 assert.equal(body.text.format.strict,true);
 assert.deepEqual(body.text.format.schema,schema);
});
test("no se exponen respuestas de error crudas ni credenciales",async()=>{
 const failed=await callOpenAI({key:KEY,instructions:"hola",input:"prueba",fetcher:async()=>new Response('SECRET_PROVIDER_ERROR',{status:401})});
 assert.deepEqual(failed,{ok:false,reason:"invalid_key"});
 const unpaid=await callOpenAI({key:KEY,instructions:"hola",input:"prueba",fetcher:async()=>new Response("Billing required",{status:402})});
 assert.equal(unpaid.reason,"billing");
 assert.equal(getSafeReason(429),"limit");
});
test("respuesta vacía o incompleta no se considera éxito",async()=>{
 const a=await callOpenAI({key:KEY,instructions:"prueba",input:"texto",fetcher:async()=>Response.json({output:[]})});
 const b=await callOpenAI({key:KEY,instructions:"prueba",input:"texto",fetcher:async()=>Response.json({status:"incomplete",output:[{content:[{type:"output_text",text:"parcial"}]}]})});
 assert.equal(a.reason,"empty");assert.equal(b.reason,"incomplete");
});
test("diagnóstico verifica modelo sin generar respuestas ni gastar tokens",async()=>{
 let call;
 const response=await verifyOpenAI({key:KEY,fetcher:async(u,opts)=>{call={u,opts};return new Response("{}",{status:200})}});
 assert.equal(response.reachable,true);
 assert.equal(response.configured,true);
 assert.equal(call.opts.method,"GET");
 assert.match(call.u,/\/models\/gpt-6-luna$/);
});
test("un servicio caído se informa como indisponible sin exponer la clave",async()=>{
 const response=await verifyOpenAI({key:KEY,fetcher:async()=>{throw Error("SECRET: "+KEY)}});
 assert.equal(response.configured,true);
 assert.equal(response.reachable,false);
 assert.equal(response.reason,"network");
 assert.equal(JSON.stringify(response).includes(KEY),false);
});
