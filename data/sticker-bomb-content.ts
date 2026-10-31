/** Contenido original del modelo Sticker Bomb v2, congelado como fuente de verdad. */
export const stickerBombDefaults = {
 recipient:"Luli",sender:"Cami",relationship:"Amistad de esas que no se consiguen dos veces",date:"Desde ese primer día",
 coverText:"Armamos un expediente con chistes internos, confesiones, recuerdos y esas cosas que solo vos y yo entendemos.",
 notes:{
  confidente:["¿Tenés un minuto? (Spoiler: eran 47).","Mi terapia favorita siempre empieza con: ‘No sabés lo que pasó’. ","Un consejo tuyo me calma. Otro me mete en un problema mucho más entretenido.","Gracias por escuchar hasta cuando ni yo me entiendo."],
  familia:["No compartimos apellido, pero sí un montón de historias.","Sos de esas personas que ya vienen incluidas en mis planes importantes.","Hay gente que elegís una vez… y después la volvés a elegir siempre."],
  memes:["Ese meme que mandamos a las 3:17 de la mañana.","Cuando nos reímos de algo que a nadie más le causaría gracia.","Un sticker nuestro dice más que tres párrafos de explicación."],
  audios:["Audio de 00:07: ‘Te cuento algo rapidito…’","Audio de 08:42: ‘Bueno, la cosa empezó así…’","Audio de 13:06: ‘Y todavía falta lo mejor.’","Nunca son cortos. Siempre valen la pena."],
  plans:["Salir ‘solo un ratito’.","Comer algo rápido y volver temprano.","Comprar algo que no necesitábamos.","Terminar diciendo: ‘Esto no se lo contemos a nadie’."],
  rescue:["Cuando no tuve fuerzas, estuviste.","Cuando no supe qué hacer, me escuchaste.","Y cuando todo parecía demasiado, hiciste que no tuviera que atravesarlo en soledad."],
  chaos:["Ser responsables por cinco minutos.","No reírnos en una situación seria.","Tomar una decisión normal.","Volver a hacerlo todo de nuevo, pero juntos."],
  moments:["Ese día en el que nos reímos hasta llorar.","La aventura que todavía no superamos.","Los momentos comunes que se volvieron inolvidables."],
  code:["— Che, tengo un plan.","— Por favor, decime que es un buen plan.","— No prometo nada.","— Bueno, ¿a qué hora?"],
  time:["A veces pasan días sin vernos.","A veces nos hablamos con un solo meme.","Pero cuando volvemos a encontrarnos, es como si no hubiera pasado nada."]
 },
 future:["Ese viaje pendiente", "Un café que dure cinco horas", "Una aventura completamente improvisada", "Reírnos de esto dentro de veinte años"],
 finalLetter:["No sé en qué momento dejaste de ser solamente una amistad y te convertiste en parte de mi casa, de mis historias y de quien soy.","Gracias por las risas absurdas, los consejos sinceros, los silencios cómodos y las veces que apareciste incluso sin que te lo pidiera.","Ojalá nos queden mil planes improvisados, otras tantas historias que nadie nos crea y una vida entera para seguir eligiéndonos.","Te quiero muchísimo. Y sí: seguís siendo mi persona favorita para hacer planes que se nos van de las manos."],
 photos:[],audioUrls:[]
} as const;
export const stickerBombChapters = [
 {id:'confidente',label:'Psicóloga gratis',art:'confidente',color:'#ffc2da',type:'chat',title:'Atención psicológica',subtitle:'Servicio gratuito. Paciencia no incluida.'},
 {id:'familia',label:'Familia elegida',art:'familia',color:'#f7cee4',type:'slides',title:'El parentesco que inventamos',subtitle:'Nuestro árbol genealógico tiene memes.'},
 {id:'memes',label:'Meme dealer',art:'meme',color:'#d7c5f1',type:'slides',title:'Nuestro idioma oficial',subtitle:'Nivel de comunicación: sticker sin contexto.'},
 {id:'audios',label:'Audios eternos',art:'audios',color:'#ffe6a2',type:'audio',title:'Notas de voz infinitas',subtitle:'Nunca es “te cuento algo rápido”.'},
 {id:'plans',label:'Plan B oficial',art:'plan',color:'#e2c7fa',type:'plans',title:'El departamento de ideas',subtitle:'Por favor, no pongas esto en acta.'},
 {id:'rescue',label:'Rescatista emocional',art:'rescate',color:'#bce9cd',type:'hold',title:'La parte que no digo tanto',subtitle:'Esta vez no hay chiste. Solo verdad.'},
 {id:'chaos',label:'Partner del caos',art:'caos',color:'#d4baf6',type:'notes',title:'Acta de malas decisiones',subtitle:'La acusación tiene pruebas.'},
 {id:'moments',label:'Momentos épicos',symbol:'▣',symbolType:'polaroid',color:'#ffd9b1',type:'photo',title:'La galería del delito',subtitle:'Material que jamás debería salir de acá.'},
 {id:'code',label:'Nuestro idioma',symbol:'☏',symbolType:'mint',color:'#bfe2df',type:'chat',title:'Traducción simultánea',subtitle:'Conversaciones que solo nosotros entendemos.'},
 {id:'time',label:'A prueba de tiempo',symbol:'∞',symbolType:'blue',color:'#cbd6f5',type:'scratch',title:'Aunque pase el tiempo',subtitle:'Algunas cosas no cambian.'},
 {id:'future',label:'Lo que nos falta',symbol:'✈',symbolType:'gold',color:'#ffe6a2',type:'future',title:'Todavía nos debemos…',subtitle:'Lista de cosas que sí o sí vamos a hacer.'},
 {id:'letter',label:'Para vos ♡',symbol:'✉',symbolType:'black',color:'#f9c6d5',type:'letter',title:'Algo que te tenía que decir',subtitle:'Advertencia: posible lagrimita.'}
] as const;
export const stickerBombNoteKeys = ["confidente","familia","memes","audios","plans","rescue","chaos","moments","code","time"] as const;
