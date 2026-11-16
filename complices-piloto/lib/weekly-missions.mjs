// Generación de una única agenda semanal por integrante, sin obligación ni tareas diarias.
// Respeta exclusivamente permisos de gustos estructurados del destinatario.
import {deriveThemes} from "./central-content.mjs";
import {meaningfulPartnerPlan} from "./meaningful-partner.mjs";
import {MEANINGFUL_PLAYBOOK} from "./meaningful-playbook.mjs";
import {scheduleFor,dayOfWeek,MISSION_SLOTS} from "./mission-schedule.mjs";
import {safeProfile} from "./ai-profile.mjs";
const THEMES=["recuerdos","cocina","detalles","humor","paseo","pelicula","charla","planes"];
function hash(s){let v=2166136261;for(const c of String(s)){v^=c.charCodeAt(0);v=Math.imul(v,16777619)}return v>>>0}
const SHAREABLE_WEEKLY=[
 {title:"Tres recuerdos que nos eligieron",body:"Revisen juntos tres recuerdos que ya tengan en fotos o mensajes. Cada uno elige uno y cuenta qué detalle le hizo sentir especial. Guarden una frase de ese momento.",theme:"recuerdos",icon:"📸"},
 {title:"Un plan elegido entre los dos",body:"Cada uno propone una actividad sencilla para esta semana. Elijan la que a ambos les haga ilusión y reserven veinte minutos para disfrutarla sin presión.",theme:"planes",icon:"✨"},
 {title:"La caja de lo que admiramos",body:"Cada uno escribe dos cosas concretas que admiró del otro esta semana. Intercambien las notas cuando ambos quieran y conserven una para releer otro día.",theme:"detalles",icon:"💝"},
 {title:"Un plan elegido para disfrutarnos",body:"Cada uno proponga una actividad sencilla que realmente disfrute. Elijan una, organícenla entre los dos esta semana y compartan qué detalle les hizo bien del momento.",theme:"humor",icon:"🎲"},
 {title:"Una merienda y un recuerdo",body:"Con lo que haya en casa, preparen una merienda sencilla juntos. Mientras la comparten, recuerden un momento del año que los haya hecho reír y guarden una frase.",theme:"cocina",icon:"🍓"},
 {title:"Volver a elegir una costumbre",body:"Cada uno propone un gesto cotidiano que disfruta de la relación. Elijan uno, reserven un rato para repetirlo esta semana y cuenten por qué les hace bien.",theme:"charla",icon:"💬"}
];
const a=(slot,period,task_key,theme,title,body,icon,points,kind="mission")=>({
 period_key:period,slot,task_key,kind,theme,title,body,icon,points,mode:"guiado"
});
function chooseAlternate({week,userId,seed,avoid=[],preferred=[]}){
 const scores=deriveThemes({preferences:{},reflections:[],memories:[],ratings:[],recent:[]});
 const ordered=THEMES.filter(t=>!avoid.includes(t)).sort((a,b)=>{
  const aa=(scores[b]||0)+(preferred.includes(b)?5:0)+(hash(seed+b)%100)/100,bb=(scores[a]||0)+(preferred.includes(a)?5:0)+(hash(seed+a)%100)/100;
  return aa-bb;
 });
 const theme=ordered[0]||"recuerdos",variants=MEANINGFUL_PLAYBOOK[theme].daily;
 const choice=variants[hash(userId+week+seed)%variants.length];
 return {theme,title:choice[0],body:choice[1],icon:{"recuerdos":"📸","cocina":"🍓","detalles":"💝","humor":"🎲","paseo":"🌿","pelicula":"🎬","charla":"💬","planes":"✨"}[theme]};
}
export function buildWeeklyMissions({userId,spaceId,week,members=[],partnerProfile={},themes=[],recentTitles=[],avoidThemes=[],preferThemes=[]}){
 const schedule=scheduleFor({members,userId,week}),p=safeProfile(partnerProfile);
 const tailored=meaningfulPartnerPlan(p);
 // La persona valora la experiencia de sus propias misiones: solo afecta sus propuestas.
 const noRepeatThemes=[...new Set(avoidThemes.filter(t=>THEMES.includes(t)))];
 const lovedThemes=[...new Set(preferThemes.filter(t=>THEMES.includes(t)&&!noRepeatThemes.includes(t)))];
 const slots=[],seenThemes=[];
 const fullWeek="w:"+schedule.week;
 schedule.days.forEach((day,i)=>{
  const preferredTailored=tailored.hasSignals&&i<2?tailored.ideas[i]:null;
  const fromTailored=preferredTailored&&!noRepeatThemes.includes(preferredTailored.theme)
   ?preferredTailored:tailored.hasSignals&&i<2
    ?tailored.ideas.find(idea=>!noRepeatThemes.includes(idea.theme)&&!seenThemes.includes(idea.theme))||null:null;
  let proposal=fromTailored||chooseAlternate({week,userId,seed:"mission:"+i,avoid:[...seenThemes,...noRepeatThemes],preferred:lovedThemes});
  if(seenThemes.includes(proposal.theme)&&!fromTailored)proposal=chooseAlternate({week,userId,seed:"alternate:"+i,avoid:[...seenThemes,...noRepeatThemes],preferred:lovedThemes});
  seenThemes.push(proposal.theme);
  // Evita copiar el mismo título de la semana pasada, incluso en el respaldo.
  if(recentTitles.some(x=>String(x||"").trim().toLowerCase()===proposal.title.toLowerCase())){
   const alt=chooseAlternate({week,userId,seed:"avoidRepeat:"+i,avoid:[...seenThemes,...noRepeatThemes],preferred:lovedThemes});
   if(alt.title!==proposal.title)proposal=alt;
  }
  slots.push(a(day.slot,fullWeek,"d:"+day.date+":mission-"+(i+1),proposal.theme,proposal.title,proposal.body,proposal.icon,40));
 });
 if(schedule.weeklyAssigned){
  // La misión compartida sigue siendo idéntica para ambos y no usa feedback privado.
  const tailoredWeekly=tailored.hasSignals&&tailored.ideas[2]&&!noRepeatThemes.includes(tailored.ideas[2].theme)?tailored.ideas[2]:null;
  const proposal=schedule.cooperative?SHAREABLE_WEEKLY[hash(spaceId+"|"+schedule.week)%SHAREABLE_WEEKLY.length]:
    tailoredWeekly||chooseWeeklySolo({userId,week,schedule,avoidThemes:noRepeatThemes,preferThemes:lovedThemes});
  slots.push(a("weekly_1",fullWeek,fullWeek+":central-week",proposal.theme,proposal.title,proposal.body,proposal.icon,120));
 }
 const question=tailored.game;
 slots.push(a("game_1",fullWeek,"g:"+schedule.week+":central-game",question.theme,question.title,question.body,question.icon,20,"game"));
 return {schedule,activities:slots};
}
function chooseWeeklySolo({userId,week,avoidThemes=[],preferThemes=[]}){
 const available=THEMES.filter(t=>!avoidThemes.includes(t));
 const preferred=available.filter(t=>preferThemes.includes(t));
 const pool=preferred.length?preferred:(available.length?available:THEMES);
 const theme=pool[hash(userId+week+"weekly_solo")%pool.length];
 const pair=MEANINGFUL_PLAYBOOK[theme].weekly[hash(userId+"alt")%2];
 const icons={recuerdos:"📸",cocina:"🍓",detalles:"💝",humor:"🎲",paseo:"🌿",pelicula:"🎬",charla:"💬",planes:"✨"};
 return {theme,title:pair[0],body:pair[1],icon:icons[theme]};
}
export function isWeeklySoloAssigned(plan){return plan.schedule.weeklyAssigned&&!plan.schedule.cooperative}
export function dueDaily(activities,nowDate){
 return activities.filter(x=>x.slot.startsWith("mission_")&&String(x.task_key).slice(2,12)<=nowDate);
}
export function weeklySlots(plan){return plan.activities.filter(x=>MISSION_SLOTS.includes(x.slot)||x.slot==="weekly_1")}
