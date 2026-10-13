export type Stage = 0 | 1 | 2 | 3 | 4 | 5;
export type PuzzleAction =
  | {type: 'CLOCK'; hour: number; minute: number}
  | {type: 'RECORD'; record: string}
  | {type: 'CODE'; code: string}
  | {type: 'BOOK'; book: string}
  | {type: 'LANTERN'; index: number}
  | {type: 'RESET_RUSH'};
export type Progress = { stage: Stage; keyFound: boolean; books: string[]; lanterns: number[]; rushing: boolean };
export const initialProgress: Progress = {stage:0,keyFound:false,books:[],lanterns:[],rushing:false};
// Each browser entry is a brand-new game. Do not share mutable puzzle arrays across runs.
export function createNewProgress(): Progress {
  return {stage:0,keyFound:false,books:[],lanterns:[],rushing:false};
}
// A story told through the three books, not their shelf position.
export const bookOrder = ['flor','lluvia','luna'];
// The last lantern is not a left-to-right tap sequence.
export const lanternOrder = [2,0,1];
export function applyAction(state: Progress, action: PuzzleAction): {next:Progress, success:boolean, feedback:string} {
  if (action.type === 'RESET_RUSH' && state.stage===4) return {next:{...state,lanterns:[],rushing:true},success:true,feedback:'El jardín te concede una segunda oportunidad.'};
  if (state.stage===0 && action.type==='CLOCK') {
    if (!state.keyFound) return {next:state,success:false,feedback:'Falta la pequeña llave del reloj.'};
    if (action.hour===8 && action.minute===40) return {next:{...state,stage:1},success:true,feedback:'El tiempo volvió a caminar. Algo se movió junto a la vitrola.'};
    return {next:state,success:false,feedback:'La hora todavía no es la correcta. El reloj necesita dos observaciones del invernadero.'};
  }
  if (state.stage===1 && action.type==='RECORD') return action.record==='azul'
    ? {next:{...state,stage:2},success:true,feedback:'Esa era la canción. Un cajón acaba de destrabarse.'}
    : {next:state,success:false,feedback:'La melodía correcta tiene que ver con lo que queda después de la lluvia.'};
  if (state.stage===2 && action.type==='CODE') return action.code==='274'
    ? {next:{...state,stage:3},success:true,feedback:'El sobre contiene una carta. Sus versos parecen describir un orden secreto.'}
    : {next:state,success:false,feedback:'La combinación no coincide con los símbolos del escritorio.'};
  if (state.stage===3 && action.type==='BOOK') {
    const correct = bookOrder[state.books.length];
    if (action.book===correct) {
      const books=[...state.books,action.book];
      return books.length===3
        ? {next:{...state,books,stage:4,rushing:true,lanterns:[]},success:true,feedback:'¡El jardín está cerrándose! Tenés dos minutos.'}
        : {next:{...state,books},success:true,feedback:`Libro ${books.length} de 3. La biblioteca responde.`};
    }
    return {next:{...state,books:[]},success:false,feedback:'Los libros volvieron a su lugar. La carta habla de una transformación, no de su posición.'};
  }
  if (state.stage===4 && action.type==='LANTERN') {
    if (state.lanterns.includes(action.index)) return {next:state,success:false,feedback:'Esa luz ya está encendida.'};
    if (action.index!==lanternOrder[state.lanterns.length]) return {next:{...state,lanterns:[]},success:false,feedback:'Las luces se apagaron. No importa su posición: seguí el relato de la carta.'};
    const lanterns=[...state.lanterns,action.index];
    return lanterns.length===3
      ? {next:{...state,lanterns,stage:5,rushing:false},success:true,feedback:'El tiempo se detuvo. La última puerta se abrió para vos.'}
      : {next:{...state,lanterns},success:true,feedback:`Luz ${lanterns.length} de 3. No te detengas.`};
  }
  return {next:state,success:false,feedback:'Todavía hay algo pendiente en esta habitación.'};
}
export function formatRemaining(ms:number) {
  const s=Math.max(0,Math.ceil(ms/1000));
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
export function safeReplyLink(phone:string, sender:string, recipient:string): string | null {
  const digits=phone.replace(/\D/g,'');
  return digits.length>=10 && digits.length<=15 ? `https://wa.me/${digits}?text=${encodeURIComponent(`¡Sí! Confirmo nuestra cita ❤️ — ${recipient} (para ${sender})`)}` : null;
}
