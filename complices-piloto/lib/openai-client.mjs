// Adaptador de OpenAI para uso exclusivo del servidor de Cómplices.
// No almacenar claves, prompts, respuestas íntimas ni tokens en logs.
export const OPENAI_DEFAULT_MODEL="gpt-6-luna";
const ALLOWED_MODELS=new Set(["gpt-6-luna","gpt-5-mini","gpt-6.1-terra"]);
export function getOpenAIModel(env=process.env){
 const requested=String(env.OPENAI_MODEL||"").trim();
 return ALLOWED_MODELS.has(requested)?requested:OPENAI_DEFAULT_MODEL;
}
export function isAIConfigured(env=process.env){
 return Boolean(typeof env.OPENAI_API_KEY==="string"&&env.OPENAI_API_KEY.trim().length>10);
}
function parseOutput(payload){
 const outputs=Array.isArray(payload?.output)?payload.output:[];
 return outputs.flatMap(x=>Array.isArray(x?.content)?x.content:[])
  .filter(x=>x?.type==="output_text"&&typeof x.text==="string").map(x=>x.text).join("\n").trim();
}
export function getSafeReason(status){
 if(status===401||status===403)return "invalid_key";
 if(status===402)return "billing";
 if(status===429)return "limit";
 if(status>=500)return "provider";
 return "unavailable";
}
export async function callOpenAI({key,model=OPENAI_DEFAULT_MODEL,instructions,input,maxOutputTokens=500,schema=null,timeoutMs=16000,fetcher=fetch}){
 if(typeof key!=="string"||key.trim().length<11)return {ok:false,reason:"not_configured"};
 const maxTokens=Math.max(200,Math.min(750,Math.round(maxOutputTokens)));
 const json={
  model:ALLOWED_MODELS.has(model)?model:OPENAI_DEFAULT_MODEL,
  instructions:String(instructions||"").slice(0,8500),
  input:typeof input==="string"?input.slice(0,6000):JSON.stringify(input).slice(0,6000),
  max_output_tokens:maxTokens,
  reasoning:{effort:"none"},
  store:false
 };
 if(schema)json.text={format:{type:"json_schema",name:"complices_activity_ideas",strict:true,schema}};
 try{
  const response=await fetcher("https://api.openai.com/v1/responses",{
   method:"POST",
   headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
   body:JSON.stringify(json),
   cache:"no-store",
   signal:AbortSignal.timeout(Math.max(2500,Math.min(20000,timeoutMs)))
  });
  if(!response.ok)return {ok:false,reason:getSafeReason(response.status)};
  const payload=await response.json();
  if(payload?.status==="incomplete")return {ok:false,reason:"incomplete"};
  if(payload?.error)return {ok:false,reason:"provider"};
  const text=parseOutput(payload);
  if(!text||text.length>7000)return {ok:false,reason:"empty"};
  return {ok:true,text,model:json.model};
 }catch(e){
  return {ok:false,reason:e?.name==="TimeoutError"||e?.name==="AbortError"?"timeout":"network"};
 }
}
// Verifica credenciales y acceso al modelo sin crear una respuesta de pago.
// El control de gastos del proyecto OpenAI sigue siendo independiente.
export async function verifyOpenAI({key,model=OPENAI_DEFAULT_MODEL,fetcher=fetch}){
 if(typeof key!=="string"||key.trim().length<11)return {configured:false,reachable:false,reason:"not_configured"};
 const choice=ALLOWED_MODELS.has(model)?model:OPENAI_DEFAULT_MODEL;
 try{
  const response=await fetcher("https://api.openai.com/v1/models/"+encodeURIComponent(choice),{
   method:"GET",headers:{"Authorization":"Bearer "+key},cache:"no-store",signal:AbortSignal.timeout(10000)
  });
  return {configured:true,reachable:response.ok,model:choice,...(!response.ok?{reason:getSafeReason(response.status)}:{})};
 }catch{return {configured:true,reachable:false,model:choice,reason:"network"}}
}
