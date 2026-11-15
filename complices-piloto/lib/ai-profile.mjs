// Tarjetas deliberadamente estructuradas: ni texto libre ni confesiones se comparten.
export const PROFILE_QUESTIONS=[
 {key:"afecto",question:"¿Qué gesto te hace sentir más querido/a?",emoji:"💗",options:[["palabras","Que me digan cosas lindas"],["tiempo","Compartir tiempo de calidad"],["detalles","Pequeños detalles"],["ayuda","Que me ayuden con algo"],["contacto","Abrazos o mimos cuando ambos queremos"]]},
 {key:"detalle",question:"¿Qué pequeño detalle te alegra un día común?",emoji:"🎁",options:[["chocolate","Algo con chocolate"],["flores","Flores o plantas"],["cafe","Un café"],["mate","Compartir un mate"],["nota","Una nota cariñosa"],["comida","Algo rico para comer"],["sin_regalos","Prefiero gestos sin regalos"]]},
 {key:"plan",question:"¿Cuál de estos planes disfrutarías más?",emoji:"✨",options:[["paseo","Dar una vuelta"],["cocinar","Cocinar juntos"],["pelicula","Película o serie"],["charlar","Conversar tranquilos"],["jugar","Jugar o reírnos"],["salida","Una salida especial"],["descanso","Un descanso juntos"]]},
 {key:"ritmo",question:"¿Con qué energía te sentís más cómodo/a?",emoji:"🌿",options:[["tranquilo","Planes tranquilos"],["moderado","Un equilibrio"],["activo","Planes activos"]]},
 {key:"presupuesto",question:"¿Qué presupuesto preferís para las sorpresas?",emoji:"🪙",options:[["gratis","Sin gastar dinero"],["economico","Algo económico"],["flexible","Depende de la ocasión"]]},
 {key:"momento",question:"¿Cuándo te resulta más cómodo tener tiempo en pareja?",emoji:"☀️",options:[["manana","Por la mañana"],["tarde","Por la tarde"],["noche","Por la noche"],["fin_semana","El fin de semana"],["cualquiera","No tengo un momento fijo"]]},
 {key:"charla",question:"¿De qué te gusta conversar juntos?",emoji:"💬",options:[["risas","Historias y cosas divertidas"],["planes","Lo que nos gustaría hacer"],["recuerdos","Momentos que vivimos"],["profundo","Lo que sentimos y pensamos"],["curiosidades","Preguntas inesperadas"]]},
 {key:"evitar",question:"¿Qué preferís evitar en una sorpresa?",emoji:"🫶",options:[["sorpresas_publicas","Gestos delante de otras personas"],["contacto_sin_avisar","Contacto físico sin preguntarme"],["gastos","Regalos que impliquen gastar"],["salidas_largas","Planes largos fuera de casa"],["actividades_intimas","Propuestas íntimas"],["ninguno","Ninguna de estas opciones"]]},
 {key:"objetivo",question:"¿Qué les vendría mejor disfrutar juntos?",emoji:"🌸",options:[["diversion","Más diversión"],["romance","Más gestos románticos"],["conversacion","Conversar con calma"],["equipo","Hacer más cosas en equipo"],["sorpresas","Sorpresas pequeñas"],["rutina","Salir un poco de la rutina"]]}
];
const VALID=new Map(PROFILE_QUESTIONS.map(q=>[q.key,new Set(q.options.map(x=>x[0]))]));
export function safeProfile(source){
 if(!source||typeof source!=="object"||Array.isArray(source))return {};
 return Object.fromEntries(Object.entries(source).filter(([k,v])=>VALID.get(k)?.has(v)));
}
export function profileProgress(rows=[]){
 const answered=new Set(rows.filter(r=>VALID.get(r.question_key)?.has(r.answer_code)).map(r=>r.question_key));
 return {answered:answered.size,total:PROFILE_QUESTIONS.length,remaining:PROFILE_QUESTIONS.filter(q=>!answered.has(q.key))};
}
const THEME_OF={paseo:"paseo",cocinar:"cocina",pelicula:"pelicula",charlar:"charla",jugar:"humor",salida:"planes",descanso:"detalles"};
const ICON_OF={detalles:"💝",paseo:"🌿",cocina:"🍓",pelicula:"🎬",charla:"💬",humor:"🎲",planes:"✨",recuerdos:"📸"};
const cleanSpace=s=>String(s||"").replace(/\s+/g," ").trim();
function clockText(p){return {manana:"Por la mañana",tarde:"Por la tarde",noche:"Esta noche",fin_semana:"El fin de semana",cualquiera:"Cuando tengan un rato"}[p.momento]||"Cuando tengan un rato"}
function offer(p){
 const noSpend=p.presupuesto==="gratis"||p.evitar==="gastos";
 if(noSpend)return {title:"Un detalle que no cuesta nada",body:"Escribí tres cosas concretas que admirás de tu pareja y dejale la nota en privado, donde pueda encontrarla con tranquilidad."};
 const map={
  chocolate:["Un dulce detalle","Si podés, elegí un chocolate para compartir y acompañalo con un mensaje que explique por qué te acordaste de esa persona."],
  flores:["Un detalle con color","Si entra en tu presupuesto, llevá una flor o una plantita sencilla y sumale una nota sobre un recuerdo lindo."],
  cafe:["Un café con intención","Prepará o compartí un café y aprovechá ese ratito para preguntarle cómo estuvo su día."],
  mate:["Un mate para dos","Prepará el mate, elegí un lugar cómodo y proponé unos minutos de charla sin distracciones."],
  comida:["Un gusto para compartir","Elegí algo rico y sencillo que puedan comer juntos, sin que implique un gasto importante."],
  nota:["Una nota inesperada","Dejale una nota breve con una frase personal y sincera, sin esperar una respuesta inmediata."],
  sin_regalos:["Un gesto sin envoltorio","Ofrecé ayuda con algo concreto o regalale un ratito de atención sin pantallas."]
 };
 const v=map[p.detalle]||["Una sorpresa sencilla","Elegí un gesto pequeño de cariño que no invada su espacio y disfrutá hacerlo sin esperar nada a cambio."];
 return {title:v[0],body:v[1]};
}
function shareTime(p){
 const quiet=p.ritmo==="tranquilo"||p.evitar==="salidas_largas";
 const map={
  paseo:["Una vuelta juntos",quiet?"Proponele un paseo corto y tranquilo cerca de casa.":"Proponele explorar un lugar cercano que todavía no hayan visitado juntos."],
  cocinar:["Una receta en equipo","Elegí una receta fácil con ingredientes que ya tengan y propongan prepararla juntos, repartiéndose las tareas."],
  pelicula:["Cine para los dos","Prepará un rincón cómodo, propongan dos películas y elijan juntos cuál mirar, sin celulares."],
  charlar:["Un ratito para escucharse","Invitá a tu pareja a conversar sin pantallas. Preguntale qué momento reciente le hizo bien y compartí también el tuyo."],
  jugar:["Un juego para reírse","Inventen un desafío divertido de cinco minutos, sin puntajes ni competencia. Lo importante es pasarla bien."],
  salida:["Una cita a su medida",quiet?"Organizá una cita corta y tranquila, con tiempo para volver cuando quieran.":"Proponé una salida simple y elegí juntos dónde ir."],
  descanso:["Pausa compartida","Busquen un rato para descansar juntos, con algo de tomar y sin obligaciones. Que cada uno elija cómo acompañar al otro."]
 };
 const v=map[p.plan]||["Un rato que vale","Proponele diez minutos de tiempo de calidad, escuchándose sin interrupciones."];
 return {title:v[0],body:v[1]};
}
function week(p){
 const map={
  equipo:["Somos un equipo","Elijan una tarea que esté pesando esta semana y háganla juntos, a su ritmo. Después celebren el pequeño avance."],
  romance:["Nuestra cita simple","Organizá un momento romántico cómodo para ambos, sin necesidad de gastar. La idea es prestar atención a los detalles."],
  conversacion:["Una conversación que queda","Reservá un momento tranquilo para hablar de tres cosas que les gustaría disfrutar juntos en los próximos meses."],
  diversion:["Una hora de risas","Inventen una mini aventura o juego sencillo para compartir durante la semana, sin competir."],
  sorpresas:["Semana de pequeños gestos","Elegí dos sorpresas discretas y agradables para esta semana. Preguntá si el plan es cómodo antes de organizar algo grande."],
  rutina:["Algo nuevo, chiquito","Cambien un hábito pequeño de la semana: una caminata distinta, una comida nueva o una conversación en otro lugar."]
 };
 const v=map[p.objetivo]||["Una cita a su manera","Reserven un momento durante la semana para hacer juntos algo distinto a lo habitual."];
 return {title:v[0],body:v[1]};
}
const QUESTIONS={
 risas:"¿Cuál fue el momento más divertido que compartimos este año?",
 planes:"¿Qué plan pequeño nos gustaría hacer durante el próximo mes?",
 recuerdos:"¿Cuál es un recuerdo nuestro que todavía te hace sonreír?",
 profundo:"¿Qué gesto nuestro te hace sentir acompañado/a?",
 curiosidades:"Si tuviéramos una tarde libre sin planear nada, ¿qué haríamos primero?"
};
export function partnerGuidedIdeas(raw,opts={}){
 const p=safeProfile(raw),hasSignals=Object.keys(p).length>0;
 const scope=opts.scope||"daily";
 const time=clockText(p);
 const a=offer(p),b=shareTime(p),c=week(p);
 if(p.evitar==="sorpresas_publicas"){a.body+=" Hacelo de forma privada, sin exposición frente a otras personas."}
 if(p.evitar==="contacto_sin_avisar"||p.afecto==="contacto"){b.body+=" Cualquier abrazo o contacto físico debe ser bienvenido por los dos; preguntá primero."}
 if(p.evitar==="actividades_intimas"){c.body+=" Evitá proponer actividades íntimas."}
 if(p.presupuesto==="gratis"||p.evitar==="gastos"){
  b.body=b.body.replace(/elegí juntos dónde ir/i,"elijan juntos un lugar gratuito");
  c.body=c.body.replace(/sin necesidad de gastar/i,"sin gastar dinero");
 }
 const greeting=time+".";
 const models=[
  {...a,theme:"detalles",icon:"💝",why:hasSignals?"Idea basada en las preferencias que tu pareja autorizó":"Sugerencia general hasta que ambos completen sus gustos"},
  {...b,theme:THEME_OF[p.plan]||"charla",icon:ICON_OF[THEME_OF[p.plan]||"charla"],why:hasSignals?"Plan adaptado a sus preferencias compartibles":"Sugerencia para crear tiempo de calidad"},
  {...c,theme:THEME_OF[p.plan]||"planes",icon:"✨",why:hasSignals?"Propuesta alineada con prioridades autorizadas":"Una idea flexible para esta semana"}
 ];
 if(p.momento)models[1].body=greeting+" "+models[1].body;
 const question=QUESTIONS[p.charla]||"¿Qué plan pequeño nos gustaría probar juntos esta semana?";
 const game={title:"Una pregunta para los dos",body:question,theme:"charla",icon:"💬",why:hasSignals?"Pregunta adaptada al tema compartible":"Pregunta general de conexión"};
 return {hasSignals,count:Object.keys(p).length,ideas:models.map(x=>({...x,title:cleanSpace(x.title).slice(0,110),body:cleanSpace(x.body).slice(0,420)})),game};
}
export function profileForOwnAI(rows=[]){
 const source={};
 for(const r of rows){if(VALID.get(r.question_key)?.has(r.answer_code))source[r.question_key]=r.answer_code}
 return source;
}
