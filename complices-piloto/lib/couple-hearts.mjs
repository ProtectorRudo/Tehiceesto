// Ambos integrantes suman sin competir. Se conservan los puntos históricos del piloto.
export function pointsForTask(key){
 const task=String(key||"");
 return task.startsWith("w:")?120:task.startsWith("q:")?20:
  task.startsWith("d:")&&/:(mission-[123]|central-1|sorpresa)$/.test(task)?40:
  task.startsWith("g:")?60:30;
}
export function heartsFor(completions,userId){
 if(!userId)return 0;
 return (completions||[]).filter(row=>row.user_id===userId).reduce((sum,row)=>sum+pointsForTask(row.task_key),0);
}
export function sharedHearts(completions){
 return (completions||[]).reduce((sum,row)=>sum+pointsForTask(row.task_key),0);
}
