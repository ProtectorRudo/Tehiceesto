// Carga rápida de misiones ya publicadas para una única cuenta, espacio y semana.
// Solo renderiza filas propias, nunca datos de semanas anteriores ni próximas.
// La generación con IA continúa en segundo plano; esta función no modifica nada.
import {mondayOf,taskDayFromKey} from "./mission-schedule.mjs";

const SLOTS=["mission_1","mission_2","mission_3","weekly_1","game_1"];

export function selectCachedWeeklyActivities(rows,{userId,spaceId,week}={}){
 if(!userId||!spaceId||typeof week!=="string")return [];
 let monday;
 try{monday=mondayOf(week)}catch{return []}
 if(monday!==week)return [];
 const period="w:"+week;
 const bySlot=new Map();
 for(const row of Array.isArray(rows)?rows:[]){
  if(!row||row.user_id!==userId||row.space_id!==spaceId||
     row.period_key!==period||!SLOTS.includes(row.slot)||
     typeof row.title!=="string"||!row.title.trim()||
     typeof row.body!=="string"||!row.body.trim())continue;
  const day=taskDayFromKey(row.task_key);
  if(row.slot.startsWith("mission_")){
   if(!day||mondayOf(day)!==week||
      row.task_key!=="d:"+day+":mission-"+row.slot.slice(-1))continue;
  }else if(row.slot==="weekly_1"){
   if(row.task_key!==period+":central-week")continue;
  }else if(row.slot==="game_1"){
   if(row.task_key!=="g:"+week+":central-game")continue;
  }
  if(!bySlot.has(row.slot))bySlot.set(row.slot,row);
 }
 return SLOTS.filter(slot=>bySlot.has(slot)).map(slot=>bySlot.get(slot));
}
export function hasCachedMissions(activities){
 return Array.isArray(activities)&&activities.some(x=>
  /^mission_[123]$/.test(x.slot)||x.slot==="weekly_1");
}
