// Aprendizaje continuo después del cuestionario inicial.
// Una pregunta profunda, personal y optativa por semana, con una pista estructurada
// que el usuario puede actualizar; sus palabras NUNCA se envían a su pareja.
import {PROFILE_QUESTIONS,safeProfile} from "./ai-profile.mjs";
import {mondayOf,weekNumber} from "./mission-schedule.mjs";
const QUESTION_BY_TOPIC={
 afecto:[
  "Pensando en esta semana, ¿qué gesto concreto te haría sentir más acompañado/a en un momento cotidiano?",
  "¿Qué forma de cariño te resultó más significativa últimamente, y qué hizo que fuera especial?"
 ],
 detalle:[
  "¿Qué detalle relacionado con tus gustos te haría pensar que tu pareja realmente prestó atención?",
  "¿Qué cosa sencilla te alegraría recibir o compartir esta semana, y por qué tendría valor para vos?"
 ],
 plan:[
  "Si tu pareja preparara un plan para ustedes esta semana, ¿qué te daría más ganas de aceptar y qué lo haría especial?",
  "¿Qué experiencia de menos de una hora te gustaría vivir juntos en estos días sin sentir que es una obligación?"
 ],
 ritmo:[
  "¿En qué momentos tu energía y la de tu pareja coinciden mejor para disfrutar algo juntos?",
  "¿Qué tipo de actividad te ayuda a sentirte conectado/a cuando tuviste una semana intensa?"
 ],
 presupuesto:[
  "¿Qué hace que una sorpresa valga la pena para vos, más allá de cuánto dinero se gaste?",
  "¿Cómo preferís que tu pareja piense el presupuesto de un plan para que ambos puedan disfrutarlo sin presión?"
 ],
 momento:[
  "¿En qué ratito real de esta semana sentiste más disponibilidad para conectar con tu pareja?",
  "¿Qué momento del día sería más cómodo para una sorpresa espontánea sin interrumpir tus obligaciones?"
 ],
 charla:[
  "¿Qué conversación te quedó pendiente esta semana porque no encontraron un momento tranquilo?",
  "¿Sobre qué asunto te gustaría poder hablar con tu pareja sin apuros, y qué ambiente ayudaría?"
 ],
 evitar:[
  "¿Qué tipo de sorpresa podría resultarte incómoda aunque haya sido preparada con cariño?",
  "¿Qué límites o preferencias te gustaría que tu pareja respetara siempre al organizar un plan?"
 ],
 objetivo:[
  "¿Qué aspecto de su relación te gustaría cuidar especialmente durante el próximo mes?",
  "¿Qué experiencia nueva o costumbre compartida sentís que fortalecería su complicidad ahora?"
 ],
 deseo:[
  "¿Qué gesto te haría sentir elegido/a sin necesidad de que tengas que pedirlo explícitamente?",
  "¿Qué te gustaría sentir más seguido cuando están juntos, y qué momento reciente te hizo pensar en eso?"
 ]
};
const TOPICS=PROFILE_QUESTIONS.map(q=>q.key);
function hash(v){let h=2166136261;for(const c of String(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export function learningFallback({userId,week,cards=[]}){
 const w=mondayOf(week),index=weekNumber(w),already=safeProfile(Object.fromEntries((cards||[]).map(r=>[r.question_key,r.answer_code])));
 const start=(hash(userId)%TOPICS.length+((index%TOPICS.length)+TOPICS.length)%TOPICS.length)%TOPICS.length;
 const rotated=Array.from({length:TOPICS.length},(_,i)=>TOPICS[(start+i)%TOPICS.length]);
 const topic=rotated.find(x=>!Object.hasOwn(already,x))||rotated[0];
 const variant=Math.abs(Math.floor(index/TOPICS.length))%2;
 return {id:"learn:"+w,week_start:w,topic_key:topic,question:QUESTION_BY_TOPIC[topic][variant],source:"guiado"};
}
export function validLearningQuestion(question,topic){
 const q=String(question||"").trim();
 if(!TOPICS.includes(topic)||q.length<35||q.length>250||!q.includes("?"))return false;
 if(/contraseñ|password|trauma|confesión secreta|detalles sexuales|obligatori|publicá|cambiá tu foto de perfil|médic|diagnóstic/i.test(q))return false;
 return true;
}
export function learningOptions(topic){return PROFILE_QUESTIONS.find(q=>q.key===topic)?.options||[]}
export function learningStatus({week,reflections=[]}){
 const id="learn:"+mondayOf(week);
 const row=(reflections||[]).find(x=>x.question_id===id);
 const answered=(reflections||[]).filter(x=>String(x.question_id||"").startsWith("learn:")).length;
 return {id,answeredThisWeek:Boolean(row),ongoingAnswers:answered};
}
