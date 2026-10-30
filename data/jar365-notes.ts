/** Public demo defaults, original everyday language. Buyer notes live in private jar365_notes table. */
export const JAR365_CATEGORIES = [
  {
    "key": "detalles",
    "label": "Lo que me gusta de vos",
    "color": "#EFB8C2"
  },
  {
    "key": "admiro",
    "label": "Lo que admiro",
    "color": "#CDBDDF"
  },
  {
    "key": "gracias",
    "label": "Gracias por",
    "color": "#F2DCAC"
  },
  {
    "key": "cotidiano",
    "label": "Los días comunes",
    "color": "#C9E1CE"
  },
  {
    "key": "promesas",
    "label": "Lo que quiero cuidar",
    "color": "#BDD6E7"
  },
  {
    "key": "planes",
    "label": "Cosas por hacer",
    "color": "#E8C8AD"
  },
  {
    "key": "suenos",
    "label": "Lo que imagino",
    "color": "#D5D2E8"
  },
  {
    "key": "recuerdos",
    "label": "Lo que queda",
    "color": "#EAC4C6"
  },
  {
    "key": "regalos",
    "label": "Pequeños vales",
    "color": "#D5E0B8"
  },
  {
    "key": "confesiones",
    "label": "Cosas que te quiero decir",
    "color": "#F2C9AD"
  }
] as const;
export type Jar365Category = (typeof JAR365_CATEGORIES)[number]["key"];
export type Jar365Note = {position:number;category:Jar365Category;message:string};
export const JAR365_SEED:Jar365Note[] = [
  {
    "position": 1,
    "category": "detalles",
    "message": "Me gusta cómo se te nota cuando algo te entusiasma."
  },
  {
    "position": 2,
    "category": "admiro",
    "message": "Admiro que sigas intentando incluso cuando algo se complica."
  },
  {
    "position": 3,
    "category": "gracias",
    "message": "Gracias por escucharme incluso cuando me cuesta explicar algo."
  },
  {
    "position": 4,
    "category": "cotidiano",
    "message": "Con vos hasta ir a comprar algo puede ser un buen plan."
  },
  {
    "position": 5,
    "category": "promesas",
    "message": "Prometo escucharte antes de sacar conclusiones."
  },
  {
    "position": 6,
    "category": "planes",
    "message": "Nos debemos una salida sin mirar el teléfono."
  },
  {
    "position": 7,
    "category": "suenos",
    "message": "Me ilusiona pensar en todas las cosas que todavía podemos aprender juntos."
  },
  {
    "position": 8,
    "category": "recuerdos",
    "message": "Quiero guardar más momentos en los que nos reímos sin parar."
  },
  {
    "position": 9,
    "category": "regalos",
    "message": "Vale por un desayuno preparado por mí."
  },
  {
    "position": 10,
    "category": "confesiones",
    "message": "A veces me quedo pensando en algo que dijiste."
  },
  {
    "position": 11,
    "category": "detalles",
    "message": "Me encanta que tengas tus propias maneras de hacer las cosas."
  },
  {
    "position": 12,
    "category": "admiro",
    "message": "Admiro que tengas paciencia con lo que te importa."
  },
  {
    "position": 13,
    "category": "gracias",
    "message": "Gracias por las veces que me hiciste reír sin proponértelo."
  },
  {
    "position": 14,
    "category": "cotidiano",
    "message": "Me gusta que podamos hablar de cualquier pavada."
  },
  {
    "position": 15,
    "category": "promesas",
    "message": "Quiero aprender a pedir perdón mejor."
  },
  {
    "position": 16,
    "category": "planes",
    "message": "Quiero llevarte a probar algo rico que todavía no conocemos."
  },
  {
    "position": 17,
    "category": "suenos",
    "message": "Me gusta imaginar cómo vamos a recordar este momento dentro de unos años."
  },
  {
    "position": 18,
    "category": "recuerdos",
    "message": "Hay conversaciones con vos que me quedo pensando después."
  },
  {
    "position": 19,
    "category": "regalos",
    "message": "Vale por elegir la película sin negociar."
  },
  {
    "position": 20,
    "category": "confesiones",
    "message": "Me importa más de lo que digo que estés bien."
  },
  {
    "position": 21,
    "category": "detalles",
    "message": "Me gusta escucharte contar algo que te pasó."
  },
  {
    "position": 22,
    "category": "admiro",
    "message": "Admiro que reconozcas cuando te equivocás."
  },
  {
    "position": 23,
    "category": "gracias",
    "message": "Gracias por compartir conmigo días normales."
  },
  {
    "position": 24,
    "category": "cotidiano",
    "message": "Hay días en los que solo quiero sentarme un rato a tu lado."
  },
  {
    "position": 25,
    "category": "promesas",
    "message": "Prometo no dar por sentado el tiempo que compartimos."
  },
  {
    "position": 26,
    "category": "planes",
    "message": "Nos debemos un paseo sin un destino demasiado claro."
  },
  {
    "position": 27,
    "category": "suenos",
    "message": "Quiero que tus metas tengan un lugar en nuestros planes."
  },
  {
    "position": 28,
    "category": "recuerdos",
    "message": "Me acuerdo de lo lindo que es verte disfrutar de algo."
  },
  {
    "position": 29,
    "category": "regalos",
    "message": "Vale por una caminata a donde vos quieras."
  },
  {
    "position": 30,
    "category": "confesiones",
    "message": "Hay días en los que te extraño antes de irme."
  },
  {
    "position": 31,
    "category": "detalles",
    "message": "Me gusta cuando te reís antes de terminar un chiste."
  },
  {
    "position": 32,
    "category": "admiro",
    "message": "Admiro tu capacidad de aprender cosas nuevas."
  },
  {
    "position": 33,
    "category": "gracias",
    "message": "Gracias por preguntarme cómo estoy y escuchar la respuesta."
  },
  {
    "position": 34,
    "category": "cotidiano",
    "message": "Me gusta compartir la mesa con vos."
  },
  {
    "position": 35,
    "category": "promesas",
    "message": "Quiero estar presente cuando me cuentes algo importante."
  },
  {
    "position": 36,
    "category": "planes",
    "message": "Quiero planear una tarde entera alrededor de algo que te guste."
  },
  {
    "position": 37,
    "category": "suenos",
    "message": "Sueño con seguir eligiendo la vida que nos haga bien."
  },
  {
    "position": 38,
    "category": "recuerdos",
    "message": "No quiero olvidar la sensación de una tarde que salió bien."
  },
  {
    "position": 39,
    "category": "regalos",
    "message": "Vale por una merienda con algo que te guste."
  },
  {
    "position": 40,
    "category": "confesiones",
    "message": "Me alegra saber que puedo contarte una buena noticia."
  },
  {
    "position": 41,
    "category": "detalles",
    "message": "Me gusta que puedas alegrarte por cosas simples."
  },
  {
    "position": 42,
    "category": "admiro",
    "message": "Admiro que sepas pedir ayuda cuando la necesitás."
  },
  {
    "position": 43,
    "category": "gracias",
    "message": "Gracias por dejarme conocer partes nuevas de vos."
  },
  {
    "position": 44,
    "category": "cotidiano",
    "message": "A veces lo mejor del día es contártelo al final."
  },
  {
    "position": 45,
    "category": "promesas",
    "message": "Prometo respetar cuando necesites tu espacio."
  },
  {
    "position": 46,
    "category": "planes",
    "message": "Nos debemos una noche de películas elegidas a medias."
  },
  {
    "position": 47,
    "category": "suenos",
    "message": "Me gustaría que nos animemos a nuevos comienzos cuando haga falta."
  },
  {
    "position": 48,
    "category": "recuerdos",
    "message": "Me gusta mirar atrás y notar cuánto aprendimos."
  },
  {
    "position": 49,
    "category": "regalos",
    "message": "Vale por un abrazo largo, sin apuro."
  },
  {
    "position": 50,
    "category": "confesiones",
    "message": "A veces me hacés reír cuando no tenía ganas."
  },
  {
    "position": 51,
    "category": "detalles",
    "message": "Me encanta tu cara cuando algo te sale bien."
  },
  {
    "position": 52,
    "category": "admiro",
    "message": "Admiro el esfuerzo que hacés aunque nadie lo vea."
  },
  {
    "position": 53,
    "category": "gracias",
    "message": "Gracias por tenerme paciencia cuando la necesito."
  },
  {
    "position": 54,
    "category": "cotidiano",
    "message": "Me gusta cuando un plan cambia y lo resolvemos juntos."
  },
  {
    "position": 55,
    "category": "promesas",
    "message": "Quiero seguir preguntándote qué necesitás."
  },
  {
    "position": 56,
    "category": "planes",
    "message": "Quiero que hagamos una lista de lugares para conocer."
  },
  {
    "position": 57,
    "category": "suenos",
    "message": "Quiero que no perdamos la curiosidad por el mundo."
  },
  {
    "position": 58,
    "category": "recuerdos",
    "message": "Hay detalles tuyos que se me quedan grabados sin querer."
  },
  {
    "position": 59,
    "category": "regalos",
    "message": "Vale por una cena hecha en casa."
  },
  {
    "position": 60,
    "category": "confesiones",
    "message": "Me gusta cuando confiás en mí para contarme algo."
  },
  {
    "position": 61,
    "category": "detalles",
    "message": "Me gusta cómo encontrás detalles que yo ni había visto."
  },
  {
    "position": 62,
    "category": "admiro",
    "message": "Admiro la forma en que tratás de hacer las cosas bien."
  },
  {
    "position": 63,
    "category": "gracias",
    "message": "Gracias por cada conversación que se nos hizo larga."
  },
  {
    "position": 64,
    "category": "cotidiano",
    "message": "Me encanta cuando nos reímos de algo que nadie más entendería."
  },
  {
    "position": 65,
    "category": "promesas",
    "message": "Prometo hablar las cosas antes de dejar que se acumulen."
  },
  {
    "position": 66,
    "category": "planes",
    "message": "Nos debemos un desayuno preparado con tiempo."
  },
  {
    "position": 67,
    "category": "suenos",
    "message": "Me gusta pensar en viajes posibles, sin necesidad de ir tan lejos."
  },
  {
    "position": 68,
    "category": "recuerdos",
    "message": "Me encanta cuando una canción me hace pensar en vos."
  },
  {
    "position": 69,
    "category": "regalos",
    "message": "Vale por una salida sorpresa sencilla."
  },
  {
    "position": 70,
    "category": "confesiones",
    "message": "A veces pienso «esto le gustaría» cuando veo cualquier cosa."
  },
  {
    "position": 71,
    "category": "detalles",
    "message": "Me gusta que tengas opiniones propias, incluso cuando no coincidimos."
  },
  {
    "position": 72,
    "category": "admiro",
    "message": "Admiro que tengas el coraje de probar."
  },
  {
    "position": 73,
    "category": "gracias",
    "message": "Gracias por hacerme un lugar en tus planes."
  },
  {
    "position": 74,
    "category": "cotidiano",
    "message": "Quiero seguir teniendo tiempo para hacer nada con vos."
  },
  {
    "position": 75,
    "category": "promesas",
    "message": "Quiero elegir la calma antes que una respuesta impulsiva."
  },
  {
    "position": 76,
    "category": "planes",
    "message": "Quiero aprender a cocinar algo que te encante."
  },
  {
    "position": 77,
    "category": "suenos",
    "message": "Me ilusiona ver qué cosas nuevas te van a entusiasmar."
  },
  {
    "position": 78,
    "category": "recuerdos",
    "message": "Quiero acordarme de las veces que nos acompañamos."
  },
  {
    "position": 79,
    "category": "regalos",
    "message": "Vale por elegir la música del viaje."
  },
  {
    "position": 80,
    "category": "confesiones",
    "message": "Me gusta cuando no tenemos que hacernos los interesantes."
  },
  {
    "position": 81,
    "category": "detalles",
    "message": "Me gusta cómo cambiás de tema cuando te acordás de algo importante."
  },
  {
    "position": 82,
    "category": "admiro",
    "message": "Admiro que no te rindas a la primera."
  },
  {
    "position": 83,
    "category": "gracias",
    "message": "Gracias por decirme las cosas de frente."
  },
  {
    "position": 84,
    "category": "cotidiano",
    "message": "Me gusta escuchar tu voz en medio de un día largo."
  },
  {
    "position": 85,
    "category": "promesas",
    "message": "Prometo no minimizar lo que te preocupa."
  },
  {
    "position": 86,
    "category": "planes",
    "message": "Nos debemos una foto que no salga perfecta y nos guste igual."
  },
  {
    "position": 87,
    "category": "suenos",
    "message": "Quiero que sigamos cambiando sin dejar de conocernos."
  },
  {
    "position": 88,
    "category": "recuerdos",
    "message": "Hay días simples que terminan siendo recuerdos importantes."
  },
  {
    "position": 89,
    "category": "regalos",
    "message": "Vale por una tarde sin tareas pendientes, en lo posible."
  },
  {
    "position": 90,
    "category": "confesiones",
    "message": "Me hace feliz que podamos hablar sin preparar un discurso."
  },
  {
    "position": 91,
    "category": "detalles",
    "message": "Me encanta descubrir gustos tuyos que todavía no conocía."
  },
  {
    "position": 92,
    "category": "admiro",
    "message": "Admiro tu capacidad de escuchar sin querer ganar una discusión."
  },
  {
    "position": 93,
    "category": "gracias",
    "message": "Gracias por mostrarme otra manera de mirar algo."
  },
  {
    "position": 94,
    "category": "cotidiano",
    "message": "A veces pienso en algo y lo primero que quiero es contártelo."
  },
  {
    "position": 95,
    "category": "promesas",
    "message": "Quiero festejar tus logros sin compararlos con nada."
  },
  {
    "position": 96,
    "category": "planes",
    "message": "Quiero que vayamos a ver un atardecer con calma."
  },
  {
    "position": 97,
    "category": "suenos",
    "message": "Sueño con un montón de días en los que nos riamos mucho."
  },
  {
    "position": 98,
    "category": "recuerdos",
    "message": "Me gusta cuando recordamos algo y cada uno cuenta otra versión."
  },
  {
    "position": 99,
    "category": "regalos",
    "message": "Vale por una carta escrita a mano."
  },
  {
    "position": 100,
    "category": "confesiones",
    "message": "A veces una charla con vos me ordena la cabeza."
  },
  {
    "position": 101,
    "category": "detalles",
    "message": "Me gusta cómo le ponés ganas a las cosas que querés."
  },
  {
    "position": 102,
    "category": "admiro",
    "message": "Admiro que puedas volver a empezar."
  },
  {
    "position": 103,
    "category": "gracias",
    "message": "Gracias por compartir tus buenas noticias conmigo."
  },
  {
    "position": 104,
    "category": "cotidiano",
    "message": "Me gusta compartir decisiones pequeñas con vos."
  },
  {
    "position": 105,
    "category": "promesas",
    "message": "Prometo hacerme cargo cuando me equivoque."
  },
  {
    "position": 106,
    "category": "planes",
    "message": "Nos debemos una escapada, aunque sea cerca."
  },
  {
    "position": 107,
    "category": "suenos",
    "message": "Me gustaría que tengamos tiempo para eso que siempre dejamos para después."
  },
  {
    "position": 108,
    "category": "recuerdos",
    "message": "Quiero que sigamos juntando anécdotas que nos den risa."
  },
  {
    "position": 109,
    "category": "regalos",
    "message": "Vale por una noche de juegos."
  },
  {
    "position": 110,
    "category": "confesiones",
    "message": "Me gusta que me conozcas incluso en mis días raros."
  },
  {
    "position": 111,
    "category": "detalles",
    "message": "Me gusta que puedas disfrutar una tarde tranquila."
  },
  {
    "position": 112,
    "category": "admiro",
    "message": "Admiro que busques entender antes de juzgar."
  },
  {
    "position": 113,
    "category": "gracias",
    "message": "Gracias por confiarme lo que te preocupa."
  },
  {
    "position": 114,
    "category": "cotidiano",
    "message": "Una charla con vos puede mejorarme una tarde."
  },
  {
    "position": 115,
    "category": "promesas",
    "message": "Quiero seguir aprendiendo a acompañarte."
  },
  {
    "position": 116,
    "category": "planes",
    "message": "Quiero que inventemos una tradición nuestra."
  },
  {
    "position": 117,
    "category": "suenos",
    "message": "Quiero ver cómo se van convirtiendo tus ideas en proyectos."
  },
  {
    "position": 118,
    "category": "recuerdos",
    "message": "Algunas de mis conversaciones favoritas fueron con vos."
  },
  {
    "position": 119,
    "category": "regalos",
    "message": "Vale por tu postre favorito."
  },
  {
    "position": 120,
    "category": "confesiones",
    "message": "Hay momentos en los que no necesito ningún plan, solo verte."
  },
  {
    "position": 121,
    "category": "detalles",
    "message": "Me encanta cuando hablás de algo que te apasiona."
  },
  {
    "position": 122,
    "category": "admiro",
    "message": "Admiro tu manera de resolver problemas cotidianos."
  },
  {
    "position": 123,
    "category": "gracias",
    "message": "Gracias por los silencios que no resultan incómodos."
  },
  {
    "position": 124,
    "category": "cotidiano",
    "message": "Quiero seguir encontrándonos en medio de la rutina."
  },
  {
    "position": 125,
    "category": "promesas",
    "message": "Prometo cuidar nuestras conversaciones difíciles."
  },
  {
    "position": 126,
    "category": "planes",
    "message": "Nos debemos un día de hacer planes sin obligación de cumplirlos todos."
  },
  {
    "position": 127,
    "category": "suenos",
    "message": "Me ilusiona pensar en la cantidad de conversaciones que nos esperan."
  },
  {
    "position": 128,
    "category": "recuerdos",
    "message": "Me gusta pensar en todo lo que fuimos descubriendo."
  },
  {
    "position": 129,
    "category": "regalos",
    "message": "Vale por un masaje de hombros."
  },
  {
    "position": 130,
    "category": "confesiones",
    "message": "Me hace bien saber que podemos volver a intentarlo."
  },
  {
    "position": 131,
    "category": "detalles",
    "message": "Me gusta la forma en que escuchás a otras personas."
  },
  {
    "position": 132,
    "category": "admiro",
    "message": "Admiro que tengas proyectos propios."
  },
  {
    "position": 133,
    "category": "gracias",
    "message": "Gracias por acompañarme en cosas chiquitas."
  },
  {
    "position": 134,
    "category": "cotidiano",
    "message": "Me gusta la calma de no tener que inventar un plan enorme."
  },
  {
    "position": 135,
    "category": "promesas",
    "message": "Quiero dejar más lugar para tus ideas."
  },
  {
    "position": 136,
    "category": "planes",
    "message": "Quiero salir a caminar y escuchar cómo venís."
  },
  {
    "position": 137,
    "category": "suenos",
    "message": "Quiero que podamos celebrar metas que hoy parecen lejanas."
  },
  {
    "position": 138,
    "category": "recuerdos",
    "message": "Hay imágenes pequeñas que me hacen sonreír después."
  },
  {
    "position": 139,
    "category": "regalos",
    "message": "Vale por una tarde de fotos y recuerdos."
  },
  {
    "position": 140,
    "category": "confesiones",
    "message": "A veces no te digo lo suficiente cuánto valoro lo que hacés."
  },
  {
    "position": 141,
    "category": "detalles",
    "message": "Me gusta que no seas igual a nadie."
  },
  {
    "position": 142,
    "category": "admiro",
    "message": "Admiro tu sensibilidad, incluso cuando la vida exige dureza."
  },
  {
    "position": 143,
    "category": "gracias",
    "message": "Gracias por las veces que te acordaste de mí."
  },
  {
    "position": 144,
    "category": "cotidiano",
    "message": "Me gusta que haya lugar para estar cansados sin fingir."
  },
  {
    "position": 145,
    "category": "promesas",
    "message": "Prometo decirte la verdad con cariño."
  },
  {
    "position": 146,
    "category": "planes",
    "message": "Nos debemos una cena hecha entre los dos."
  },
  {
    "position": 147,
    "category": "suenos",
    "message": "Sueño con construir una rutina que nos guste vivir."
  },
  {
    "position": 148,
    "category": "recuerdos",
    "message": "Quiero recordar que también hubo días difíciles y los atravesamos."
  },
  {
    "position": 149,
    "category": "regalos",
    "message": "Vale por una charla sin celulares."
  },
  {
    "position": 150,
    "category": "confesiones",
    "message": "Me gusta sentir que podemos ser honestos sin lastimarnos."
  },
  {
    "position": 151,
    "category": "detalles",
    "message": "Me encanta que me compartas tus canciones favoritas."
  },
  {
    "position": 152,
    "category": "admiro",
    "message": "Admiro que cuides a quienes querés."
  },
  {
    "position": 153,
    "category": "gracias",
    "message": "Gracias por tu sinceridad, aunque a veces cueste."
  },
  {
    "position": 154,
    "category": "cotidiano",
    "message": "Me encanta cuando nos sorprendemos con un desayuno rico."
  },
  {
    "position": 155,
    "category": "promesas",
    "message": "Quiero cuidar nuestros ratos sin distracciones."
  },
  {
    "position": 156,
    "category": "planes",
    "message": "Quiero ir con vos a un lugar que siempre mencionás."
  },
  {
    "position": 157,
    "category": "suenos",
    "message": "Me gustaría que aprendamos algo totalmente nuevo juntos."
  },
  {
    "position": 158,
    "category": "recuerdos",
    "message": "Me hace bien volver a leer un mensaje lindo tuyo."
  },
  {
    "position": 159,
    "category": "regalos",
    "message": "Vale por ir a ver un lugar nuevo."
  },
  {
    "position": 160,
    "category": "confesiones",
    "message": "A veces me descubro sonriendo por un mensaje tuyo."
  },
  {
    "position": 161,
    "category": "detalles",
    "message": "Me gusta cómo se te ocurren soluciones que a mí no se me ocurrirían."
  },
  {
    "position": 162,
    "category": "admiro",
    "message": "Admiro que no finjas estar bien cuando no lo estás."
  },
  {
    "position": 163,
    "category": "gracias",
    "message": "Gracias por estar cuando había poco para festejar."
  },
  {
    "position": 164,
    "category": "cotidiano",
    "message": "Quiero más paseos sin apuro."
  },
  {
    "position": 165,
    "category": "promesas",
    "message": "Prometo no usar tus inseguridades para ganar una discusión."
  },
  {
    "position": 166,
    "category": "planes",
    "message": "Nos debemos una tarde de juegos y risas."
  },
  {
    "position": 167,
    "category": "suenos",
    "message": "Quiero que sigamos haciendo planes incluso en semanas difíciles."
  },
  {
    "position": 168,
    "category": "recuerdos",
    "message": "Hay sonidos y lugares que me hacen acordar a vos."
  },
  {
    "position": 169,
    "category": "regalos",
    "message": "Vale por preparar juntos algo rico."
  },
  {
    "position": 170,
    "category": "confesiones",
    "message": "Me ilusiona un poco cada plan que hacemos."
  },
  {
    "position": 171,
    "category": "detalles",
    "message": "Me encanta verte disfrutar de algo que esperabas."
  },
  {
    "position": 172,
    "category": "admiro",
    "message": "Admiro tu capacidad de entusiasmarte con algo nuevo."
  },
  {
    "position": 173,
    "category": "gracias",
    "message": "Gracias por dejar que nos conozcamos cada vez mejor."
  },
  {
    "position": 174,
    "category": "cotidiano",
    "message": "Me gusta cuando nos quedamos un rato más conversando."
  },
  {
    "position": 175,
    "category": "promesas",
    "message": "Quiero que podamos decirnos que algo duele sin miedo."
  },
  {
    "position": 176,
    "category": "planes",
    "message": "Quiero que armemos una playlist para un viaje."
  },
  {
    "position": 177,
    "category": "suenos",
    "message": "Me ilusiona vernos crecer sin competir entre nosotros."
  },
  {
    "position": 178,
    "category": "recuerdos",
    "message": "Me gusta cuando una foto nos devuelve un momento común."
  },
  {
    "position": 179,
    "category": "regalos",
    "message": "Vale por una noche de película y manta."
  },
  {
    "position": 180,
    "category": "confesiones",
    "message": "A veces me sorprende lo fácil que es reírme con vos."
  },
  {
    "position": 181,
    "category": "detalles",
    "message": "Me gusta tu sentido del humor, incluso cuando es terrible."
  },
  {
    "position": 182,
    "category": "admiro",
    "message": "Admiro que sepas reírte de un mal día."
  },
  {
    "position": 183,
    "category": "gracias",
    "message": "Gracias por abrirme espacio en tu rutina."
  },
  {
    "position": 184,
    "category": "cotidiano",
    "message": "Hasta los trámites son menos pesados con buena compañía."
  },
  {
    "position": 185,
    "category": "promesas",
    "message": "Prometo agradecer más lo cotidiano."
  },
  {
    "position": 186,
    "category": "planes",
    "message": "Nos debemos una visita a ese lugar que siempre postergamos."
  },
  {
    "position": 187,
    "category": "suenos",
    "message": "Quiero que nunca nos falten ganas de empezar algo."
  },
  {
    "position": 188,
    "category": "recuerdos",
    "message": "Quiero quedarme con la manera en que nos tratamos con cariño."
  },
  {
    "position": 189,
    "category": "regalos",
    "message": "Vale por invitarte a tomar algo."
  },
  {
    "position": 190,
    "category": "confesiones",
    "message": "Me importa que tengas espacio para tus cosas."
  },
  {
    "position": 191,
    "category": "detalles",
    "message": "Me gusta tu forma de cuidar lo que te importa."
  },
  {
    "position": 192,
    "category": "admiro",
    "message": "Admiro lo mucho que creciste en cosas que quizá no notás."
  },
  {
    "position": 193,
    "category": "gracias",
    "message": "Gracias por los ratos de risa que no planeamos."
  },
  {
    "position": 194,
    "category": "cotidiano",
    "message": "Me gusta organizar algo simple y esperar a verte."
  },
  {
    "position": 195,
    "category": "promesas",
    "message": "Quiero que mis hechos acompañen lo que digo."
  },
  {
    "position": 196,
    "category": "planes",
    "message": "Quiero que celebremos una buena noticia por pequeña que sea."
  },
  {
    "position": 197,
    "category": "suenos",
    "message": "Sueño con tener más historias para contar."
  },
  {
    "position": 198,
    "category": "recuerdos",
    "message": "Algunas charlas quedan conmigo mucho más tiempo del que imaginás."
  },
  {
    "position": 199,
    "category": "regalos",
    "message": "Vale por un paseo al aire libre."
  },
  {
    "position": 200,
    "category": "confesiones",
    "message": "Hay veces que quisiera frenar un rato para escucharte más."
  },
  {
    "position": 201,
    "category": "detalles",
    "message": "Me encanta cuando me contás una idea nueva."
  },
  {
    "position": 202,
    "category": "admiro",
    "message": "Admiro la confianza que ponés en quienes querés."
  },
  {
    "position": 203,
    "category": "gracias",
    "message": "Gracias por hacer preguntas que me ayudan a pensar."
  },
  {
    "position": 204,
    "category": "cotidiano",
    "message": "Hay días en los que un mate o un café con vos alcanza."
  },
  {
    "position": 205,
    "category": "promesas",
    "message": "Prometo poner atención en los detalles importantes para vos."
  },
  {
    "position": 206,
    "category": "planes",
    "message": "Nos debemos una mañana sin despertador."
  },
  {
    "position": 207,
    "category": "suenos",
    "message": "Me gustaría volver a lugares queridos y verlos distintos."
  },
  {
    "position": 208,
    "category": "recuerdos",
    "message": "Me gusta que podamos inventar nuevos recuerdos sin gastar demasiado."
  },
  {
    "position": 209,
    "category": "regalos",
    "message": "Vale por elegir qué hacemos este fin de semana."
  },
  {
    "position": 210,
    "category": "confesiones",
    "message": "Me encanta cuando compartís conmigo algo que te gusta mucho."
  },
  {
    "position": 211,
    "category": "detalles",
    "message": "Me gusta que a veces te rías de tus propias ocurrencias."
  },
  {
    "position": 212,
    "category": "admiro",
    "message": "Admiro cuando te plantás y decís que no."
  },
  {
    "position": 213,
    "category": "gracias",
    "message": "Gracias por seguir eligiendo compartir tiempo conmigo."
  },
  {
    "position": 214,
    "category": "cotidiano",
    "message": "Me gusta cuando nos mostramos algo gracioso en el celular."
  },
  {
    "position": 215,
    "category": "promesas",
    "message": "Quiero que podamos pedir ayuda sin sentir vergüenza."
  },
  {
    "position": 216,
    "category": "planes",
    "message": "Quiero que compartamos algo nuevo, aunque nos salga mal."
  },
  {
    "position": 217,
    "category": "suenos",
    "message": "Quiero que la vida nos encuentre haciendo lugar a lo importante."
  },
  {
    "position": 218,
    "category": "recuerdos",
    "message": "Hay cosas que viví con vos que aprendí a valorar más tarde."
  },
  {
    "position": 219,
    "category": "regalos",
    "message": "Vale por una lista de canciones hecha para vos."
  },
  {
    "position": 220,
    "category": "confesiones",
    "message": "A veces me cuesta decir lo que siento, pero quiero mejorar."
  },
  {
    "position": 221,
    "category": "detalles",
    "message": "Me gusta cómo transformás un plan sencillo en algo divertido."
  },
  {
    "position": 222,
    "category": "admiro",
    "message": "Admiro que puedas celebrar logros ajenos."
  },
  {
    "position": 223,
    "category": "gracias",
    "message": "Gracias por tratar con cariño lo que para mí es importante."
  },
  {
    "position": 224,
    "category": "cotidiano",
    "message": "Me gusta poder estar cada uno en lo suyo y sentirnos cerca."
  },
  {
    "position": 225,
    "category": "promesas",
    "message": "Prometo seguir buscando maneras de sorprenderte."
  },
  {
    "position": 226,
    "category": "planes",
    "message": "Nos debemos una conversación larga en un lugar lindo."
  },
  {
    "position": 227,
    "category": "suenos",
    "message": "Me ilusiona pensar en sorpresas que todavía no conozco."
  },
  {
    "position": 228,
    "category": "recuerdos",
    "message": "Quiero guardar nuestros chistes malos como si fueran tesoros."
  },
  {
    "position": 229,
    "category": "regalos",
    "message": "Vale por cocinar esa receta que te tienta."
  },
  {
    "position": 230,
    "category": "confesiones",
    "message": "Me pone contento saber que nos seguimos conociendo."
  },
  {
    "position": 231,
    "category": "detalles",
    "message": "Me gusta que tengas cosas que son solo tuyas."
  },
  {
    "position": 232,
    "category": "admiro",
    "message": "Admiro el trabajo que ponés detrás de tus metas."
  },
  {
    "position": 233,
    "category": "gracias",
    "message": "Gracias por tus mensajes inesperados."
  },
  {
    "position": 234,
    "category": "cotidiano",
    "message": "Quiero más domingos sin horarios imposibles."
  },
  {
    "position": 235,
    "category": "promesas",
    "message": "Quiero respetar tus tiempos, incluso si son distintos a los míos."
  },
  {
    "position": 236,
    "category": "planes",
    "message": "Quiero prepararte una sorpresa que no cueste una fortuna."
  },
  {
    "position": 237,
    "category": "suenos",
    "message": "Quiero acompañarte en una meta que te importe de verdad."
  },
  {
    "position": 238,
    "category": "recuerdos",
    "message": "Me emociona acordarme de una buena noticia que compartimos."
  },
  {
    "position": 239,
    "category": "regalos",
    "message": "Vale por ir a buscarte cuando necesites compañía."
  },
  {
    "position": 240,
    "category": "confesiones",
    "message": "Hay momentos en los que quisiera darte un abrazo y nada más."
  },
  {
    "position": 241,
    "category": "detalles",
    "message": "Me gusta que puedas cambiar de opinión cuando aprendés algo."
  },
  {
    "position": 242,
    "category": "admiro",
    "message": "Admiro que te animes a decir lo que sentís."
  },
  {
    "position": 243,
    "category": "gracias",
    "message": "Gracias por contarme cuando algo te pone feliz."
  },
  {
    "position": 244,
    "category": "cotidiano",
    "message": "Me gusta cuando hacemos equipo para resolver lo de todos los días."
  },
  {
    "position": 245,
    "category": "promesas",
    "message": "Prometo recordar que somos un equipo, no rivales."
  },
  {
    "position": 246,
    "category": "planes",
    "message": "Nos debemos elegir un libro, una serie o una película juntos."
  },
  {
    "position": 247,
    "category": "suenos",
    "message": "Sueño con una vida de pequeños gestos que sumen."
  },
  {
    "position": 248,
    "category": "recuerdos",
    "message": "Hay abrazos que llegan justo cuando hacen falta."
  },
  {
    "position": 249,
    "category": "regalos",
    "message": "Vale por un rato de silencio y descanso compartido."
  },
  {
    "position": 250,
    "category": "confesiones",
    "message": "Me hace bien que podamos hablar de lo que no salió bien."
  },
  {
    "position": 251,
    "category": "detalles",
    "message": "Me encanta tu manera de sorprenderme con un comentario."
  },
  {
    "position": 252,
    "category": "admiro",
    "message": "Admiro cómo aprendés de lo que no salió como esperabas."
  },
  {
    "position": 253,
    "category": "gracias",
    "message": "Gracias por las veces que me ayudaste a bajar un cambio."
  },
  {
    "position": 254,
    "category": "cotidiano",
    "message": "Me encanta cuando termina un día difícil y podemos bajar la guardia."
  },
  {
    "position": 255,
    "category": "promesas",
    "message": "Quiero aprender a discutir sin lastimar."
  },
  {
    "position": 256,
    "category": "planes",
    "message": "Quiero que hagamos algo que nunca probamos."
  },
  {
    "position": 257,
    "category": "suenos",
    "message": "Me gustaría que los años nos traigan más paciencia."
  },
  {
    "position": 258,
    "category": "recuerdos",
    "message": "Me gusta encontrar una foto nuestra que había olvidado."
  },
  {
    "position": 259,
    "category": "regalos",
    "message": "Vale por volver a ver una película que amás."
  },
  {
    "position": 260,
    "category": "confesiones",
    "message": "A veces me quedo con ganas de decirte algo lindo y lo dejo pasar."
  },
  {
    "position": 261,
    "category": "detalles",
    "message": "Me gusta escucharte decir qué soñás hacer algún día."
  },
  {
    "position": 262,
    "category": "admiro",
    "message": "Admiro que te hagas preguntas difíciles."
  },
  {
    "position": 263,
    "category": "gracias",
    "message": "Gracias por enseñarme cosas sin darte cuenta."
  },
  {
    "position": 264,
    "category": "cotidiano",
    "message": "Me gusta que nuestros planes puedan ser muy sencillos."
  },
  {
    "position": 265,
    "category": "promesas",
    "message": "Prometo no esperar a una fecha especial para demostrar cariño."
  },
  {
    "position": 266,
    "category": "planes",
    "message": "Nos debemos una salida improvisada."
  },
  {
    "position": 267,
    "category": "suenos",
    "message": "Quiero que aprendamos a disfrutar de lo que conseguimos."
  },
  {
    "position": 268,
    "category": "recuerdos",
    "message": "Quiero que lo próximo que recordemos sea algo que todavía no pasó."
  },
  {
    "position": 269,
    "category": "regalos",
    "message": "Vale por una salida a mirar vidrieras sin comprar nada."
  },
  {
    "position": 270,
    "category": "confesiones",
    "message": "Quiero que sepas que me gusta la persona que sos hoy."
  },
  {
    "position": 271,
    "category": "detalles",
    "message": "Me gusta cuando estás tan a gusto que ni mirás la hora."
  },
  {
    "position": 272,
    "category": "admiro",
    "message": "Admiro que no necesites tener siempre la última palabra."
  },
  {
    "position": 273,
    "category": "gracias",
    "message": "Gracias por poder hablar de temas difíciles."
  },
  {
    "position": 274,
    "category": "cotidiano",
    "message": "Me gusta cuando nos reímos del mismo detalle."
  },
  {
    "position": 275,
    "category": "promesas",
    "message": "Quiero estar a tu lado también cuando los planes cambien."
  },
  {
    "position": 276,
    "category": "planes",
    "message": "Quiero llevarte a comer tu antojo favorito."
  },
  {
    "position": 277,
    "category": "suenos",
    "message": "Me ilusiona imaginar nuestras próximas buenas noticias."
  },
  {
    "position": 278,
    "category": "recuerdos",
    "message": "Hay momentos que no fotografiamos y siguen intactos."
  },
  {
    "position": 279,
    "category": "regalos",
    "message": "Vale por bailar una canción en casa."
  },
  {
    "position": 280,
    "category": "confesiones",
    "message": "Hay días en los que un audio tuyo me cambia la tarde."
  },
  {
    "position": 281,
    "category": "detalles",
    "message": "Me gusta tu forma de preguntar cuando algo te interesa."
  },
  {
    "position": 282,
    "category": "admiro",
    "message": "Admiro que sepas disfrutar cuando las cosas salen bien."
  },
  {
    "position": 283,
    "category": "gracias",
    "message": "Gracias por tu compañía en días comunes."
  },
  {
    "position": 284,
    "category": "cotidiano",
    "message": "Quiero acordarme de preguntarte más seguido cómo te fue."
  },
  {
    "position": 285,
    "category": "promesas",
    "message": "Prometo darte lugar para ser vos."
  },
  {
    "position": 286,
    "category": "planes",
    "message": "Nos debemos ver fotos viejas y reírnos un rato."
  },
  {
    "position": 287,
    "category": "suenos",
    "message": "Quiero que sigamos encontrando motivos para reírnos juntos."
  },
  {
    "position": 288,
    "category": "recuerdos",
    "message": "Me gusta hablar de cómo éramos cuando nos conocimos."
  },
  {
    "position": 289,
    "category": "regalos",
    "message": "Vale por una sorpresa chiquita hecha con mis manos."
  },
  {
    "position": 290,
    "category": "confesiones",
    "message": "Me gusta elegirte también cuando las cosas no son perfectas."
  },
  {
    "position": 291,
    "category": "detalles",
    "message": "Me encanta descubrir esas pequeñas costumbres tuyas."
  },
  {
    "position": 292,
    "category": "admiro",
    "message": "Admiro las ganas que ponés aun cuando estás cansada o cansado."
  },
  {
    "position": 293,
    "category": "gracias",
    "message": "Gracias por la confianza que fuimos construyendo."
  },
  {
    "position": 294,
    "category": "cotidiano",
    "message": "Me gusta caminar a tu lado sin tener que llenar todos los silencios."
  },
  {
    "position": 295,
    "category": "promesas",
    "message": "Quiero construir confianza con hechos pequeños."
  },
  {
    "position": 296,
    "category": "planes",
    "message": "Quiero descubrir con vos algún rincón cerca de casa."
  },
  {
    "position": 297,
    "category": "suenos",
    "message": "Sueño con abrazarnos después de un día que parecía imposible."
  },
  {
    "position": 298,
    "category": "recuerdos",
    "message": "Quiero seguir sumando historias que empiezan con «¿te acordás?»."
  },
  {
    "position": 299,
    "category": "regalos",
    "message": "Vale por hacerme cargo de un pendiente para que descanses."
  },
  {
    "position": 300,
    "category": "confesiones",
    "message": "A veces pienso en todo lo que todavía tenemos por contarnos."
  },
  {
    "position": 301,
    "category": "detalles",
    "message": "Me gusta cómo mostrás cariño sin hacer un gran discurso."
  },
  {
    "position": 302,
    "category": "admiro",
    "message": "Admiro el cariño que tenés para dar."
  },
  {
    "position": 303,
    "category": "gracias",
    "message": "Gracias por tus abrazos cuando hacen falta."
  },
  {
    "position": 304,
    "category": "cotidiano",
    "message": "Hay conversaciones cotidianas que después recuerdo con cariño."
  },
  {
    "position": 305,
    "category": "promesas",
    "message": "Prometo tener más paciencia en los días complicados."
  },
  {
    "position": 306,
    "category": "planes",
    "message": "Nos debemos bailar aunque no sepamos hacerlo muy bien."
  },
  {
    "position": 307,
    "category": "suenos",
    "message": "Me gustaría que nos animemos a decir lo que deseamos."
  },
  {
    "position": 308,
    "category": "recuerdos",
    "message": "Hay planes improvisados que recuerdo mejor que los grandes."
  },
  {
    "position": 309,
    "category": "regalos",
    "message": "Vale por llevarte algo rico un día cualquiera."
  },
  {
    "position": 310,
    "category": "confesiones",
    "message": "Me gusta hacerte un lugar en mis planes."
  },
  {
    "position": 311,
    "category": "detalles",
    "message": "Me gusta cuando defendés algo que considerás justo."
  },
  {
    "position": 312,
    "category": "admiro",
    "message": "Admiro que tengas tu propia voz."
  },
  {
    "position": 313,
    "category": "gracias",
    "message": "Gracias por la alegría de armar cosas juntos."
  },
  {
    "position": 314,
    "category": "cotidiano",
    "message": "Me gusta cuando un plan espontáneo termina saliendo bien."
  },
  {
    "position": 315,
    "category": "promesas",
    "message": "Quiero que los dos tengamos espacio para crecer."
  },
  {
    "position": 316,
    "category": "planes",
    "message": "Quiero reservar un día para lo que vos elijas."
  },
  {
    "position": 317,
    "category": "suenos",
    "message": "Quiero que el futuro tenga espacio para tus decisiones y las mías."
  },
  {
    "position": 318,
    "category": "recuerdos",
    "message": "Me encanta acordarme de un gesto tuyo inesperado."
  },
  {
    "position": 319,
    "category": "regalos",
    "message": "Vale por una tarde dedicada a uno de tus hobbies."
  },
  {
    "position": 320,
    "category": "confesiones",
    "message": "Quería decirte algo sencillo: me encanta compartir la vida con vos."
  },
  {
    "position": 321,
    "category": "detalles",
    "message": "Me encanta cuando me recomendás algo que te gustó."
  },
  {
    "position": 322,
    "category": "admiro",
    "message": "Admiro que puedas cambiar hábitos que ya no te hacen bien."
  },
  {
    "position": 323,
    "category": "gracias",
    "message": "Gracias por acordarte de detalles míos."
  },
  {
    "position": 324,
    "category": "cotidiano",
    "message": "Quiero seguir haciendo espacio para escucharnos."
  },
  {
    "position": 325,
    "category": "promesas",
    "message": "Prometo preguntar antes de suponer."
  },
  {
    "position": 326,
    "category": "planes",
    "message": "Nos debemos celebrar simplemente que estamos juntos."
  },
  {
    "position": 327,
    "category": "suenos",
    "message": "Me ilusiona saber que todavía quedan primeras veces."
  },
  {
    "position": 328,
    "category": "recuerdos",
    "message": "Quiero recordar más los momentos lindos que los apuros."
  },
  {
    "position": 329,
    "category": "regalos",
    "message": "Vale por elegir el próximo plan de los dos."
  },
  {
    "position": 330,
    "category": "confesiones",
    "message": "Me hace bien que estemos del mismo lado."
  },
  {
    "position": 331,
    "category": "detalles",
    "message": "Me gusta que seas una persona de verdad, con días buenos y malos."
  },
  {
    "position": 332,
    "category": "admiro",
    "message": "Admiro cómo seguís buscando lo que te hace feliz."
  },
  {
    "position": 333,
    "category": "gracias",
    "message": "Gracias por tu forma de darme ánimo."
  },
  {
    "position": 334,
    "category": "cotidiano",
    "message": "Me gusta el sonido de una conversación tranquila con vos."
  },
  {
    "position": 335,
    "category": "promesas",
    "message": "Quiero seguir eligiendo nuestro vínculo con intención."
  },
  {
    "position": 336,
    "category": "planes",
    "message": "Quiero que sigamos diciendo que sí a planes sencillos."
  },
  {
    "position": 337,
    "category": "suenos",
    "message": "Quiero que hagamos recuerdos sin tener que programarlo todo."
  },
  {
    "position": 338,
    "category": "recuerdos",
    "message": "Hay días que parecían iguales a los demás y no lo fueron."
  },
  {
    "position": 339,
    "category": "regalos",
    "message": "Vale por un picnic sencillo."
  },
  {
    "position": 340,
    "category": "confesiones",
    "message": "Me gusta que puedas decirme cuando necesitás más cariño."
  },
  {
    "position": 341,
    "category": "detalles",
    "message": "Me gusta tu modo de encontrarle una vuelta a las cosas."
  },
  {
    "position": 342,
    "category": "admiro",
    "message": "Admiro que no todo te dé lo mismo."
  },
  {
    "position": 343,
    "category": "gracias",
    "message": "Gracias por querer hacer bien las cosas entre nosotros."
  },
  {
    "position": 344,
    "category": "cotidiano",
    "message": "Un mensaje tuyo puede cambiarme el humor para bien."
  },
  {
    "position": 345,
    "category": "promesas",
    "message": "Prometo no hacer de una mala tarde una mala semana."
  },
  {
    "position": 346,
    "category": "planes",
    "message": "Nos debemos mirar las estrellas de verdad, no solo una pantalla."
  },
  {
    "position": 347,
    "category": "suenos",
    "message": "Sueño con sentirnos libres de ser como somos."
  },
  {
    "position": 348,
    "category": "recuerdos",
    "message": "Me gusta que nuestros recuerdos tengan distintas versiones."
  },
  {
    "position": 349,
    "category": "regalos",
    "message": "Vale por una foto impresa para guardar."
  },
  {
    "position": 350,
    "category": "confesiones",
    "message": "A veces te miro y pienso que tengo mucha suerte."
  },
  {
    "position": 351,
    "category": "detalles",
    "message": "Me encanta cómo se te ilumina la cara con una buena noticia."
  },
  {
    "position": 352,
    "category": "admiro",
    "message": "Admiro que hagas lugar para las personas importantes."
  },
  {
    "position": 353,
    "category": "gracias",
    "message": "Gracias por volver a conversar después de un desacuerdo."
  },
  {
    "position": 354,
    "category": "cotidiano",
    "message": "Me gusta saber que mañana vamos a tener algo nuevo para contarnos."
  },
  {
    "position": 355,
    "category": "promesas",
    "message": "Quiero que sientas que podés contar conmigo."
  },
  {
    "position": 356,
    "category": "planes",
    "message": "Quiero armar un pequeño ritual de fin de semana con vos."
  },
  {
    "position": 357,
    "category": "suenos",
    "message": "Me gustaría que lo que viene nos encuentre conversando."
  },
  {
    "position": 358,
    "category": "recuerdos",
    "message": "Quiero que los próximos años nos encuentren contando anécdotas."
  },
  {
    "position": 359,
    "category": "regalos",
    "message": "Vale por una mañana de hacer lo que se nos ocurra."
  },
  {
    "position": 360,
    "category": "confesiones",
    "message": "Quiero seguir encontrando formas nuevas de cuidarnos."
  },
  {
    "position": 361,
    "category": "detalles",
    "message": "Me gusta lo natural que se siente estar con vos."
  },
  {
    "position": 362,
    "category": "admiro",
    "message": "Admiro muchísimo tu manera de ser vos."
  },
  {
    "position": 363,
    "category": "gracias",
    "message": "Gracias por ser parte de mi vida."
  },
  {
    "position": 364,
    "category": "cotidiano",
    "message": "Me gusta la idea de seguir compartiendo días normales."
  },
  {
    "position": 365,
    "category": "promesas",
    "message": "Prometo seguir cuidando esto que estamos construyendo."
  }
] as Jar365Note[];
