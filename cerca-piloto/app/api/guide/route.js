import {authenticated,json} from "../../../lib/server.mjs";
import {generateJSON,hasAI} from "../../../lib/openai.mjs";
import {isoDay} from "../../../lib/quality.mjs";
export const runtime="nodejs";
const RISK=/\b(suicid|autolesi[oó]n|abuso sexual|violencia extrema|golpes fuertes|no respira|sobredosis|desmayad|maltrato grave|me quiero matar|se quiere matar)\b/i;
export async function POST(req){
 const auth=await authenticated(req);
 if(auth.error)return json({error:auth.error},auth.code);
 const {db,user}=auth;
 let input;
 try{input=await req.json()}catch{return json({error:"Solicitud inválida."},400)}
 const situation=String(input?.situation||"").trim();
 if(situation.length<12||situation.length>1200)return json({error:"Contame la situación en 12 a 1200 caracteres."},400);
 if(RISK.test(situation))return json({guidance:"Esto podría requerir ayuda inmediata de una persona profesional o un servicio de emergencias de tu localidad. Priorizá la seguridad, acompañá sin confrontar y no dependas de una respuesta automática.",safety:true},200);
 const family=await db.from("cerca_families").select("id,timezone").eq("owner_id",user.id).maybeSingle();
 if(!family.data)return json({error:"No hay una familia creada."},409);
 const day=isoDay(new Date(),family.data.timezone||"America/Argentina/Buenos_Aires");
 const count=await db.from("cerca_guide_usage").select("id",{count:"exact",head:true}).eq("user_id",user.id).eq("day",day);
 if(count.error)return json({error:"No se pudo verificar el límite de consultas."},500);
 if((count.count||0)>=5)return json({error:"Llegaste a las cinco consultas diarias de este piloto. Mañana vas a poder continuar."},429);
 if(!hasAI())return json({error:"La guía personalizada requiere configurar OpenAI en el servidor CERCA."},503);
 const kids=await db.from("cerca_children").select("name,age_years,goals").eq("family_id",family.data.id).limit(6);
 const instructions=`Actuá como guía informativa para adultos que crían o acompañan. Respondé SOLO un JSON válido {"guidance":"..."} en español de Argentina, máximo 900 caracteres, con 2-3 pasos realistas, concretos y respetuosos. Escuchá el contexto sin culpabilizar. No diagnostiques, ni prometas resultados, ni propongas castigos, gritos, manipulación, vigilancia, obediencia como objetivo. Respetá autonomía y seguridad de los menores. No inventes hechos del hogar ni cites fuentes inexistentes. La IA no reemplaza a profesionales de salud mental, pediatría, educación o emergencias. Si la consulta revela peligro, sugerí ayuda profesional y seguridad inmediata. No solicites datos identificables del niño.`;
 const result=await generateJSON(instructions,{situation,children:(kids.data||[]).map(c=>({age:c.age_years,goals:c.goals||[]}))},{maxOutputTokens:500});
 if(!result.ok||typeof result.data?.guidance!=="string")return json({error:"La guía no estuvo disponible. Podés volver a intentarlo."},503);
 const usage=await db.from("cerca_guide_usage").insert({user_id:user.id,day});
 if(usage.error)return json({error:"No se pudo contabilizar el uso."},500);
 return json({guidance:result.data.guidance.slice(0,1100),safety:false});
}
