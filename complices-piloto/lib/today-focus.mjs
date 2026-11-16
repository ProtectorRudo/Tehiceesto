// Cómplices: elegí una acción real sin inventar una misión en días libres.
// Las misiones futuras siguen ocultas y las completadas no desplazan a las pendientes.
export function pickFocusMission({todayTasks=[],pendingTasks=[],weeklyTasks=[],isDone=()=>false}={}){
 const ordered=[...todayTasks,...pendingTasks,...weeklyTasks];
 return ordered.find(task=>task&&task.key&&!isDone(task.key))||null;
}
export function focusMissionHeading(task,today){
 if(!task)return "Un pequeño gesto para hoy";
 if(task.slot==="weekly_1")return "Tu gesto de esta semana";
 if(task.due===today)return "Tu misión de hoy";
 return "Una misión que te espera";
}
export const OPTIONAL_GESTURE={
 title:"Un minuto para estar cerca",
 body:"Preguntale a tu pareja qué pequeña cosa le haría bien hoy. Escuchá sin prisa ni exigencias. No suma puntos ni es una obligación."
};
