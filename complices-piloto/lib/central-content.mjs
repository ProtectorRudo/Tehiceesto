import {evaluateMission} from "./mission-quality.mjs";
import {MEANINGFUL_PLAYBOOK} from "./meaningful-playbook.mjs";
// Motor guiado de Cómplices. Nunca devuelve las respuestas privadas originales.
export const THEMES=["detalles","charla","paseo","cocina","pelicula","recuerdos","planes","humor"];
const KEYWORDS={
 detalles:/chocolate|flor|regalo|sorpres|detalle|cariñ|dulce|mate|caf[eé]/i,
 charla:/charl|convers|escuch|hablar|pregunt|di[aá]logo|tiempo|palabras/i,
 paseo:/pase|camina|plaza|parque|aire libre|sender|playa|viaje|salir/i,
 cocina:/cocin|receta|comida|desayun|cena|almuer|hornear|preparar/i,
 pelicula:/pel[ií]cul|serie|cine|netflix|disney|sill[oó]n/i,
 recuerdos:/foto|recuerdo|historia|momento|canci[oó]n|nostalgi/i,
 planes:/plan|proyect|sue[ñn]o|futuro|aventura|escapad/i,
 humor:/re[ií]r|risas|diver|humor|broma|juego|chiste/i
};
const CATALOG={
 detalles:{
  icon:"💌",
  daily:[
   ["Lo que a veces no decimos","Elegí algo concreto que admirás de tu pareja y decíselo de una manera inesperada."],
   ["Un mensaje que acompaña","Dejale una nota breve en un lugar cotidiano: contale por qué valorás estar juntos."],
   ["El gesto invisible","Hacé algo amable que le alivie el día, sin esperar nada a cambio."]
  ],
  weekly:[
   ["Una semana de pequeñas sorpresas","Durante esta semana, elegí tres gestos simples y distintos para alegrarle el día a tu pareja."],
   ["Los detalles cuentan","Preparen una caja o sobre con tres recuerdos o mensajes que quieran conservar."]
  ],
  game:["Si nos regalaran una hora libre, ¿qué gesto simple la haría especial?","¿Qué detalle nuestro debería convertirse en una tradición?"]
 },
 charla:{
  icon:"💬",
  daily:[
   ["Diez minutos nuestros","Invitá a tu pareja a conversar diez minutos sin pantallas; preguntale qué fue lo mejor del día."],
   ["Una pregunta distinta","Preguntale qué cosa nueva te gustaría conocer de ella o él. Después compartí vos también."],
   ["La escucha como regalo","Reservá un momento para escuchar cómo se sintió hoy, sin tratar de resolverlo todo."]
  ],
  weekly:[
   ["La conversación pendiente de alegría","Busquen un rato tranquilo para hablar de tres sueños compartidos, aunque sean pequeños."],
   ["Un mapa de conversaciones","Elijan tres temas curiosos para conversar durante la semana, uno por vez."]
  ],
  game:["Si pudiéramos repetir una conversación nuestra, ¿cuál elegirías?","¿Qué pregunta divertida nunca nos hicimos?"]
 },
 paseo:{
  icon:"🌿",
  daily:[
   ["Una vuelta juntos","Proponé una caminata corta por un lugar que ambos disfruten, sin prisa ni objetivos."],
   ["Un rincón diferente","Elegí un lugar cercano que no visitan hace tiempo e invitá a tu pareja a pasar por ahí."],
   ["Quince minutos afuera","Si el día acompaña, compartan un paseo breve y observen algo lindo del entorno."]
  ],
  weekly:[
   ["Exploradores de nuestro barrio","Planeen un pequeño recorrido por un lugar nuevo o poco visitado de su zona."],
   ["La cita al aire libre","Organizá un plan sencillo afuera de casa; elegí algo cómodo para los dos."]
  ],
  game:["¿Elegirías playa, bosque, montaña o ciudad para una escapada de dos?","¿Cuál sería nuestro paseo perfecto sin gastar dinero?"]
 },
 cocina:{
  icon:"🍓",
  daily:[
   ["Algo rico para compartir","Prepará una merienda sencilla e invitá a tu pareja a disfrutarla con calma."],
   ["Un sabor conocido","Elegí algo de comer o beber que ambos disfruten y convertílo en un momento especial."],
   ["Cocina de equipo","Propongan preparar juntos algo sencillo, aunque sea una tostada especial."]
  ],
  weekly:[
   ["Nuestra receta compartida","Elijan una receta que nunca hayan preparado y háganla juntos esta semana."],
   ["Un menú hecho con cariño","Organicen una comida especial en casa donde ambos elijan algún detalle."]
  ],
  game:["Si abriéramos nuestro propio restaurante por un día, ¿qué serviríamos?","¿Qué comida representa mejor un recuerdo de nosotros?"]
 },
 pelicula:{
  icon:"🎬",
  daily:[
   ["Nuestra escena favorita","Elegí una película o escena que les recuerde algo vivido y contale por qué."],
   ["Un tráiler sorpresa","Proponé dos opciones para ver juntos y dejá que tu pareja elija la historia."],
   ["Un ratito de ficción","Compartan un capítulo corto o escena favorita y conversen sobre lo que les provocó."]
  ],
  weekly:[
   ["Cine en casa con encanto","Planeen una noche de película con algo rico, ambiente cómodo y celulares a un lado."],
   ["Nuestro festival privado","Cada uno propone una historia; elijan una para compartir esta semana."]
  ],
  game:["Si nuestra historia fuera una película, ¿qué género tendría?","¿Qué personaje de una película nos representa más como equipo?"]
 },
 recuerdos:{
  icon:"📸",
  daily:[
   ["Esa vez que sonreímos","Recordá una situación compartida y contale a tu pareja qué te gustó de ese momento."],
   ["Una foto con historia","Elegí una foto significativa y preguntale qué recuerda la otra persona de ese día."],
   ["Nuestra banda sonora","Compartí una canción que te lleve a un recuerdo lindo de ustedes."]
  ],
  weekly:[
   ["Pequeña cápsula del tiempo","Elijan un recuerdo para guardar y escriban qué les gustaría recordar dentro de un año."],
   ["El álbum que habla","Revisen cinco fotos juntos y cuenten qué detalle recuerda cada uno."]
  ],
  game:["¿Qué recuerdo nuestro merece una página entera en un álbum?","¿Qué canción usarías para contar nuestra historia?"]
 },
 planes:{
  icon:"✨",
  daily:[
   ["Un plan posible","Preguntale a tu pareja qué plan sencillo le gustaría hacer esta semana y busquen un momento."],
   ["Un sueño en miniatura","Elijan un pequeño deseo compartido y piensen cuál podría ser el primer paso."],
   ["Un futuro que entusiasma","Contale a tu pareja algo que te gustaría vivir juntos y escuchá su idea."]
  ],
  weekly:[
   ["Una aventura para dos","Planeen una actividad diferente para esta semana, respetando tiempo y presupuesto."],
   ["Nuestro próximo capítulo","Elijan una meta compartida pequeña y definan un paso concreto para acercarse."]
  ],
  game:["¿Qué aventura probaríamos primero si tuviéramos una tarde libre?","¿Qué experiencia nueva nos haría reír juntos?"]
 },
 humor:{
  icon:"🎲",
  daily:[
   ["Ríanse un rato","Compartí con tu pareja un recuerdo gracioso y tratá de reconstruir la historia con sus detalles."],
   ["Un desafío absurdo","Inventen un apodo para un objeto cotidiano y úsenlo durante el día."],
   ["La sorpresa divertida","Mandale una pregunta graciosa a tu pareja y jugá a adivinar su respuesta."]
  ],
  weekly:[
   ["Un torneo de tonterías","Elijan tres juegos breves para hacer juntos esta semana. Que gane la risa, no la competencia."],
   ["Nuestro reto creativo","Inventen un juego nuevo con cosas que tengan en casa y disfruten el experimento."]
  ],
  game:["¿Cuál fue nuestro momento más gracioso sin querer?","Si intercambiáramos papeles por un día, ¿qué sería lo más divertido?"]
 }
};
function hash(s){let value=2166136261;for(const char of String(s)){value^=char.charCodeAt(0);value=Math.imul(value,16777619)}return value>>>0}
const normalized=(v)=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
export function deriveThemes({preferences={},reflections=[],memories=[],recent=[],ratings=[],completedThemes=[]}={}){
 const score=Object.fromEntries(THEMES.map(t=>[t,0]));
 const keyMap={charlar:"charla",caminar:"paseo",peli:"pelicula",cocinar:"cocina",salir:"paseo"};
 if(keyMap[preferences.favorite_plan])score[keyMap[preferences.favorite_plan]]+=7;
 if(preferences.love_language==="detalles")score.detalles+=5;
 if(preferences.love_language==="palabras")score.charla+=5;
 if(preferences.love_language==="tiempo"){score.charla+=3;score.planes+=2}
 if(preferences.favorite_treat!=="ninguno")score.detalles+=3;
 const allowed=(reflections||[]).filter(r=>r.ai_use_allowed===true && r.question_id!=="q07").map(r=>r.answer||"");
 const positive=(memories||[]).filter(r=>r.use_for_ai===true && r.category!=="evitar").map(r=>r.body||"");
 const negative=(reflections||[]).filter(r=>r.ai_use_allowed===true && r.question_id==="q07").map(r=>r.answer||"").concat((memories||[]).filter(r=>r.use_for_ai===true&&r.category==="evitar").map(r=>r.body||""));
 for(const t of THEMES){
  const re=KEYWORDS[t];
  for(const v of allowed.concat(positive))if(re.test(normalized(v)))score[t]+=4;
  for(const v of negative)if(re.test(normalized(v)))score[t]-=20;
  for(const act of (recent||[]).slice(0,18))if(act.theme===t)score[t]-=1.6;
  for(const item of (ratings||[])){if(item.theme===t)score[t]+=item.rating===1?2.3:-4}
  score[t]+=Math.min(3,(completedThemes||[]).filter(v=>v===t).length*0.7)
 }
 return score;
}
function pickTheme(scores,seed,exclude=[]){const pool=THEMES.filter(t=>!exclude.includes(t));return pool.sort((a,b)=>(scores[b]+(hash(seed+b)%110)/100)-(scores[a]+(hash(seed+a)%110)/100))[0]||"charla"}
const toActivity=(slot,period,theme,index)=>{const c={...CATALOG[theme],...MEANINGFUL_PLAYBOOK[theme]},weekly=slot==="weekly_1",game=slot==="game_1";const variant=game?c.game[index%c.game.length]:weekly?c.weekly[index%c.weekly.length]:c.daily[index%c.daily.length];return {
 period_key:period,slot,kind:game?"game":"mission",theme,title:game?"Una pregunta que conecta":variant[0],body:game?variant:variant[1],
 icon:c.icon,points:game?20:weekly?120:slot==="daily_1"?40:30,mode:"guiado",
 task_key:period+":"+(game?"central-game":slot==="daily_1"?"central-1":slot==="daily_2"?"central-2":"central-1")
}};
export function generateGuidedPlan({userId,date,week,preferences,reflections,memories,recent,ratings,completedThemes=[],hint,partnerSignals=[]}){
 const scores=deriveThemes({preferences,reflections,memories,recent,ratings,completedThemes}),salt=userId+"-"+date;
 const safePartnerThemes=[...new Set((partnerSignals||[]).filter(x=>THEMES.includes(x)))];
 const partnerTheme=safePartnerThemes.length?safePartnerThemes[hash(salt+"partner")%safePartnerThemes.length]:null;
 const first=partnerTheme||pickTheme(scores,salt+"daily1");
 const second=pickTheme(scores,salt+"daily2",[first]);
 const weeklyTheme=pickTheme(scores,userId+week+"weekly",[second]);
 const gameTheme=partnerTheme||pickTheme(scores,salt+"game",[first]);
 const safeHint=hint&&typeof hint.title==="string"&&typeof hint.body==="string"?hint:null;
 const firstActivity=toActivity("daily_1","d:"+date,first,hash(salt+"one")%3);
 if(!partnerTheme&&safeHint&&safeHint.title.length<120&&safeHint.body.length<440){
  firstActivity.title=safeHint.title;firstActivity.body=safeHint.body;firstActivity.theme="detalles";firstActivity.icon="💝";
 }
 return [
  firstActivity,
  toActivity("daily_2","d:"+date,second,hash(salt+"two")%3),
  toActivity("weekly_1","w:"+week,weeklyTheme,hash(userId+week+"weekly")%2),
  toActivity("game_1","d:"+date,gameTheme,hash(salt+"game")%2)
 ];
}
export function answerIsSafe(v){return typeof v==="string"&&v.length>=8&&v.length<=420&&!/https?:\/\//i.test(v)}


// Mantiene el catálogo original como respaldo. Se aplica solamente a propuestas
// válidas para la persona de esta sesión; nunca altera datos de la otra cuenta.
export const CENTRAL_SLOTS=["daily_1","daily_2","weekly_1","game_1"];
export function mergeGeneratedIdeas(guided,proposals,isCompatible=()=>true,options={}){
 if(!Array.isArray(guided)||!proposals||typeof proposals!=="object"||Array.isArray(proposals))return guided;
 const usedTitles=[...(options.recentTitles||[])];
 return guided.map(item=>{
  if(!CENTRAL_SLOTS.includes(item.slot))return item;
  const suggestion=proposals[item.slot];
  if(!suggestion||typeof suggestion.title!=="string"||typeof suggestion.body!=="string")return item;
  const title=suggestion.title.trim(),body=suggestion.body.trim();
  if(title.length<3||title.length>85||body.length<8||body.length>260)return item;
  if(!answerIsSafe(body)||!isCompatible(title+" "+body))return item;
  const quality=evaluateMission({title,body,slot:item.slot,partnerProfile:options.partnerProfile||{},recentTitles:usedTitles});
  if(!quality.pass)return item;
  usedTitles.push(title);
  return {...item,title,body,mode:"generativa"};
 });
}
