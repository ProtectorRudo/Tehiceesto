// Auditoría de misiones Cómplices. Es una pauta editorial verificable, no "entrenar" pesos del modelo.
// No evalúa ni revela respuestas privadas del otro: recibe solamente códigos autorizados.
import {safeProfile} from "./ai-profile.mjs";

const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
const isAction=s=>/\b(prepara|preparen|hace|hagan|escribi|escriban|dejale|dejen|elegi|elijan|propone|propongan|invita|inviten|comparti|compartan|arma|armen|busca|busquen|recorda|recuerden|contale|cuenten|pensa|piensen|preguntale|pregunten|recrea|recreen|organiza|organicen|escucha|escuchen|mostrale|muestren|pone|pongan|regalale|crea|creen|dibuja|dibujen|guarda|guarden|acompana|acompanen|anota|anoten|mandale|manda|ofrece|ayuda|ayudale|dediquen|dedica)\b/.test(s);
const platitudes=/\b(hagan algo lindo|hac[eé] algo lindo|ded[ií]quense amor|p[aá]senla bien|amen m[aá]s|sean felices|disfruten juntos|valor[aá] a tu pareja|demostr[aá] tu amor|fortalece la relaci[oó]n|manten[eé] viva la llama|sorprend[eé] con algo especial|h[aá]ganse sentir especiales|compartan un momento especial|conect[aá] con tu pareja)\b/i;
const overEffort=/\b(toda la noche|todo el dia|todo el fin de semana|viaje largo|viajar todo el dia|dos dias|reservar hotel|organizar una fiesta|una cena de cinco pasos|comprar regalos costosos|escapada de fin de semana|pasar horas|ir al aeropuerto|volar a|planear unas vacaciones)\b/;
const personalMap={
 afecto:{palabras:/\b(nota|mensaje|palabras|escrib|decir|frase|carta|agrade|admir|contale|reconoc|decile)\w*/,tiempo:/\b(rato|tiempo|sin pantallas|minutos|juntos|escuch|charla)\w*/,detalles:/\b(detalle|nota|sorpresa|prepara|dejale|gesto)\w*/,ayuda:/\b(ayuda|alivia|tarea|pendiente|hacete cargo|resol|acompa)\w*/,contacto:/\b(abraz|tomar la mano|caricia|mimo|preguntar|contacto)\w*/},
 detalle:{chocolate:/\b(chocolate|cacao|dulce)\w*/,flores:/\b(flor|planta|jardin|hoja)\w*/,cafe:/\b(cafe|taza)\w*/,mate:/\b(mate|ceb[aá]r|termo)\w*/,nota:/\b(nota|mensaje|papel|carta|frase)\w*/,comida:/\b(comida|merienda|cocin|receta|desayuno|bocado)\w*/,sin_regalos:/\b(sin gastar|sin comprar|gratuito|nota|tiempo|ayuda|escuchar)\w*/},
 plan:{paseo:/\b(paseo|camina|vuelta|plaza|parque|recorrido|aire libre)\w*/,cocinar:/\b(cocin|receta|ingrediente|prepara|merienda|comida|horno)\w*/,pelicula:/\b(pelicula|serie|capitulo|escena|cine|pantalla)\w*/,charlar:/\b(convers|charla|pregunta|escuch|habla)\w*/,jugar:/\b(juego|jugar|adivina|pista|reir|reto|divert)\w*/,salida:/\b(salida|paseo|lugar|plaza|cafe|recorrido|camina)\w*/,descanso:/\b(descanso|pausa|tranquil|rato|descans|relaja)\w*/},
 charla:{risas:/\b(risa|gracios|divert|chiste|humor|reir|anecdota)\w*/,planes:/\b(plan|futuro|sueno|proximo|viaje|deseo)\w*/,recuerdos:/\b(recuerdo|foto|anecdota|esa vez|historia)\w*/,profundo:/\b(sent|necesit|escuch|acompan|agradec|admir)\w*/,curiosidades:/\b(pregunta|imagin|si pudieras|curios|adivin)\w*/},
 objetivo:{diversion:/\b(jugar|risa|divert|juego|chiste|sorpresa)\w*/,romance:/\b(carino|romant|detalle|nota|admir|recuerdo|mensaje)\w*/,conversacion:/\b(charla|convers|escuch|pregunt|habla)\w*/,equipo:/\b(juntos|equipo|ayuda|repart|colabor|acompan)\w*/,sorpresas:/\b(sorpresa|nota|dejale|regalale|detalle)\w*/,rutina:/\b(nuevo|distinto|cambia|variar|primera vez|otra forma)\w*/}
};
function anchorsFor(profile,slot){
 const p=safeProfile(profile);
 const keys=slot==="game_1"?["charla","plan","objetivo"]:["detalle","plan","afecto","objetivo"];
 return keys.flatMap(k=>personalMap[k]?.[p[k]]?[personalMap[k][p[k]]]:[]);
}
export function evaluateMission({title,body,slot,partnerProfile={},recentTitles=[]}={}){
 const safeTitle=String(title||"").trim(),safeBody=String(body||"").trim(),joined=normalize(safeTitle+" "+safeBody);
 const issues=[];
 if(safeTitle.length<4||safeTitle.length>85||safeBody.length<22||safeBody.length>260)issues.push("length");
 if(!isAction(joined) && slot!=="game_1")issues.push("no_clear_action");
 if(platitudes.test(joined))issues.push("platitude");
 if(overEffort.test(joined))issues.push("too_difficult");
 if(/\b(pedir permiso|sin consentimiento|sin preguntar)\b/.test(joined)&&/\b(abraz|toca|besa)\w*/.test(joined))issues.push("contact_without_consent");
 if(slot==="game_1"&&!safeBody.includes("?"))issues.push("not_a_question");
 const anchors=anchorsFor(partnerProfile,slot),personalized=anchors.length>0;
 if(personalized&&!anchors.some(re=>re.test(joined)))issues.push("no_approved_taste_anchor");
 const normalizedTitle=normalize(safeTitle);
 if(recentTitles.some(p=>normalize(p)===normalizedTitle))issues.push("repeated");
 // Un verbo realizable más un detalle reconocible cuentan más que promesas abstractas.
 const concrete=/\b(nota|papel|mensaje|foto|cafe|mate|taza|receta|ingrediente|plaza|paseo|camin|pelicula|escena|cancion|risa|anecdota|recuerdo|pregunta|minutos|rato|carta|lista|capitulo|tarea|cocina|sobre|desayuno|merienda|juego|voz)\w*/.test(joined);
 if(slot!=="game_1"&&!concrete)issues.push("no_concrete_detail");
 return {pass:issues.length===0,score:Math.max(0,10-issues.length*3+(personalized&&anchors.some(re=>re.test(joined))?1:0)),issues,personalized};
}
export const MISSION_EDITORIAL_RULES=Object.freeze({
 dailyMinutes:"5 a 15",
 weeklyMinutes:"15 a 45",
 cost:"gratis salvo que la persona haya permitido otra cosa, siempre priorizar lo que ya hay en casa",
 meaning:"que el otro se sienta conocido, escuchado o recordado, no que complete una tarea",
 personal:"anclar ideas solo en gustos codificados autorizados por la otra persona; sin simular saber secretos",
 variation:"no repetir el mismo gesto con distinto título; alternar sorpresa, atención, juego, recuerdo y gesto de ayuda",
});
export const MISSION_EXAMPLES=[
 {bad:"Hagan algo lindo y demuéstrense amor.",good:"Si tu pareja autorizó que disfruta el mate, cebale uno a su gusto y dejá debajo una nota: «Me encanta este ratito con vos». Cinco minutos, sin gastar."},
 {bad:"Sorprendé con un regalo inolvidable.",good:"Si autorizó que le gustan los recuerdos, elegí una foto de un día compartido. Mostrásela y contale qué pequeño detalle de ese día todavía recordás."},
 {bad:"Disfruten de tiempo de calidad.",good:"Si autorizó que prefiere planes tranquilos, ofrecé diez minutos sin pantallas con una pregunta concreta: «¿Qué fue lo mejor de tu día y por qué?»"}
];
