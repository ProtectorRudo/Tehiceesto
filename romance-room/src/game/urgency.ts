/** Narrative events depend on remaining time, not browser interval frequency.
 * The crossing check fires each event once even if a frame is skipped.
 * None of these events reveal puzzle solutions or item locations. */
export type CuePhase = 'exploration' | 'rush';
export type NarrativeCue = {id:string; seconds:number; title:string; description:string; severity:'soft'|'warning'|'critical'; duration:number};

export const explorationCues: readonly NarrativeCue[] = [
  {id:'exploration-360',seconds:360,title:'El jardín comienza a cambiar',description:'Una brisa extraña cruza las flores. Algunas pierden su color. El tiempo sigue corriendo.',severity:'soft',duration:5300},
  {id:'exploration-180',seconds:180,title:'El invernadero se está marchitando',description:'Los pétalos empiezan a caer y la luz se debilita. Queda poco tiempo para llegar a la última puerta.',severity:'warning',duration:5500},
  {id:'exploration-60',seconds:60,title:'La última hora de calma termina',description:'El jardín se inclina bajo el viento. No te detengas: la última campanada se acerca.',severity:'warning',duration:5400},
  {id:'exploration-0',seconds:0,title:'El tiempo de exploración se agotó',description:'Las flores siguen apagándose. La última puerta todavía puede abrirse, pero ya no habrá calma.',severity:'critical',duration:5800}
];
export const rushCues: readonly NarrativeCue[] = [
  {id:'rush-120',seconds:120,title:'¡LA ÚLTIMA CAMPANADA!',description:'El invernadero está cerrando sus puertas. Tenés dos minutos antes de que el jardín se marchite por completo.',severity:'warning',duration:6200},
  {id:'rush-90',seconds:90,title:'Las flores están perdiendo la vida',description:'Los pétalos se desprenden. La luz del jardín disminuye y el viento aumenta.',severity:'warning',duration:5200},
  {id:'rush-60',seconds:60,title:'¡Queda un minuto!',description:'El jardín está cediendo. Las flores se inclinan y la última puerta sigue cerrándose.',severity:'critical',duration:5000},
  {id:'rush-30',seconds:30,title:'¡Solo treinta segundos!',description:'Las últimas flores comienzan a marchitarse. Si no actuás ahora, el jardín desaparecerá en silencio.',severity:'critical',duration:5000},
  {id:'rush-10',seconds:10,title:'¡DIEZ SEGUNDOS!',description:'La campanada final está por sonar. ¡Es ahora!',severity:'critical',duration:8000}
];
export function crossedCue(phase:CuePhase,previousSeconds:number,currentSeconds:number):NarrativeCue|null {
  if(!Number.isFinite(previousSeconds)||!Number.isFinite(currentSeconds))return null;
  const list=phase==='rush'?rushCues:explorationCues;
  // If frames skip several thresholds, prefer the most urgent CURRENT message.
  return [...list].reverse().find(cue=>previousSeconds>cue.seconds&&currentSeconds<=cue.seconds)??null;
}
export function bloomDeterioration(phase:CuePhase,remainingMs:number,totalMs:number){
  const portion=1-Math.max(0,Math.min(1,remainingMs/totalMs));
  return phase==='rush'?.28+.72*portion:.28*portion;
}
