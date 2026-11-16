// Cómplices: mecanismos relacionales abstraídos de testimonios PÚBLICOS.
// NO contiene citas, identidades, historias literales ni datos privados.
// Los relatos son anecdóticos, no una garantía clínica de eficacia.
// Cada propuesta final DEBE ajustarse a gustos autorizados y tener pasos concretos.
import {safeProfile} from "./ai-profile.mjs";

export const TESTIMONY_LIBRARY_VERSION="testimony-patterns-20261116-v1";
export const PUBLIC_INSPIRATION=Object.freeze([
 {
  id:"alivio_concreto",
  mechanism:"Alguien se sintió cuidado cuando su pareja se encargó de una responsabilidad real sin delegarle la organización.",
  action:"Elegí una responsabilidad concreta que compartan y resolvé vos una parte de principio a fin. Si no hay una tarea común, ofrecé ayuda específica sin imponerla.",
  care:"aliviar una carga cotidiana, sin esperar devolución",
  matches:{afecto:["ayuda"],deseo:["iniciativa","seguridad"],objetivo:["equipo"]},
  source:"https://www.reddit.com/r/Marriage/comments/1fu73v5/"
 },
 {
  id:"preferencia_recordada",
  mechanism:"Sentirse conocido al notar que la pareja recuerda preferencias pequeñas y detalles que la persona eligió compartir.",
  action:"Si está autorizado un gusto concreto (mate, café, comida, película), prepará una versión sencilla de ese detalle. Si no, pedí su preferencia antes de elegir; no la inventes.",
  care:"hacer visible la atención a gustos reales",
  matches:{detalle:["mate","cafe","chocolate","comida","flores"],deseo:["prioridad","reconocimiento"],afecto:["detalles"]},
  source:"https://www.reddit.com/r/Marriage/comments/gcv9r7"
 },
 {
  id:"reconocimiento_especifico",
  mechanism:"Un agradecimiento por una contribución REAL y precisa puede hacer sentir que el esfuerzo fue visto.",
  action:"Recordá algo verdadero que tu pareja haya hecho y describí la acción y por qué la valoraste. Decíselo en privado, sin pedir reacción.",
  care:"reconocimiento específico, sin elogio genérico",
  matches:{afecto:["palabras"],deseo:["reconocimiento","prioridad"],objetivo:["romance"]},
  source:"https://www.reddit.com/r/Marriage/comments/14jq9x7"
 },
 {
  id:"tiempo_preparado",
  mechanism:"Se valora cuando una persona se encarga de planear y preparar un rato compartido, teniendo en cuenta la disponibilidad y los gustos del otro.",
  action:"Elegí una actividad concreta de las preferencias autorizadas (película, paseo breve, cocinar o un juego disponible en Cómplices). Prepará lo necesario y ofrecé compartirla sin presión.",
  care:"iniciativa sin trasladar la logística a la pareja",
  matches:{plan:["pelicula","jugar","cocinar","paseo","salida"],deseo:["iniciativa","complicidad"],objetivo:["diversion","rutina"]},
  source:"https://www.reddit.com/r/Marriage/comments/1dzujeo"
 },
 {
  id:"escucha_presente",
  mechanism:"Los momentos breves de escucha y respuesta atenta a una invitación de conexión pueden fortalecer la cercanía.",
  action:"Ofrecé diez minutos sin pantallas; preguntá si quiere conversar sobre algo elegido por ella o él. Escuchá sin corregir ni intentar arreglarlo todo.",
  care:"presencia atenta, dejando elegir si conversar",
  matches:{afecto:["tiempo"],deseo:["escucha","seguridad"],plan:["charlar","descanso"],objetivo:["conversacion"]},
  source:"https://www.gottman.com/blog/small-actions-make-big-impacts/"
 },
 {
  id:"detalle_cotidiano",
  mechanism:"Detalles simples como una bebida preparada a gusto o una ayuda pequeña pueden funcionar mejor que un gran espectáculo.",
  action:"Hacé un gesto pequeño y concreto basado en lo que tu pareja expresó que le gusta. No supongas contacto físico, compras ni exposición pública.",
  care:"atención cotidiana voluntaria",
  matches:{detalle:["mate","cafe","nota","sin_regalos"],afecto:["detalles","ayuda"],objetivo:["sorpresas"]},
  source:"https://www.reddit.com/r/AskWomen/comments/i92ij9"
 }
]);

export function selectInspiration({partnerProfile={},slot="mission_1",recentIds=[]}={}){
 const p=safeProfile(partnerProfile),recent=new Set(recentIds);
 const scored=PUBLIC_INSPIRATION.map((pattern,index)=>{
  let score=0;
  for(const [key,values] of Object.entries(pattern.matches)){
   if(p[key]&&values.includes(p[key]))score+=key==="afecto"||key==="plan"?4:3;
  }
  if(recent.has(pattern.id))score-=10;
  // Neutral tie-breaker: alternar mecanismo según día, sin requerir datos privados.
  score-=(slot==="weekly_1"?Math.abs(index-3):index)*.01;
  return {pattern,score};
 }).sort((a,b)=>b.score-a.score);
 return scored.slice(0,4).map(({pattern})=>({
  id:pattern.id,mechanism:pattern.mechanism,action:pattern.action,care:pattern.care
 }));
}
