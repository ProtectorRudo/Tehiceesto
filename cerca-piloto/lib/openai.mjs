// No registrar prompts, textos familiares ni claves. store:false impide retención en Responses.
const ALLOWED=new Set(["gpt-6-luna","gpt-6.1-terra"]);
export function model(){const m=process.env.CERCA_OPENAI_MODEL;return ALLOWED.has(m)?m:"gpt-6.1-terra"}
export function hasAI(){return Boolean(process.env.OPENAI_API_KEY?.length>20)}
export async function generateJSON(instructions,input,{maxOutputTokens=2700}={}){
 if(!hasAI())return {ok:false,reason:"missing_key"};
 const payload={
  model:model(),store:false,instructions:instructions.slice(0,11000),
  input:JSON.stringify(input).slice(0,9000),
  max_output_tokens:Math.min(4500,maxOutputTokens),
  reasoning:{effort:"low"},
  text:{format:{type:"json_object"}}
 };
 try{
  const response=await fetch("https://api.openai.com/v1/responses",{
   method:"POST",headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},
   body:JSON.stringify(payload),signal:AbortSignal.timeout(25000),cache:"no-store"
  });
  if(!response.ok)return {ok:false,reason:"provider_"+response.status};
  const body=await response.json();
  const text=(body.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("");
  if(!text)return {ok:false,reason:"empty"};
  return {ok:true,data:JSON.parse(text)};
 }catch{return {ok:false,reason:"timeout_or_invalid"}}
}
