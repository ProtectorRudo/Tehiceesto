// Barrera editorial compartida por misiones diarias y semanales.
// Es conservadora: sólo rechaza patrones claramente superficiales. No lee perfiles,
// emociones ni información privada, y tampoco "califica" afecto entre personas.
const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
const shallowPatterns=[
 /\bmenu(?: de juego| de fantasia| imaginario| con nombres)\b/,
 /\bnombres? graciosos?\b/,
 /\b(?:inventa|inventen|arma|armen|propone|propongan)[^.!?]{0,115}\b(?:nombres? (?:graciosos?|inventados?)|apodos?|titulos? absurdos?|premios? inventados?|pistas? para adivinar|adivinanzas?)\b/,
 /\b(?:tres|3) pistas\b/,
 /\bronda de adivinanzas\b/,
 /\b(?:tres|3) preguntas absurdas\b/,
 /\b(?:bocad|comida|merienda)[^.!?]{0,85}\b(?:fantasia|nombres? graciosos?|personaje|imaginario)\b/,
 /\b(?:un|el) torneo de tonterias\b/
];
const connection=/\b(?:admir|agradec|reconoc|valor|cuid|alivi|ayud|escuch|eleg|acompan|descans|tranquil|apoyo|recuerd|histori|import|apreci|detalle real|rato libre|disfrut|algo que le guste|algo que disfruta|gustos? que conoce|una tarea|momento compartido|a su gusto|como le gusta)\w*/;
const partner=/\b(?:pareja|juntos|ambos|ustedes|su historia|compart|para los dos|del otro|la otra persona|le guste|como le gusta|le sirva)\w*/;
export const QUALITY_STANDARD_VERSION="mission-substance-20261116-v3";

export function auditMissionSubstance({slot,title,body}={}){
 const text=norm(title+" "+body),issues=[];
 if(!/^mission_[123]$/.test(String(slot))&&slot!=="weekly_1")return {pass:true,issues};
 if(shallowPatterns.some(pattern=>pattern.test(text)))issues.push("shallow_activity_not_care");
 // La misión semanal debe proponer algo que construya conexión, cuidado o
 // iniciativa; un pasatiempo arbitrario no alcanza para 120 corazones.
 if(slot==="weekly_1"){
  if(!connection.test(text))issues.push("weekly_without_relationship_value");
  if(!partner.test(text))issues.push("weekly_without_other_person");
 }
 return {pass:issues.length===0,issues};
}
export function isClearlyWeakMission(activity){
 return !auditMissionSubstance(activity).pass;
}
