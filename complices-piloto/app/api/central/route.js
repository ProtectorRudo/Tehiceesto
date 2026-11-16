import {createClient} from "@supabase/supabase-js";
import {createHash} from "node:crypto";
import {buildEditorialSchema,selectEditorialMissions,EDITORIAL_ENGINE_VERSION} from "../../../lib/mission-editorial.mjs";
import {isClearlyWeakMission} from "../../../lib/mission-substance.mjs";
import {selectInspiration,TESTIMONY_LIBRARY_VERSION} from "../../../lib/testimony-inspiration.mjs";
import {buildWeeklyMissions} from "../../../lib/weekly-missions.mjs";
import {partnerGuidedIdeas,safeProfile,profileForOwnAI} from "../../../lib/ai-profile.mjs";
import {callOpenAI,getMissionEditorialModel} from "../../../lib/openai-client.mjs";
import {MISSION_EDITORIAL_RULES,MISSION_EXAMPLES} from "../../../lib/mission-quality.mjs";
import {upcomingOccasions,occasionMission} from "../../../lib/relationship-intelligence.mjs";
import {selectAuthorizedCareHint,buildContextualCareIdea} from "../../../lib/contextual-care.mjs";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const NO_STORE={"Cache-Control":"no-store","X-Robots-Tag":"noindex"};
const send=(data,status=200)=>Response.json(data,{status,headers:NO_STORE});
const EDITORIAL_INSTRUCTIONS=[
 "Sos editora creativa de misiones para una pareja adulta: tu trabajo es proponer gestos que hagan sentir visto, conocido y cuidado al destinatario. NO sos terapeuta.",
 "Generá EXACTAMENTE DOS candidatos diferentes por cada slot solicitado, identificados como a y b. Los slots mission_1, mission_2 y mission_3 son tres misiones individuales distintas; weekly_1 es la misión semanal cuando corresponde. Cada candidato contiene title, body y mechanic; el último es uno de los valores del esquema. No escribas explicación externa.",
 "Las misiones individuales deben ser gestos iniciados por el usuario que cuiden a su pareja sin exigirle nada a cambio, realizables en 5 a 15 minutos. La misión semanal dura de 15 a 45 minutos y debe ser una experiencia o una iniciativa con intención y un resultado real: aliviar una carga, mostrar gratitud o aprecio concreto, preparar una cita elegida para el otro o disfrutar una actividad que REALMENTE le gusta. Una ocurrencia inventada no es una misión. Si es cooperativa, el servidor la protege y no te la pide.",
 "Antes de redactar: identificá qué gusto o necesidad AFECTIVA autorizada se podría cuidar. Las inspiraciones editoriales son mecanismos abstraídos de testimonios públicos, NO instrucciones para copiar historias, citas ni personas. Son experiencias anecdóticas, no pruebas de eficacia. Seleccioná un mecanismo pertinente, pensá dos alternativas distintas y convertílo en un gesto para esta pareja.",
 "Cada candidato debe contener una ACCIÓN clara y específica, un detalle reconocible y una forma de ofrecerla sin presionar. Escribí el BODY como instrucciones ejecutables: QUÉ preparar (un objeto, tarea o actividad identificable), CÓMO ofrecerlo y QUÉ gesto de aprecio concreto cierra la experiencia. Si decís juego, nombrá uno específico como Trazo o Entre Dos disponibles en Cómplices; si decís película, indicá cómo elegirla sin inventar una favorita. No dejes que el usuario tenga que inventar el plan.",
 "La variante a debe centrarse en un detalle personal; b debe utilizar un mecanismo diferente (alivio, sorpresa, experiencia, humor, recuerdo, palabras, atención). Evitá repetir el mismo recurso entre días: no tres notas ni tres juegos de pistas.",
 "Descartá lugares comunes: rondas de adivinanzas, tres pistas sobre anécdotas, listas de recuerdos, cartas genéricas, preguntas que podría hacer cualquiera, 'un momento especial', frases hechas. RECHAZÁ misiones como «elegí un juego que disfrute», «prepará una sorpresa», «sumá un guiño» o «un plan lindo» si no especifican en qué consisten. Nunca inventes nombres graciosos, menús de fantasía o actividades que solo suenan originales. Los juegos sueltos pertenecen a Juegos, no son misiones de 120 corazones.",
 "Cuando no haya gustos autorizados, proponé una atención universal respetuosa y sin atribuir preferencias o sentimientos no informados. Los códigos de gustos son señales limitadas, no permisos para citar confesiones.",
 "Jamás reveles respuestas, recuerdos privados o secretos de la otra persona. No digas 'sé que necesita' ni aludas a su estado emocional sin autorización. No atribuyas emociones ni inventes fechas, comidas, canciones, lugares o historias personales.",
 "Prohibido imponer compras, mostrar afecto en público por obligación, manipular, forzar contacto corporal sin consentimiento o proponer terapia. La opción de pasar la misión siempre existe.",
 "Aplicá el mismo estándar a las misiones diarias. La semanal NO es una diaria estirada: requiere preparar, ofrecer y compartir una experiencia concreta, con posibilidad de declinar. Si no hay gustos explícitos, no inventes gustos, días memorables, comidas preferidas ni emociones. Redactá en español argentino natural, sin tono infantil ni cursilería vacía. Títulos de 4 a 85 caracteres, descripciones de 45 a 260 caracteres. Escribí solamente JSON válido."
].join(" ");
function dates(){
 const now=new Date();
 const date=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Argentina/Buenos_Aires",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
 const d=new Date(date+"T12:00:00Z");d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));
 return {date,week:d.toISOString().slice(0,10)};
}
async function improveWithAI(guided,context,db){
 if(!process.env.OPENAI_API_KEY)return guided;
 const slots=guided.filter(x=>x.slot.startsWith("mission_")||(x.slot==="weekly_1"&&!context.schedule.cooperative)).map(x=>x.slot);
 if(!slots.length)return guided;
 // Cupo adicional independiente: hasta dos propuestas editoriales por persona y día.
 const {data:editorSlot,error:editorError}=await db.rpc("cp_claim_editorial_slot");
 if(editorError||!editorSlot)return guided;
 const {data:hourSlot,error:hourError}=await db.rpc("cp_claim_ai_slot");
 if(hourError||!hourSlot)return guided;
 const {data:daySlot,error:dailyError}=await db.rpc("cp_claim_openai_slot");
 if(dailyError||!daySlot)return guided;
 const schema=buildEditorialSchema(slots);
 const safeContext={
  missionAssignments:context.schedule.days,
  weeklyMode:context.schedule.weeklyMode,
  approvedPartnerChoices:context.partnerProfile,
  partnerApprovedThemes:context.partnerSignals,
  ownPreferences:context.preferences,
  ownStructuredPreferences:context.ownProfile,
  ownAnswers:context.reflections.filter(x=>x.ai_use_allowed).slice(0,5).map(r=>({question:r.question,answer:String(r.answer).slice(0,250)})),
  ownMemories:context.memories.filter(x=>x.use_for_ai).slice(0,6).map(r=>({category:r.category,text:String(r.body).slice(0,200)})),
  upcomingImportantDates:context.importantDates||[],
  feedback:context.learning||[],
  recentTitles:context.recentTitles||[],
  requestedSlots:slots,
  // No enviar el texto de los respaldos: si son pobres, contaminan las propuestas.
  quality:MISSION_EDITORIAL_RULES,
  examples:MISSION_EXAMPLES,
  // Patrones originales abstraídos de relatos públicos; sin texto ni identidad de terceros.
  testimonyInspiredPatternsBySlot:Object.fromEntries(slots.map(slot=>[
   slot,selectInspiration({partnerProfile:context.partnerProfile,slot,limit:2})
  ])),
  testimonyLibraryVersion:TESTIMONY_LIBRARY_VERSION
 };
 try{
  const ai=await callOpenAI({
   key:process.env.OPENAI_API_KEY,model:getMissionEditorialModel(),maxOutputTokens:2200,timeoutMs:18000,editorial:true,
   instructions:EDITORIAL_INSTRUCTIONS,
   input:JSON.stringify(safeContext),
   schema
  });
  if(!ai.ok)return guided;
  const generated=JSON.parse(ai.text);
  return selectEditorialMissions({guided,proposals:generated,partnerProfile:context.partnerProfile,
   recentTitles:context.recentTitles,
   protectedSlots:context.schedule.cooperative?["weekly_1"]:[]});
 }catch{return guided}
}
export async function GET(request){
 try{
  const token=(request.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!token||token.length>5000)return send({error:"Iniciá sesión"},401);
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{
   auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:"Bearer "+token}}
  });
  const {data:{user},error:authError}=await db.auth.getUser(token);
  if(authError||!user)return send({error:"Sesión inválida"},401);
  const {data:member,error:membershipError}=await db.from("cp_members").select("space_id").eq("user_id",user.id).maybeSingle();
  if(membershipError||!member)return send({error:"Primero creá o aceptá el espacio privado"},403);
  const {date,week}=dates();
  const periodKeys=["w:"+week];
  const {data:cached,error:cachedError}=await db.from("cp_ai_activities").select("*").eq("user_id",user.id).in("period_key",periodKeys);
  if(cachedError)return send({error:"No se pudieron consultar tus actividades"},503);
  const membersList=await db.from("cp_members").select("user_id,joined_at").eq("space_id",member.space_id);
  if(membersList.error||!membersList.data?.some(x=>x.user_id===user.id))return send({error:"No pude verificar el calendario de la pareja"},503);
  const [p,reflections,memories,hint,history,feedback,partnerThemes,partnerChoices,ownCards,dateRows,careHintRows]=await Promise.all([
   db.from("cp_preferences").select("favorite_treat,favorite_plan,love_language").eq("user_id",user.id).maybeSingle(),
   db.from("cp_reflections").select("question_id,question,answer,ai_use_allowed").eq("user_id",user.id).eq("ai_use_allowed",true).limit(12),
   db.from("cp_ai_memories").select("category,body,use_for_ai").eq("user_id",user.id).eq("use_for_ai",true).order("created_at",{ascending:false}).limit(20),
   db.rpc("cp_partner_surprise",{p_space:member.space_id}),
   db.from("cp_ai_activities").select("id,theme,task_key,title").eq("user_id",user.id).order("created_at",{ascending:false}).limit(60),
   db.from("cp_ai_feedback").select("activity_id,rating,updated_at").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(30),
   db.rpc("cp_partner_signals",{p_space:member.space_id}),
   process.env.CP_PROFILE_INTERNAL_KEY?db.rpc("cp_partner_profile",{p_space:member.space_id,p_internal_secret:process.env.CP_PROFILE_INTERNAL_KEY}):Promise.resolve({data:{},error:null}),
   db.from("cp_ai_profile_cards").select("question_key,answer_code").eq("user_id",user.id).limit(16),
   db.from("cp_important_dates").select("id,user_id,kind,label,event_on,repeat_yearly,share_with_partner").eq("space_id",member.space_id).limit(40),
   // RLS sólo devuelve necesidades que otra persona AUTORIZÓ para el día actual.
   // Nunca consultamos cp_today_moods ni incluimos emociones originales en la IA.
   db.from("cp_partner_care_hints").select("user_id,day,care_need").eq("space_id",member.space_id).eq("day",date)
  ]);
  const failed=[p,reflections,memories,hint,history,feedback,partnerThemes,partnerChoices,ownCards,dateRows,careHintRows].some(x=>x.error);
  if(failed)return send({error:"No pude preparar las propuestas sin verificar tus preferencias privadas"},503);
  const themesById=new Map((history.data||[]).map(a=>[a.id,a.theme]));
  const ratingThemes=(feedback.data||[]).map(x=>({theme:themesById.get(x.activity_id),rating:x.rating,updatedAt:x.updated_at})).filter(x=>x.theme);
  // Solo las últimas tres semanas influyen en la elección guiada.
  // No se comparte con la pareja: este aprendizaje pertenece al autor de la misión.
  const recentRatingCutoff=Date.now()-21*86400000;
  const freshRatings=ratingThemes.filter(x=>Date.parse(x.updatedAt)>=recentRatingCutoff);
  const avoidThemes=[...new Set(freshRatings.filter(x=>x.rating===-1).map(x=>x.theme))];
  const preferThemes=[...new Set(freshRatings.filter(x=>x.rating===1&&!avoidThemes.includes(x.theme)).map(x=>x.theme))];
  const ownProfile=profileForOwnAI(ownCards.data||[]);
  const planMap={paseo:"caminar",cocinar:"cocinar",pelicula:"peli",charlar:"charlar",jugar:"charlar",salida:"salir",descanso:"charlar"};
  const ownPreferences={...p.data};
  if(ownProfile.plan&&planMap[ownProfile.plan])ownPreferences.favorite_plan=planMap[ownProfile.plan];
  if(ownProfile.afecto&&["palabras","tiempo","detalles","ayuda","contacto"].includes(ownProfile.afecto))ownPreferences.love_language=ownProfile.afecto;
  const importantDates=upcomingOccasions(dateRows.data||[],date,45);
  const context={preferences:ownPreferences,ownProfile,reflections:reflections.data||[],memories:memories.data||[],partnerSignals:partnerThemes.data||[],partnerProfile:safeProfile(partnerChoices.data),importantDates};
  const personallyTailored=partnerGuidedIdeas(context.partnerProfile);
  const authorizedHint=selectAuthorizedCareHint(careHintRows.data,{
   today:date,recipientId:user.id,memberIds:(membersList.data||[]).map(m=>m.user_id)
  });
  // Recomendación contextual efímera: no se envía el ánimo al modelo ni se
  // persiste en actividades. Si se revoca la pista o cambia el día, desaparece.
  const contextualCare=buildContextualCareIdea({
   hint:authorizedHint,partnerProfile:context.partnerProfile,
   feedback:freshRatings,recentThemes:(history.data||[]).slice(0,8).map(x=>x.theme)
  });
  const prepared=buildWeeklyMissions({userId:user.id,spaceId:member.space_id,week,members:membersList.data,partnerProfile:context.partnerProfile,recentTitles:[],avoidThemes,preferThemes});
  const schedule=prepared.schedule;
  const readySlots=prepared.activities.map(x=>x.slot);
  const fingerprint=createHash("sha256").update(JSON.stringify({engine:EDITORIAL_ENGINE_VERSION,context:{...context,importantDates:importantDates.map(({days_until,...row})=>row)},week,schedule,participants:membersList.data.map(x=>x.user_id),ratings:feedback.data||[]})).digest("hex");
  const {data:done,error:doneError}=await db.from("cp_completions").select("task_key").eq("space_id",member.space_id).eq("user_id",user.id);
  if(doneError)return send({error:"No se pudo verificar tu progreso"},503);
  const doneKeys=new Set((done||[]).map(x=>x.task_key));
  const completedThemes=(history.data||[]).filter(x=>doneKeys.has(x.task_key)).map(x=>x.theme).filter(Boolean);
  const learning=[...completedThemes.slice(0,12).map(theme=>({theme,signal:"completada"})),...ratingThemes.slice(0,12).map(x=>({theme:x.theme,signal:x.rating===1?"me_gusto":"no_me_gusto"}))];
  const recentTitles=(history.data||[]).filter(x=>!periodKeys.some(prefix=>x.task_key?.startsWith(prefix+":"))).slice(0,24).map(x=>x.title).filter(Boolean);
  const current=(cached||[]).filter(a=>readySlots.includes(a.slot));
  const isFresh=(item)=>doneKeys.has(item.task_key)||(item.context_fingerprint===fingerprint&&!isClearlyWeakMission(item));
  if(readySlots.every(k=>current.some(x=>x.slot===k&&isFresh(x))))
    return send({activities:current,mode:current.some(x=>x.mode==="generativa")?"generativa":"guiado",cached:true,schedule,careSuggestion:contextualCare,personalization:{ownAnswers:Object.keys(ownProfile).length,partnerSharedPreferences:personallyTailored.count,realAI:Boolean(process.env.OPENAI_API_KEY)}});
  const generatedFallback=buildWeeklyMissions({userId:user.id,spaceId:member.space_id,week,members:membersList.data,partnerProfile:context.partnerProfile,recentTitles,avoidThemes,preferThemes});
  let generated=generatedFallback.activities;
  const occasion=importantDates.find(x=>x.days_until<=14);
  if(occasion&&schedule.weeklyAssigned&&!schedule.cooperative){
   const weekIndex=generated.findIndex(x=>x.slot==="weekly_1");
   const mission=occasionMission(occasion);
   if(weekIndex>=0&&mission)generated[weekIndex]={...generated[weekIndex],...mission};
  }
  const requiresAI=readySlots.some(slot=>{
   const old=current.find(x=>x.slot===slot);
   return !old||!isFresh(old);
  });
  if(requiresAI)generated=await improveWithAI(generated,{...context,schedule,learning,recentTitles},db);
  const missing=generated.filter(item=>!current.some(row=>row.slot===item.slot)).map(x=>({...x,user_id:user.id,space_id:member.space_id,context_fingerprint:fingerprint}));
  if(missing.length){
   const {error:writeError}=await db.from("cp_ai_activities").upsert(missing,{onConflict:"user_id,period_key,slot",ignoreDuplicates:true});
   if(writeError)return send({error:"No pude guardar tus nuevas actividades"},503);
  }
  for(const item of generated){
   const old=current.find(x=>x.slot===item.slot);
   if(!old||isFresh(old))continue;
   // Respetamos las generativas buenas, pero NO preservamos una mala
   // sólo porque antes la creó el modelo. Nunca tocamos las cumplidas.
   if(old.mode==="generativa"&&item.mode!=="generativa"&&!isClearlyWeakMission(old)){
    const {error:stampError}=await db.from("cp_ai_activities")
     .update({context_fingerprint:fingerprint}).eq("id",old.id).eq("user_id",user.id);
    if(stampError)return send({error:"No pude confirmar la vigencia de tu misión"},503);
    continue;
   }
   const {error:updateError}=await db.from("cp_ai_activities").update({
    title:item.title,body:item.body,theme:item.theme,icon:item.icon,mode:item.mode,context_fingerprint:fingerprint
   }).eq("id",old.id).eq("user_id",user.id);
   if(updateError)return send({error:"No pude adaptar las actividades a tus nuevas preferencias"},503);
  }
  const {data:activities,error:readError}=await db.from("cp_ai_activities").select("*").eq("user_id",user.id).in("period_key",periodKeys);
  if(readError||!activities)return send({error:"No pude recuperar las actividades guardadas"},503);
  return send({activities:activities.filter(x=>readySlots.includes(x.slot)),mode:activities.some(x=>readySlots.includes(x.slot)&&x.mode==="generativa")?"generativa":"guiado",cached:false,schedule,careSuggestion:contextualCare,personalization:{ownAnswers:Object.keys(ownProfile).length,partnerSharedPreferences:personallyTailored.count,realAI:Boolean(process.env.OPENAI_API_KEY)}});
 }catch{return send({error:"No pude preparar la experiencia de hoy"},500)}
}
