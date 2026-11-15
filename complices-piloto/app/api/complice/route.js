
import {createClient} from "@supabase/supabase-js";
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
  const [pref,membership,reflections]=await Promise.all([
   client.from("cp_preferences").select("favorite_treat,favorite_plan,love_language").eq("user_id",user.id).maybeSingle(),
   client.from("cp_members").select("space_id,display_name").eq("user_id",user.id).maybeSingle(),
   client.from("cp_reflections").select("question,answer").eq("user_id",user.id).eq("ai_use_allowed",true).order("updated_at",{ascending:false}).limit(8)
  ]);
  if(!membership.data)return Response.json({error:"Primero creá o aceptá un espacio privado."},{status:403});
  const {data:surprise}=await client.rpc("cp_partner_surprise",{p_space:membership.data.space_id});
  const hint=(surprise?.title||"Un gesto cariñoso")+": "+(surprise?.body||"");
  const {data:slot,error:rateError}=await client.rpc("cp_claim_ai_slot");
  if(rateError)return Response.json({error:"No pude comprobar el límite de uso. Volvé a intentar."},{status:503});
  if(!slot)return Response.json({error:"Alcanzaste el límite de 12 consultas por hora para esta versión de prueba."},{status:429});
  const key=process.env.OPENAI_API_KEY;
  if(!key){
   const lower=message.toLowerCase();
   let reply;
   if(/gast|dinero|gratis|econ[oó]mic|presupuesto/.test(lower))reply="Una idea sin gastar: prepará una nota con tres cosas que admirás de tu pareja y dejala donde la encuentre. Otra opción es organizar quince minutos de charla sin celulares. La intención importa más que el precio.";
   else if(/pregunta|convers|hablar/.test(lower))reply="Probá preguntarle: «¿Qué gesto pequeño de esta semana te hizo sentir querido/a?». Escuchá sin interrumpir y después respondé vos también.";
   else if(/cita|salida|plan|fin de semana/.test(lower))reply="Podrían preparar una cita sencilla, con algo rico, una canción que les recuerde un momento lindo y una pregunta diferente para conversar. Elegí un lugar y una hora que a ambos les quede cómodo.";
   else if(/picante|intim|sexo/.test(lower))reply="Si ambos son adultos y están cómodos, pueden conversar sobre qué ambientes, detalles o momentos románticos disfrutan. Lo importante es que el juego sea voluntario y sin presiones.";
   else reply="Se me ocurre esto para sorprender hoy: "+hint+" Si preferís, contame si buscás algo sin gastar, una cita, un juego o una conversación y lo enfocamos mejor.";
   return Response.json({mode:"guiado",reply});
  }
  const system=[
   "Sos Cómplice, una IA de sugerencias románticas para adultos. Hablás en español argentino cálido, claro, breve y práctico (máximo 115 palabras).",
   "Tu misión es ayudar a cuidar la relación con gestos consentidos, juegos, conversaciones y sorpresas. No sos terapeuta ni reemplazás comunicación interpersonal.",
   "No manipules, no prometas leer pensamientos, no sugieras vigilar o invadir privacidad, ni divulgues datos o confesiones privadas de la otra persona.",
   "Todas las recomendaciones deben ser voluntarias; no imponer contacto físico ni presionar sexualmente.",
   "Esta persona se identifica en la app como "+membership.data.display_name+".",
   "Preferencias propias de esta persona: "+JSON.stringify(pref.data||{}),
   "Sugerencia segura y autorizada para la pareja: "+hint,
   "Respuestas privadas autorizadas por esta persona para que su IA las use: "+(reflections.data||[]).map(n=>n.question+": "+n.answer.slice(0,300)).join(" | ").slice(0,1500)
  ].join("\n");
  const upstream=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4.1-mini",instructions:system,input:message,max_output_tokens:240,store:false}),cache:"no-store",signal:AbortSignal.timeout(15000)});
  if(!upstream.ok)return Response.json({error:"El servicio de IA no está disponible ahora. Intentá más tarde."},{status:503});
  const result=await upstream.json();
  const reply=(result.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\n")||"No pude preparar una sugerencia por ahora.";
  return Response.json({mode:"ia",reply});
 }catch(e){return Response.json({error:"No se pudo procesar el mensaje."},{status:500})}
}
