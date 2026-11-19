/** HUELLA Sunday goal choices. Closed, consented WhatsApp flow: no AI call.
 * Suggestions rotate deterministically by week, child and developmental stage.
 * Weekly goals are only sent to Sol as context for the corresponding Monday.
 */
const CATALOG={
 baby0:[
  'Disfrutar más encuentros de voz y canciones',
  'Acompañar sus señales de descanso y comodidad',
  'Compartir miradas y atención sin exigir respuestas',
  'Crear pausas tranquilas durante la rutina diaria',
  'Explorar imágenes grandes de manera compartida',
  'Hacer más agradables los momentos de cuidado',
  'Compartir juegos suaves de sonidos cotidianos',
  'Conocer qué momentos disfruta para estar cerca',
  'Ofrecer experiencias visuales sencillas y seguras',
  'Fortalecer el contacto afectuoso y respetuoso',
  'Acompañar su curiosidad sin probar habilidades',
  'Encontrar ratitos de conexión sin pantallas'
 ],
 baby1:[
  'Compartir palabras y canciones en los cuidados',
  'Acompañar su curiosidad por objetos seguros',
  'Disfrutar juegos sencillos de turnos espontáneos',
  'Respetar sus señales de pausa y descanso',
  'Favorecer exploraciones cotidianas acompañadas',
  'Compartir libros e imágenes a su propio ritmo',
  'Ofrecer oportunidades de elegir sin presión',
  'Construir momentos tranquilos en las transiciones',
  'Acompañar sus intentos naturales de comunicarse',
  'Disfrutar juntos movimientos sin forzar posturas',
  'Estar cerca en momentos de frustración',
  'Crear ratos compartidos sin pantallas'
 ],
 early:[
  'Expresar emociones con palabras y juego',
  'Practicar elecciones pequeñas con autonomía',
  'Disfrutar momentos cotidianos de conexión',
  'Aprender a esperar y compartir con calma',
  'Explorar su creatividad e imaginación',
  'Acompañar frustraciones sin presionar',
  'Animarse a pedir ayuda cuando la necesita',
  'Escuchar y contar historias juntos',
  'Reconocer sus propios gustos y preferencias',
  'Cooperar en pequeñas tareas de casa',
  'Disfrutar experiencias sin pantallas',
  'Fortalecer la confianza para intentar algo nuevo'
 ],
 school:[
  'Expresar lo que siente con confianza',
  'Tomar decisiones pequeñas con autonomía',
  'Aprender a manejar la frustración',
  'Escucharnos sin interrumpir',
  'Fortalecer la confianza para pedir ayuda',
  'Resolver desacuerdos conversando',
  'Disfrutar más momentos sin pantallas',
  'Explorar su creatividad y proyectos personales',
  'Practicar la cooperación en familia',
  'Descubrir mejor sus intereses',
  'Reconocer sus esfuerzos sin competir',
  'Compartir tiempo de calidad de su elección'
 ],
 teen:[
  'Conversar con confianza sin interrogatorios',
  'Respetar su autonomía y sus decisiones',
  'Escuchar sus intereses sin juzgarlos',
  'Acompañar frustraciones y desafíos cotidianos',
  'Encontrar momentos compartidos sin pantallas',
  'Conversar sobre desacuerdos con respeto',
  'Facilitar que pueda pedir ayuda con confianza',
  'Compartir una actividad elegida por él o ella',
  'Reconocer su esfuerzo sin exigir resultados',
  'Acompañar proyectos e intereses personales',
  'Construir confianza respetando su privacidad',
  'Colaborar en decisiones familiares cotidianas'
 ]
};
const compact=x=>String(x||'').trim();
const asDay=d=>new Date(String(d)+'T12:00:00Z');
export function nextWeekMonday(day){
 const d=asDay(day);
 if(!Number.isFinite(d.getTime()))throw Error('invalid_week_date');
 const offset=(8-d.getUTCDay())%7 || 7;
 d.setUTCDate(d.getUTCDate()+offset);
 return d.toISOString().slice(0,10);
}
const stage=c=>{
 const months=Number.isInteger(c?.ageMonths)?c.ageMonths:Number(c?.age)*12;
 if(Number(c?.age)<2)return months<12?'baby0':'baby1';
 if(Number(c?.age)<6)return 'early';
 if(Number(c?.age)<10)return 'school';
 return 'teen';
};
export function goalChoices(child,weekKey,index=0){
 const items=CATALOG[stage(child)];
 const weekIndex=Math.floor(asDay(weekKey).getTime()/604800000);
 // Coprime stride 5 means the three options differ completely from last week;
 // the complete triplet only recurs after twelve weeks, not after four.
 const offset=((weekIndex*5+index*3)%items.length+items.length)%items.length;
 return Array.from({length:3},(_,n)=>items[(offset+n)%items.length]);
}
export function weeklyGoalFor(state,index,weekKey){
 const child=state.children?.[index];
 if(!child||!weekKey)return null;
 const record=(state.weeklyGoals||[]).find(x=>x.weekKey===weekKey);
 const selection=record?.choices?.[String(index)];
 return selection?.childName===child.name&&typeof selection.goal==='string'?selection.goal:null;
}
export function latestWeeklyGoal(state,index,beforeWeekKey){
 const child=state.children?.[index];
 if(!child)return null;
 const latest=(state.weeklyGoals||[]).filter(x=>x.weekKey<beforeWeekKey)
  .sort((a,b)=>b.weekKey.localeCompare(a.weekKey))
  .find(x=>x.choices?.[String(index)]?.childName===child.name);
 return latest?.choices?.[String(index)]?.goal||null;
}
export function beginWeeklyGoals(state,day){
 if(!Array.isArray(state.children)||!state.children.length)return false;
 const weekKey=nextWeekMonday(day);
 if(state.huellaWeekV2?.key===weekKey)return false;
 state.weeklyGoalSelection={weekKey,childIndex:0};
 state.flow='weekly_goal_choice';
 return true;
}
export function weeklyGoalPrompt(state){
 const s=state.weeklyGoalSelection;
 const child=s&&state.children?.[s.childIndex];
 if(!child)return null;
 const choices=goalChoices(child,s.weekKey,s.childIndex);
 const previous=latestWeeklyGoal(state,s.childIndex,s.weekKey);
 const header='🌱 *HUELLA · Objetivo de la próxima semana*\n\n¿En qué te gustaría enfocarte con '+child.name+'? Elegí una opción:';
 const lines=choices.map((label,i)=>(i+1)+'. '+label);
 lines.push('4. Otro objetivo (escribilo con tus palabras)');
 if(previous)lines.push('5. Mantener el objetivo de la semana anterior');
 lines.push('0. Omitir por ahora');
 return {body:header+'\n\n'+lines.join('\n'),options:['1','2','3','4',...(previous?['5']:[]),'0']};
}
export function rememberWeeklyGoal(state,index,weekKey,goal,source,now){
 const c=state.children?.[index];
 if(!c||!compact(goal))throw Error('invalid_week_goal');
 const trimmed=compact(goal).slice(0,180);
 const list=[...(state.weeklyGoals||[])];
 let record=list.find(r=>r.weekKey===weekKey);
 if(!record){record={weekKey,choices:{}};list.push(record);}
 record.choices[String(index)]={childName:c.name,goal:trimmed,source,answeredAt:now};
 state.weeklyGoals=list.sort((a,b)=>a.weekKey.localeCompare(b.weekKey)).slice(-16);
}
export function advanceWeeklyGoal(state){
 const selection=state.weeklyGoalSelection;
 if(!selection)return true;
 selection.childIndex++;
 if(selection.childIndex<state.children.length){
  state.flow='weekly_goal_choice';return false;
 }
 state.weeklyGoalSelection=null;state.flow='idle';
 return true;
}
export function formatWeeklyGoalSummary(state,weekKey){
 const lines=state.children.map((c,i)=>{
  const value=weeklyGoalFor(state,i,weekKey);
  return c.name+': '+(value||'seguiremos con sus objetivos habituales');
 });
 return '🌱 Objetivos para la semana del '+weekKey+'\n\n'+lines.join('\n')+
  '\n\nSol los tendrá en cuenta al preparar las próximas misiones. Si hoy no elegiste alguno, no se frenará ninguna actividad.';
}
