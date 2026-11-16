import {authenticated,json} from "../../../lib/server.mjs";
import {generateJSON,hasAI} from "../../../lib/openai.mjs";
import {isoDay,monday,validateBatch} from "../../../lib/quality.mjs";
import {editorialMissions,editorialWeekly} from "../../../lib/fallback.mjs";

export const runtime="nodejs";
const SYSTEM=`Sos un editor experto en experiencias de crianza respetuosa para la app CERCA.
Devolvé SOLO JSON válido con {"missions":[{"child_id":"UUID exacto","kind":"conectar|comprender|sembrar","title":"...","how":"...","why":"...","minutes":N}],"weekly":{"title":"...","how":"...","why":"...","minutes":N}}.
EXACTAMENTE 3 misiones diarias por cada hijo, una de cada kind, y una semanal familiar total.
La PERSONA adulta recibe las propuestas; no hay cuenta del menor. No diagnostiques, no prometas resultados, no exigencias de respuesta, no recompensas ni castigos, ni obediencia como objetivo. Contenido en español claro y cálido.
Cada misión incluye un título concreto, instrucciones accionables de 2 a 4 pasos (48-500 caracteres), explicación honesta de para qué (20-260 caracteres), 5-15 minutos; semanal 15-45 minutos. Costo cero, materiales cotidianos seguros, flexibles y apropiados a edad. No forzar contacto físico ni conversaciones. No introducir datos no declarados; intereses son pistas, nunca suposiciones de hechos. Adecuá a ánimo y disponibilidad del cuidador y alterná mecanismos. Evitá títulos y acciones recientes. Preferí ideas distintas de los clichés y con sentido relacional. En bebés observar señales y responder, nunca usar piezas pequeñas. Nada de recomendaciones clínicas. No inventes testimonios ni fuentes.
Escribí solo JSON.`;
function safeStr(s,max=300){return String(s||"").trim().slice(0,max)}
export async function POST(req){
 const auth=await authenticated(req);
 if(auth.error)return json({error:auth.error},auth.code);
 const {db,user}=auth;
 const familyQ=await db.from("cerca_families").select("id,timezone").eq("owner_id",user.id).maybeSingle();
 if(familyQ.error)return json({error:"No se pudo leer el grupo familiar."},500);
 const family=familyQ.data;
 if(!family)return json({error:"Creá primero tu familia."},409);
 const childQ=await db.from("cerca_children").select("id,name,age_years,interests,goals,notes").eq("family_id",family.id).order("created_at").limit(7);
 if(childQ.error)return json({error:"No se pudieron leer los perfiles."},500);
 const children=childQ.data||[];
 if(!children.length)return json({error:"Agregá un hijo para comenzar."},409);
 if(children.length>6)return json({error:"Límite del piloto: seis perfiles por familia."},400);
 let today;
 try{today=isoDay(new Date(),family.timezone||"America/Argentina/Buenos_Aires")}catch{today=isoDay()}
 const week=monday(today);
 const [dailyQ,weeklyQ]=await Promise.all([
  db.from("cerca_missions").select("*").eq("family_id",family.id).eq("day",today).neq("kind","familiar"),
  db.from("cerca_missions").select("*").eq("family_id",family.id).eq("day",week).eq("kind","familiar")
 ]);
 if(dailyQ.error||weeklyQ.error)return json({error:"No se pudo leer el calendario."},500);
 const existing=dailyQ.data||[],oldWeekly=weeklyQ.data||[];
 const complete=children.every(c=>["conectar","comprender","sembrar"].every(k=>existing.some(m=>m.child_id===c.id&&m.kind===k)));
 if(complete&&oldWeekly.length)return json({missions:existing,weekly:oldWeekly[0],today,source:"cache"});
 const [moodQ,historyQ]=await Promise.all([
  db.from("cerca_moods").select("mood,detail").eq("family_id",family.id).eq("day",today).maybeSingle(),
  db.from("cerca_missions").select("title,day,kind").eq("family_id",family.id).lt("day",today).order("day",{ascending:false}).limit(45)
 ]);
 const recentTitles=(historyQ.data||[]).map(x=>x.title);
 const mood=moodQ.data?{mood:moodQ.data.mood,detail:safeStr(moodQ.data.detail,180)}:null;
 const previous=await db.from("cerca_entries").select("status,reflection,mission_id").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(12);
 const context={today,children:children.map(c=>({id:c.id,name:safeStr(c.name,35),age_years:c.age_years,interests:c.interests||[],goals:c.goals||[],notes:safeStr(c.notes,180)})),
  caregiverMood:mood,previousExperiences:(previous.data||[]).map(x=>({status:x.status,reflection:safeStr(x.reflection,120)})),
  recentTitles:recentTitles.slice(0,30)};
 let batch=null,source="editorial";
 if(hasAI()){
  const response=await generateJSON(SYSTEM,context,{maxOutputTokens:4500});
  if(response.ok&&validateBatch(children,response.data.missions,response.data.weekly,recentTitles)){
   batch=response.data;source="ia";
  }
 }
 if(!batch)batch={missions:editorialMissions(children),weekly:editorialWeekly()};
 const rows=[
 ...batch.missions.map(m=>({family_id:family.id,child_id:m.child_id,day:today,kind:m.kind,title:safeStr(m.title,85),how:safeStr(m.how,500),why:safeStr(m.why,260),minutes:Math.min(45,Math.max(2,Number(m.minutes)||10)),origin:source})),
 {family_id:family.id,child_id:null,day:week,kind:"familiar",title:safeStr(batch.weekly.title,85),how:safeStr(batch.weekly.how,500),why:safeStr(batch.weekly.why,260),minutes:Math.min(45,Math.max(15,Number(batch.weekly.minutes)||20)),origin:source}
 ];
 const missing=rows.filter(r=>!([...existing,...oldWeekly]).some(m=>m.child_id===r.child_id&&m.day===r.day&&m.kind===r.kind));
 if(missing.length){
  const written=await db.from("cerca_missions").upsert(missing,{onConflict:"family_id,child_id,day,kind",ignoreDuplicates:true});
  if(written.error)return json({error:"No se pudieron guardar las misiones. Revisar esquema y permisos."},500);
 }
 const [finalDaily,finalWeekly]=await Promise.all([
  db.from("cerca_missions").select("*").eq("family_id",family.id).eq("day",today).neq("kind","familiar"),
  db.from("cerca_missions").select("*").eq("family_id",family.id).eq("day",week).eq("kind","familiar").maybeSingle()
 ]);
 if(finalDaily.error||finalWeekly.error)return json({error:"Las misiones se guardaron, pero no se pudieron consultar."},500);
 return json({missions:finalDaily.data,weekly:finalWeekly.data,today,source});
}
