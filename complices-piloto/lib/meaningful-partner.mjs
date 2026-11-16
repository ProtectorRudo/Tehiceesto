// Misiones concretas basadas SOLO en pistas que otra persona autorizó.
// Nunca entrega el valor de una preferencia a la cuenta contraria.
import {safeProfile} from "./ai-profile.mjs";
const idea=(title,body,theme="detalles",icon="💝")=>({title,body,theme,icon});
export function meaningfulPartnerPlan(raw){
 const p=safeProfile(raw);
 const noSpend=p.presupuesto==="gratis"||p.evitar==="gastos";
 const extra=p.evitar==="sorpresas_publicas"?" Hacé el gesto en privado.":"";
 let first;
 switch(p.detalle){
  case "mate":first=idea("Un mate pensado para compartir","Si tienen mate en casa, preparalo como suelen disfrutarlo y dejá una notita con un motivo concreto por el que valorás estar juntos. No hace falta gastar.");break;
  case "cafe":first=idea("El café tiene un mensaje","Si tienen café en casa, preparale una taza a su gusto y escribí una frase que recuerde un momento lindo entre ustedes. Compartí cinco minutos si ambos quieren.");break;
  case "chocolate":first=idea("Un gusto con una historia",noSpend?"Si ya tienen chocolate en casa, separá un pedacito con una nota que recuerde un momento de ustedes. Si no hay, dejá solo la nota: el gesto cuenta.":"Si ya tienen chocolate, compartan un pedacito con una nota que explique qué recuerdo dulce de ustedes te vino a la cabeza.");break;
  case "flores":first=idea("Una flor con una razón",noSpend?"Dibujá una flor pequeña en un papel y escribí por qué te hizo acordar a tu pareja. Dejala en privado: no necesitás comprar nada.":"Dibujá una flor en un papel o elegí una que ya tengan y acompañala con una frase que explique qué admirás de tu pareja.");break;
  case "comida":first=idea("Un bocado a su medida","Con algo rico que ya tengan, prepará una mini merienda y anotá un recuerdo que te evoque ese sabor. Invitá a compartir cinco minutos.");break;
  case "nota":first=idea("Una nota en el momento justo","Escribí «Hoy me acordé de vos cuando…» y completá la frase con algo real. Dejá la nota en un lugar privado donde pueda verla sin apuro.");break;
  case "sin_regalos":first=idea("Un regalo sin comprar nada","Elegí una tarea breve que le alivie el día y ofrecete a resolverla. Explicá que querés regalarle un rato de descanso, sin pedir nada a cambio.");break;
  default:
   if(p.afecto==="ayuda")first=idea("Cinco minutos de alivio","Identificá una tarea cotidiana que puedas hacer para aliviarle el día y ofrecete a resolverla. Contale que te importa su tranquilidad.");
   else if(p.afecto==="palabras")first=idea("Una frase que queda","Escribí un agradecimiento concreto: qué gesto suyo notaste esta semana y por qué lo valorás. Dejá la nota donde pueda encontrarla sin apuro.");
   else if(p.afecto==="tiempo")first=idea("Diez minutos sin interrupciones","Proponé compartir diez minutos sin pantallas. Preguntale cuál fue el mejor momento de su día y escuchá sin apurar la respuesta.");
   else if(p.plan==="cocinar")first=idea("Un sabor para recordar","Con ingredientes que ya tengan, proponé preparar algo sencillo juntos. Mientras cocinan, contale qué comida te recuerda a un momento de ustedes.","cocina","🍓");
   else first=idea("Un detalle que se siente","Escribí en una nota algo concreto que admirás de tu pareja y cuándo lo notaste. Dejala en privado, sin esperar una reacción.");
 }
 first={...first,body:first.body+extra};
 let second;
 switch(p.plan){
  case "cocinar":second=idea("Una receta de dos","Elegí una receta fácil con ingredientes que ya tengan y ofrecé prepararla juntos diez minutos. Mientras cocinan, contale qué recuerdo te trae ese sabor.","cocina","🍓");break;
  case "pelicula":second=idea("Una escena que dice algo","Proponé elegir una escena corta de una película o serie que ya conozcan. Mostrala y contale qué detalle te hace pensar en su historia.","pelicula","🎬");break;
  case "paseo":second=idea("Una vuelta con recuerdo","Si a los dos les gusta la idea, propongan caminar diez minutos por un lugar cercano y compartir un recuerdo lindo de algún paseo anterior.","paseo","🌿");break;
  case "jugar":second=idea("El juego de nuestros recuerdos","Inventá tres pistas de anécdotas compartidas y pedile a tu pareja que adivine de cuáles hablás. Cinco minutos y ninguna competencia.","humor","🎲");break;
  case "charlar":second=idea("Una conversación con una sorpresa","Preguntale por algo lindo que hizo esta semana y quizás nadie notó. Escuchá diez minutos y contale por qué te alegra ese logro.","charla","💬");break;
  case "salida":second=idea("Quince minutos de aventura","Ofrecé dos opciones de paseo corto y gratuito cerca de casa; dejá que elija y vayan solo si a ambos les resulta cómodo.","paseo","🌿");break;
  case "descanso":second=idea("Una pausa compartida","Prepará un rincón tranquilo con lo que tengan en casa y ofrecé diez minutos de descanso juntos, sin pantallas ni obligaciones.","detalles","💝");break;
  default:second=idea("La pregunta que importa","Invitá a tu pareja a hablar diez minutos y preguntale: «¿Qué pequeño momento de esta semana querrías repetir?» Escuchá su respuesta.","charla","💬");
 }
 if(p.evitar==="salidas_largas"&&p.plan==="salida")second=idea("Una cita tranquila en casa","Ofrecé preparar una bebida con lo que tengan y compartir diez minutos de conversación cómoda, sin tener que salir.","charla","💬");
 if(p.evitar==="contacto_sin_avisar"||p.afecto==="contacto")second.body+=" Si surge un abrazo o contacto físico, preguntá si le resulta cómodo.";
 if(p.momento&&p.momento!=="cualquiera"){
  const clock={manana:"por la mañana",tarde:"por la tarde",noche:"por la noche",fin_semana:"el fin de semana"}[p.momento];
  if(clock)second.body="Cuando tengan un rato "+clock+", "+second.body.charAt(0).toLowerCase()+second.body.slice(1);
 }
 let weekly;
 if(p.plan==="cocinar")weekly=idea("Nuestra receta con historia","Esta semana elijan una receta sencilla con ingredientes que ya tengan. Cocinen juntos media hora y contale qué sabor te recuerda a su historia.","cocina","🍓");
 else if(p.plan==="pelicula")weekly=idea("Nuestra película, nuestra historia","Elegí dos películas disponibles para ambos y preguntale cuál le gustaría ver. Prepará el espacio y compartí por qué una escena te recuerda a ustedes.","pelicula","🎬");
 else if(p.plan==="paseo"||p.plan==="salida")weekly=idea("Una cita cortita con recuerdo","Proponele dos recorridos gratuitos y breves cerca de casa. Elijan uno y, durante el paseo, compartan un recuerdo feliz de ustedes.","paseo","🌿");
 else if(p.objetivo==="equipo")weekly=idea("Somos un equipo de verdad","Elijan una pequeña tarea que esté pendiente. Háganla juntos quince minutos y después cuenten qué apreciaron de cómo colaboró cada uno.","planes","✨");
 else if(p.objetivo==="diversion"||p.plan==="jugar")weekly=idea("Tres pistas para reír","Inventen un juego de adivinar tres anécdotas de ustedes. Dedíquenle quince minutos y guarden la respuesta que más los hizo reír.","humor","🎲");
 else weekly=idea("Un recuerdo que vale guardar","Elijan una foto o recuerdo que ya tengan. Durante quince minutos escriban una frase cada uno sobre por qué ese momento les quedó grabado.","recuerdos","📸");
 if(p.evitar==="actividades_intimas")weekly.body+=" Sin propuestas íntimas.";
 const questions={risas:"¿Qué anécdota nuestra te sigue haciendo reír aunque haya pasado mucho tiempo?",planes:"¿Qué pequeño plan gratuito te haría ilusión concretar este mes?",recuerdos:"¿Cuál es un recuerdo nuestro que te gustaría volver a vivir por cinco minutos?",profundo:"¿Qué gesto mío te hizo sentir cuidado/a esta semana?",curiosidades:"Si hoy tuviéramos diez minutos libres, ¿qué harías primero conmigo?"};
 const game=idea("Una pregunta para conocernos",questions[p.charla]||"¿Qué detalle pequeño te alegró el día y te gustaría volver a compartir?","charla","💬");
 return {hasSignals:Object.keys(p).length>0,signals:Object.keys(p).length,ideas:[first,second,weekly].map(x=>({...x,body:x.body.slice(0,260),title:x.title.slice(0,85)})),game};
}
