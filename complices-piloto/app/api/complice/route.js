
import {createClient} from "@supabase/supabase-js";
import {partnerGuidedIdeas,safeProfile,profileForOwnAI} from "../../../lib/ai-profile.mjs";
export const dynamic="force-dynamic";
export async function GET(){return Response.json({mode:process.env.OPENAI_API_KEY?"ia":"guiado"},{headers:{"Cache-Control":"no-store"}})}
export async function POST(request){
 try{
  const token=(request.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!token||token.length>5000)return Response.json({error:"Sesión requerida."},{status:401});
  const payload=await request.json();
  const message=String(payload.message||"").trim().slice(0,350);
  if(!message)return Response.json({error:"Falta una pregunta."},{status:400});
  const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:"Bearer "+token}}});
  const {data:{user},error}=await client.auth.getUser(token);
  if(error||!user)return Response.json({error:"Sesión inválida."},{status:401});
  const [pref,membership,reflections,memories,ownCards]=await Promise.all([
   client.from("cp_preferences").select("favorite_treat,favorite_plan,love_language").eq("user_id",user.id).maybeSingle(),
   client.from("cp_members").select("space_id,display_name").eq("user_id",user.id).maybeSingle(),
   client.from("cp_reflections").select("question,answer").eq("user_id",user.id).eq("ai_use_allowed",true).order("updated_at",{ascending:false}).limit(8),
   client.from("cp_ai_memories").select("category,body").eq("user_id",user.id).eq("use_for_ai",true).order("updated_at",{ascending:false}).limit(10),
   client.from("cp_ai_profile_cards").select("question_key,answer_code").eq("user_id",user.id).limit(9)
  ]);
  if(!membership.data)return Response.json({error:"Primero creá o aceptá un espacio privado."},{status:403});
  if([pref,reflections,memories,ownCards].some(x=>x.error))return Response.json({error:"No pude leer tus preferencias privadas para responderte de forma segura."},{status:503});
  const {data:surprise}=await client.rpc("cp_partner_surprise",{p_space:membership.data.space_id});
  const {data:partnerChoices,error:partnerError}=process.env.CP_PROFILE_INTERNAL_KEY?await client.rpc("cp_partner_profile",{p_space:membership.data.space_id,p_internal_secret:process.env.CP_PROFILE_INTERNAL_KEY}):{data:{},error:null};
  if(partnerError)return Response.json({error:"No pude consultar las pistas autorizadas de tu pareja."},{status:503});
  const ownProfile=profileForOwnAI(ownCards.data||[]);
  const approvedPartnerProfile=safeProfile(partnerChoices);
  const personalized=partnerGuidedIdeas(approvedPartnerProfile);
  const hint=(surprise?.title||"Un gesto cariñoso")+": "+(surprise?.body||"");
  const {data:slot,error:rateError}=await client.rpc("cp_claim_ai_slot");
  if(rateError)return Response.json({error:"No pude comprobar el límite de uso. Volvé a intentar."},{status:503});
  if(!slot)return Response.json({error:"Alcanzaste el límite de 12 consultas por hora para esta versión de prueba."},{status:429});
  const key=process.env.OPENAI_API_KEY;
  if(!key){
   const lower=message.toLowerCase(),isNoSpend=/gratis|sin gastar|sin dinero|econ[oó]mic|presupuesto/.test(lower);
   const tailor=isNoSpend?partnerGuidedIdeas({...approvedPartnerProfile,presupuesto:"gratis"}):personalized;
   const idea=/jueg|pregunta|divertir/.test(lower)?tailor.game:/seman|cita|fin de semana|plan especial/.test(lower)?tailor.ideas[2]:/caminar|cocin|tiempo|pel[ií]cul|salir|actividad/.test(lower)?tailor.ideas[1]:tailor.ideas[0];
   const source=tailor.hasSignals?"Tomé en cuenta preferencias que tu pareja decidió habilitar.":"Todavía no tengo pistas específicas autorizadas de tu pareja; esta es una idea general.";
   const reply=source+" "+idea.title+": "+idea.body+" Si querés, contame si buscás una sorpresa sin gastar, una cita, una pregunta o un plan de fin de semana.";
   return Response.json({mode:"guiado",reply,personalized:tailor.hasSignals});
  }
  const system=[
   "Sos Cómplice, una IA de sugerencias románticas para adultos. Hablás en español argentino cálido, claro, breve y práctico (máximo 115 palabras).",
   "Tu misión es ayudar a cuidar la relación con gestos consentidos, juegos, conversaciones y sorpresas. No sos terapeuta ni reemplazás comunicación interpersonal.",
   "No manipules, no prometas leer pensamientos, no sugieras vigilar o invadir privacidad, ni divulgues datos o confesiones privadas de la otra persona. Solo convertí las preferencias estructuradas autorizadas en planes concretos y realizables sin enumerarlas como una ficha personal.",
   "Todas las recomendaciones deben ser voluntarias; no imponer contacto físico ni presionar sexualmente.",
   "Esta persona se identifica en la app como "+membership.data.display_name+".",
   "Preferencias propias de esta persona: "+JSON.stringify(pref.data||{}),
   "Su mapa personal de gustos (es suyo, NO es el mapa de la pareja): "+JSON.stringify(ownProfile),
   "Sugerencia segura y autorizada para la pareja: "+hint,
   "Preferencias estructuradas que la OTRA persona autorizó exclusivamente para generar sugerencias (no enumerarlas, ni revelar la fuente, ni mencionar datos privados): "+JSON.stringify(approvedPartnerProfile),
   "Ideas del motor que respetan los límites autorizados: "+personalized.ideas.map(x=>x.title+": "+x.body).join(" | ").slice(0,780),
   "Respuestas privadas autorizadas por esta persona para que su IA las use: "+(reflections.data||[]).map(n=>n.question+": "+n.answer.slice(0,300)).join(" | ").slice(0,1500),
   "Recuerdos de esta misma persona que eligió guardar para uso de la IA (NO compartir con la pareja): "+(memories.data||[]).map(n=>n.category+": "+String(n.body).slice(0,240)).join(" | ").slice(0,1200)
  ].join("\n");
  const upstream=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4.1-mini",instructions:system,input:message,max_output_tokens:240,store:false}),cache:"no-store",signal:AbortSignal.timeout(15000)});
  if(!upstream.ok)return Response.json({error:"El servicio de IA no está disponible ahora. Intentá más tarde."},{status:503});
  const result=await upstream.json();
  const reply=(result.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\n")||"No pude preparar una sugerencia por ahora.";
  return Response.json({mode:"ia",reply});
 }catch(e){return Response.json({error:"No se pudo procesar el mensaje."},{status:500})}
}
