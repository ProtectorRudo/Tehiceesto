// Cómplices: personalización efímera solo con pistas VOLUNTARIAS de cuidado.
// Nunca lee el estado de ánimo, las reflexiones privadas ni mensajes de la pareja.
// No persiste la pista ni modifica las misiones semanales ya registradas.
import {safeProfile} from "./ai-profile.mjs";

export const CARE_NEEDS=Object.freeze(["abrazo","escucha","descanso","detalle","espacio"]);
const VALID=new Set(CARE_NEEDS);
const LOCAL_TZ="America/Argentina/Buenos_Aires";

export function localDay(date=new Date()){
 return new Intl.DateTimeFormat("en-CA",{timeZone:LOCAL_TZ,year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
}
export function selectAuthorizedCareHint(rows,{today,recipientId,memberIds=[]}={}){
 if(!recipientId||!/^\d{4}-\d{2}-\d{2}$/.test(String(today||"")))return null;
 const members=new Set(memberIds.filter(x=>x!==recipientId));
 const matches=(Array.isArray(rows)?rows:[]).filter(row=>
  row&&row.user_id!==recipientId&&members.has(row.user_id)&&
  row.day===today&&VALID.has(row.care_need));
 // Una pareja tiene dos usuarios; no tomamos una necesidad si el origen es ambiguo.
 return matches.length===1?{user_id:matches[0].user_id,day:today,care_need:matches[0].care_need}:null;
}

const CARE_PLANS={
 descanso:[
  {theme:"detalles",title:"Un pequeño peso menos",body:"Ofrecete a encargarte de una tarea concreta que puedan dejar resuelta hoy. Preguntale qué le resultaría útil y hacelo sin esperar agradecimientos.",affect:"ayuda"},
  {theme:"charla",title:"Un rato sin exigencias",body:"Dejale elegir si prefiere compañía o tranquilidad. Si quiere compartir un momento, prepará un espacio cómodo y escuchá sin pedirle que organice nada.",affect:"tiempo"},
  {theme:"cocina",title:"Algo rico, sin trabajo extra",body:"Prepará una merienda sencilla con lo que tengan en casa. Ofrecésela y encargate de ordenar después, para que no tenga que hacer nada más.",detail:"comida"}
 ],
 escucha:[
  {theme:"charla",title:"Escuchar de verdad",body:"Elegí un momento sin pantallas, preguntale si le gustaría conversar y escuchá sin interrumpir ni intentar solucionar todo. Agradecele la confianza.",affect:"tiempo"},
  {theme:"detalles",title:"Que sus palabras importen",body:"Preguntale si quiere contarte algo de su día. Prestá atención a lo que elija compartir y después recordá una cosa concreta que valorás de su forma de ser.",affect:"palabras"},
  {theme:"planes",title:"Una pausa para conversar",body:"Prepará un rincón tranquilo y ofrecé unos minutos de conversación sin apuro. Si prefiere no hablar, respetá su decisión y quedate disponible.",plan:"charlar"}
 ],
 abrazo:[
  {theme:"detalles",title:"Cariño con permiso",body:"Acercate con ternura y preguntale si hoy le gustaría recibir un abrazo. Si dice que sí, disfrutalo sin apuro; si no, elegí otra forma de acompañar.",affect:"contacto"},
  {theme:"charla",title:"Estar cerca también es escuchar",body:"Preguntale si prefiere un abrazo, unas palabras lindas o compañía tranquila. Elegí el gesto que le resulte cómodo, sin insistir si quiere espacio.",affect:"palabras"},
  {theme:"planes",title:"Un refugio de cinco minutos",body:"Prepará un rincón cómodo y ofrecé compartir unos minutos. Cualquier abrazo o contacto físico debe ser deseado por los dos.",plan:"descanso"}
 ],
 detalle:[
  {theme:"detalles",title:"Una sorpresa que demuestra atención",body:"Elegí algo pequeño que ya sepas que disfruta, preparalo con cariño y acompañalo con una frase concreta sobre algo que admirás. No esperes una reacción especial.",affect:"detalles"},
  {theme:"humor",title:"Una sonrisa inesperada",body:"Prepará un detalle juguetón con algo que ya tengan en casa. Ofrecéselo con humor, sin bromas pesadas ni poner a tu pareja en evidencia.",plan:"jugar"},
  {theme:"charla",title:"Que se note que prestaste atención",body:"Recuperá una idea o plan agradable que los dos hayan mencionado y proponé un primer paso muy pequeño para hacerlo realidad, sin presionar.",plan:"charlar"}
 ],
 espacio:[
  {theme:"detalles",title:"Cuidar también es respetar el espacio",body:"Preguntale si le serviría que te ocupes de alguna tarea cotidiana. Respetá si prefiere un rato a solas y hacéle saber que estás disponible, sin insistir.",affect:"ayuda"},
  {theme:"charla",title:"Presencia sin preguntas",body:"Ofrecé ayuda con algo concreto y dejale elegir si quiere compañía o un momento para sí. No pidas explicaciones ni una respuesta inmediata.",affect:"tiempo"},
  {theme:"planes",title:"Un gesto sin interrumpir",body:"Encargate discretamente de una pequeña responsabilidad compartida. Avisale con sencillez y permitile disfrutar su tiempo sin esperar conversación.",plan:"descanso"}
 ]
};

const TREATS={
 mate:"Si le gusta el mate y tienen ganas, podés dejar el mate listo como detalle opcional.",
 cafe:"Si disfruta el café, podés prepararle uno como detalle opcional.",
 chocolate:"Si ya tienen chocolate en casa, podés sumarlo como detalle opcional.",
 flores:"Si ya tienen flores o plantas en casa, podés cuidar una como detalle opcional.",
 nota:"Si disfruta las notas, podés sumar unas palabras propias.",
 comida:"Si le gusta compartir comida, podés preparar algo sencillo con lo que haya."
};

export function buildContextualCareIdea({hint,partnerProfile={},feedback=[],recentThemes=[]}={}){
 if(!hint||!VALID.has(hint.care_need))return null;
 const p=safeProfile(partnerProfile),options=CARE_PLANS[hint.care_need];
 if(!options)return null;
 const rated=Array.isArray(feedback)?feedback.filter(f=>f&&typeof f==="object"):[];
 const recent=new Set((Array.isArray(recentThemes)?recentThemes:[]).slice(0,8));
 const ranked=options.map((option,i)=>{
  const reactions=rated.filter(f=>f.theme===option.theme);
  const score=(option.affect&&p.afecto===option.affect?4:0)
   +(option.plan&&p.plan===option.plan?3:0)
   +(option.detail&&p.detalle===option.detail?3:0)
   +(reactions.some(f=>f.rating===1)?2:0)
   -(reactions.some(f=>f.rating===-1)?5:0)
   -(recent.has(option.theme)?1:0)-i*.01;
  return {option,score};
 }).sort((a,b)=>b.score-a.score);
 const chosen=ranked[0].option;
 const mayOfferTreat=hint.care_need==="detalle"||hint.care_need==="descanso";
 const treat=mayOfferTreat&&!["gratis"].includes(p.presupuesto)&&p.evitar!=="gastos"&&p.detalle&&TREATS[p.detalle];
 // Una pista compartida puede modular qué hacer, nunca revelar el ánimo ni crear una obligación.
 return {
  title:chosen.title,
  body:chosen.body+(treat?" "+treat:""),
  theme:chosen.theme,
  kind:"care_suggestion",
  day:hint.day,
  source_user_id:hint.user_id,
  source_code:hint.care_need
 };
}

// Se utiliza la señal actual para PRIORIZAR una misión ya pendiente, no para
// reescribir tareas completadas o compartir información privada.
export function pickCareAwareMission({todayTasks=[],pendingTasks=[],weeklyTasks=[],isDone=()=>false,careNeed=null,feedback=[]}={}){
 const options=[todayTasks,pendingTasks,weeklyTasks];
 const preferred=({
  descanso:["detalles","cocina","charla"],
  escucha:["charla","detalles","planes"],
  abrazo:["detalles","charla","planes"],
  detalle:["detalles","humor","charla"],
  espacio:["detalles","planes","charla"]
 })[careNeed];
 for(const group of options){
  const remaining=group.filter(t=>t?.key&&!isDone(t.key));
  if(!remaining.length)continue;
  if(!preferred)return remaining[0];
  const sorted=remaining.map((task,i)=>{
   const ratings=(Array.isArray(feedback)?feedback:[]).filter(r=>r.theme===task.theme);
   return {task,score:(preferred.includes(task.theme)?5-preferred.indexOf(task.theme):0)
    +(ratings.some(r=>r.rating===1)?1:0)-(ratings.some(r=>r.rating===-1)?2:0)-i*.001};
  }).sort((a,b)=>b.score-a.score);
  return sorted[0].task;
 }
 return null;
}
