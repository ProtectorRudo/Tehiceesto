// Opciones cerradas: solo estas necesidades autorizadas pueden generar pistas.
export const DAILY_MOODS=Object.freeze([
 {key:"feliz",emoji:"😊",label:"Feliz"},
 {key:"calma",emoji:"😌",label:"En calma"},
 {key:"cansancio",emoji:"🥱",label:"Cansado/a"},
 {key:"preocupacion",emoji:"😟",label:"Preocupado/a"},
 {key:"tristeza",emoji:"😢",label:"Triste"},
 {key:"angustia",emoji:"😣",label:"Angustiado/a"},
 {key:"estres",emoji:"😤",label:"Estresado/a"},
 {key:"carino",emoji:"🥰",label:"Con cariño"}
]);
export const CARE_NEEDS=Object.freeze([
 {key:"abrazo",emoji:"🫂",label:"Un abrazo"},
 {key:"escucha",emoji:"👂",label:"Que me escuchen"},
 {key:"descanso",emoji:"🛋️",label:"Un rato tranquilo"},
 {key:"detalle",emoji:"✨",label:"Una sorpresa"},
 {key:"espacio",emoji:"🤍",label:"Algo de espacio"}
]);
const CARE_IDEAS=Object.freeze({
 abrazo:"Acercate con cariño y preguntale si le gustaría recibir un abrazo. Respetá la respuesta.",
 escucha:"Buscá un momento sin pantallas. Ofrecete a escuchar sin interrumpir ni intentar resolver todo.",
 descanso:"Ofrecete a hacerte cargo de alguna tarea y proponé un rato sin exigencias para descansar.",
 detalle:"Prepará un gesto pequeño basado en algo que sabés que le gusta, sin esperar nada a cambio.",
 espacio:"Hacéle saber que estás disponible y respetá su deseo de tener un momento para sí."
});
export function validMood(key){return DAILY_MOODS.some(item=>item.key===key)}
export function validCareNeed(key){return CARE_NEEDS.some(item=>item.key===key)}
export function careSuggestion(key){return Object.hasOwn(CARE_IDEAS,key)?CARE_IDEAS[key]:null}
export function moodLabel(key){return DAILY_MOODS.find(item=>item.key===key)?.label||""}
export function careNeedLabel(key){return CARE_NEEDS.find(item=>item.key===key)?.label||""}
