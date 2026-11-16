import {mondayOf,dayOfWeek} from "./mission-schedule.mjs";

// Las preguntas descubren motivaciones útiles, no exigen revelar nada.
export const DEEP_QUESTIONS=[
 ["q09","Pensá en una ocasión en que te sentiste especialmente elegido/a por tu pareja. ¿Qué hizo distinto ese momento?"],
 ["q10","Después de un día agotador, ¿qué ayuda concreta te hace bien y qué preferís que eviten?"],
 ["q11","¿Qué detalle de tu rutina te gustaría que tu pareja comprendiera sin que tengas que explicarlo cada vez?"],
 ["q12","¿Qué recuerdo de ustedes te hace sentir orgulloso/a de lo que construyeron, y por qué?"],
 ["q13","¿Qué iniciativa inesperada de tu pareja te haría sentir que te tiene verdaderamente en cuenta?"],
 ["q14","¿Hay algún plan sencillo que te entusiasma pero que generalmente dejás para otro momento? ¿Cuál?"],
 ["q15","Cuando algo te preocupa, ¿preferís que te escuchen, te acompañen en silencio o que te ayuden con algo práctico?"],
 ["q16","¿Qué gesto pequeño pero personal te gustaría que se convierta en una costumbre de ustedes?"],
 ["q17","¿En qué momento de la semana suele ser más fácil disfrutar de tiempo en pareja, y qué interfiere normalmente?"],
 ["q18","¿Qué parte de tu personalidad sentís que tu pareja todavía podría descubrir mejor?"],
 ["q19","¿Qué gesto o sorpresa preferís que nunca se haga delante de otras personas?"],
 ["q20","¿Qué aspecto de la relación te gustaría celebrar más seguido, aunque no haya una fecha especial?"]
];
const WEEKLY_PROMPTS=[
 name=>"¿Qué gesto de "+name+" te hizo sentir acompañado/a esta semana, aunque haya sido muy pequeño?",
 name=>"¿Qué cualidad de "+name+" admiraste esta semana y quizás todavía no le dijiste?",
 name=>"¿Qué momento con "+name+" te gustaría guardar como recuerdo de estos días?",
 name=>"¿Qué hizo "+name+" que te haya aliviado o alegrado el día sin darse cuenta?",
 name=>"¿Qué plan sencillo con "+name+" te hubiera gustado compartir esta semana?",
 name=>"¿En qué ocasión te sentiste especialmente escuchado/a por "+name+" últimamente?",
 name=>"¿Qué costumbre de ustedes dos te hizo sonreír esta semana?",
 name=>"Si pudieras agradecerle a "+name+" una sola cosa de esta semana, ¿qué sería?"
];
function stableHash(s){let n=2166136261;for(const c of String(s||"")){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}return n>>>0}
export function weeklyPersonalQuestion({userId="",week,partnerName="tu pareja",missionDays=[]}){
 const monday=mondayOf(week),index=stableHash(userId+"|"+monday)%WEEKLY_PROMPTS.length;
 const freeDays=[1,2,3,4,5].filter(i=>!missionDays.includes(i));
 const offset=freeDays.length?freeDays[stableHash("day|"+userId+monday)%freeDays.length]:3;
 const name=String(partnerName||"tu pareja").replace(/[<>{}]/g,"").trim().slice(0,45)||"tu pareja";
 return {id:"pulse:"+monday,question:WEEKLY_PROMPTS[index](name),due:dayOfWeek(monday,offset),week:monday};
}
export function profileKnowledge({cards=[],reflections=[],importantDates=[],feedback=[],completions=[]}={}){
 const structured=new Set(cards.filter(x=>typeof x.answer_code==="string"&&x.answer_code.length>0).map(x=>x.question_key));
 const deep=new Set(reflections.filter(x=>x.ai_use_allowed===true&&/^q(?:0[9]|1\d|20)$/.test(x.question_id)).map(x=>x.question_id));
 const history=feedback.length+completions.length;
 // Es cobertura de señales autorizadas para la IA propia, no mide amor ni exactitud.
 const dimensions={preferences:Math.min(40,structured.size*4),depth:Math.min(32,deep.size*8),dates:Math.min(12,importantDates.length*6),experience:Math.min(16,history*4)};
 return {percent:Object.values(dimensions).reduce((sum,x)=>sum+x,0),dimensions,structured:structured.size,deep:deep.size,dates:importantDates.length,signals:history,meaning:"Cobertura aproximada de información autorizada, no precisión garantizada ni puntaje de relación."};
}
function validISO(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s||"")))return false;const d=new Date(s+"T12:00:00Z");return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s}
function dateForYear(monthDay,year){
 if(monthDay==="02-29"&&!(year%4===0&&(year%100!==0||year%400===0)))return year+"-02-28";
 return year+"-"+monthDay;
}
export function upcomingOccasions(rows=[],today,daysAhead=30){
 if(!validISO(today))return [];
 const base=Date.parse(today+"T12:00:00Z"),out=[];
 for(const r of rows||[]){
  if(!validISO(r.event_on))continue;
  let next=r.event_on;
  if(r.repeat_yearly){
   const md=next.slice(5),year=Number(today.slice(0,4));
   next=dateForYear(md,year);
   if(Date.parse(next+"T12:00:00Z")<base)next=dateForYear(md,year+1);
  }
  const days=Math.round((Date.parse(next+"T12:00:00Z")-base)/86400000);
  if(days<0||days>daysAhead)continue;
  out.push({id:r.id,kind:r.kind,label:r.label,event_on:r.event_on,repeat_yearly:r.repeat_yearly,days_until:days,next_on:next,shared:!!r.share_with_partner});
 }
 return out.sort((a,b)=>a.days_until-b.days_until||a.label.localeCompare(b.label)).slice(0,10);
}
export const DATE_TYPES=[
 ["aniversario","Nuestro aniversario"],
 ["primer_encuentro","El día que nos conocimos"],
 ["primer_beso","Nuestro primer beso"],
 ["compromiso","Un compromiso importante"],
 ["cumpleanos","Un cumpleaños"],
 ["tradicion","Una tradición nuestra"],
 ["otro","Otra fecha especial"]
];
