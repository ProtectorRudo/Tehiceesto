// Historial personal de gestos: reutiliza las misiones realizadas que ya existen.
// No revela títulos de misiones de la otra persona ni muestra tareas futuras.
export function isMissionCompletion(key){
 return /^(?:d|w):\d{4}-\d{2}-\d{2}:/.test(String(key||""));
}
export function buildMissionHistory(completions=[],ownActivities=[],userId){
 if(!userId)return [];
 const titles=new Map((ownActivities||[])
  .filter(a=>a?.user_id===userId&&isMissionCompletion(a.task_key))
  .map(a=>[a.task_key,a]));
 return (completions||[])
  .filter(row=>row?.user_id===userId&&isMissionCompletion(row.task_key))
  .map(row=>{
   const saved=titles.get(row.task_key);
   return {
    key:row.task_key,
    title:saved?.title?.trim()||"Misión realizada",
    icon:saved?.icon||"♡",
    completedAt:row.completed_at||null,
    type:String(row.task_key).startsWith("w:")?"Misión semanal":"Misión personal"
   };
  }).sort((a,b)=>String(b.completedAt||"").localeCompare(String(a.completedAt||"")));
}
export function missionDateLabel(date){
 if(!date||!Number.isFinite(Date.parse(date)))return "Fecha no registrada";
 return new Intl.DateTimeFormat("es-AR",{timeZone:"America/Argentina/Buenos_Aires",day:"numeric",month:"short",year:"numeric"}).format(new Date(date));
}
