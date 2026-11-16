// Calendario de misiones Cómplices: 3 días por integrante; 1 misión semanal por pareja.
// Semanas comienzan lunes, zona local Argentina interpretada por el servidor.
export const DAY_NAMES=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const WEEK_MS=604800000;
const BASE_WEEK=Date.UTC(2026,10,16);
function parseDay(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s)))throw new Error("Invalid ISO local date");const d=new Date(s+"T12:00:00Z");if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==s)throw new Error("Invalid calendar date");return d}
export function mondayOf(day){
 const d=parseDay(day);
 d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));
 return d.toISOString().slice(0,10);
}
export function dayOfWeek(week,offset){
 if(!Number.isInteger(offset)||offset<0||offset>6)throw new Error("Invalid offset");
 const d=parseDay(mondayOf(week));d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);
}
export function weekNumber(week){
 const d=parseDay(mondayOf(week));
 return Math.round((Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())-BASE_WEEK)/WEEK_MS);
}
export function orderedPair(members=[]){
 return [...members].filter(m=>m&&typeof m.user_id==="string").sort((a,b)=>{
  const t=String(a.joined_at||"").localeCompare(String(b.joined_at||""));
  return t||a.user_id.localeCompare(b.user_id);
 }).slice(0,2);
}
export function scheduleFor({members=[],userId,week}){
 const pair=orderedPair(members);
 const index=pair.findIndex(x=>x.user_id===userId);
 if(index<0)throw new Error("User must belong to this couple");
 const n=weekNumber(week),w=mondayOf(week);
 const two=pair.length>1,swap=two&&Math.abs(n)%2===1;
 const firstDays=[0,2,4],secondDays=[1,3,5];
 const rank=(index+(swap?1:0))%2;
 const offsets=two&&rank===1?secondDays:firstDays;
 const soloOrJoint=!two?"solo":((n%3+3)%3===2?"juntos":"solo");
 const ownerRank=two?((n%3+3)%3):index;
 const weeklyOwnerId=soloOrJoint==="juntos"?null:pair[Math.min(ownerRank,pair.length-1)].user_id;
 const weeklyAssigned=soloOrJoint==="juntos"||weeklyOwnerId===userId;
 const days=offsets.map((offset,i)=>({slot:"mission_"+(i+1),date:dayOfWeek(w,offset),label:DAY_NAMES[offset]}));
 return {week:w,dayNumbers:offsets,days,weeklyMode:soloOrJoint,weeklyOwnerId,weeklyAssigned,cooperative:soloOrJoint==="juntos",weeklySlot:weeklyAssigned?"weekly_1":null,gameSlot:"game_1"};
}
export function taskDayFromKey(key){
 const v=String(key||"").match(/^d:(\d{4}-\d{2}-\d{2}):mission-[123]$/);
 return v?v[1]:null;
}
export function unlockedTasks(activities=[],today){
 return activities.filter(a=>{
  if(!String(a.slot).startsWith("mission_"))return true;
  const due=taskDayFromKey(a.task_key);
  return due&&due<=today;
 });
}
// Juegos y preguntas opcionales no consumen los tres días de misión.
export const MISSION_SLOTS=["mission_1","mission_2","mission_3"];
