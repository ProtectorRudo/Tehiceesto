/**
 * Offline editorial reserve for a SINGLE failed mission slot.
 *
 * These activities are intentionally concrete and use no hazardous props,
 * child-development tests, diagnoses, or assumed milestones. They are not
 * hallucinated AI output: source is explicitly marked curated_safe_alternative.
 * The AI's remaining original safe missions are preserved unchanged.
 *
 * Age bands describe which instructions can be offered, never which abilities
 * a child is presumed to have. Adult supervision is always required.
 */
const missions={
 'baby-early':{
  conectar:{
   title:'Una canción con tu voz de todos los días',
   intro:'Van a compartir un fragmento de una canción conocida, en un momento tranquilo, sin preparar nada ni buscar una reacción especial.',
   setup:'Elegí un momento en que tu bebé esté a gusto, en una postura segura y con su cabeza bien sostenida si está en brazos. No necesitás materiales.',
   opening:'«Estoy acá con vos. Te canto un poquito y compartimos este ratito.»',
   steps:['Acercate con calma y tarareá una estrofa corta a un volumen suave, sin cantar cerca del oído.','Cuando termine, quedate cerca en silencio un momento. Si necesita descanso o atención, terminá y acompañá esa necesidad.'],
   example:'Por ejemplo, cantá una parte de una canción que ya conozcas. No cambies el volumen para conseguir que te mire; lo importante es compartir tu voz.',
   why:'Escuchar tu voz en un encuentro cotidiano ofrece un momento de compañía; vos podés estar presente sin convertir la canción en una prueba.',
   observe:'Quedate con lo que disfrutaron de estar juntos, aunque no haya señales visibles.',
   ifNo:'Si necesita dormir, alimentarse o estar en calma, dejá la canción para otro momento.',
   skill:'no aplica'
  },
  comprender:{
   title:'Un cuento dicho a tu manera',
   intro:'Le contarás una historia muy corta con tu voz, acompañando el ritmo de ese momento y deteniéndote si necesita una pausa.',
   setup:'Sentate en un lugar cómodo con el bebé en una postura segura y sostenida. No necesitás libros ni objetos especiales.',
   opening:'«Te voy a contar algo cortito sobre nuestro día, acá cerquita.»',
   steps:['Contá con palabras sencillas un pequeño momento real del día, por ejemplo cómo entraba la luz por una ventana.','Hacé una pausa natural; si el bebé necesita otra cosa, dejá la historia y atendé primero sus necesidades.'],
   example:'Podés decir «Hoy vimos una nube muy grande». Hacé una pausa breve y seguí solamente si el momento sigue siendo cómodo para ambos.',
   why:'Al adaptar la duración y tu presencia al momento real, practicás acompañar sin imponer un ritmo propio ni necesitar respuestas del bebé.',
   observe:'Tené presente si el momento fue cómodo; no hace falta interpretar cada movimiento.',
   ifNo:'Si hay cansancio o incomodidad, terminá sin volver a empezar para obtener una reacción.',
   skill:'no aplica'
  },
  sembrar:{
   title:'Las palabras de nuestra pequeña canción',
   intro:'Vas a nombrar dos cosas familiares con una melodía suave, ofreciendo un encuentro de lenguaje cotidiano sin pedir imitaciones.',
   setup:'Buscá unos minutos de tranquilidad, con el bebé en una posición segura y acompañado. Todo lo necesario es tu voz.',
   opening:'«Te canto sobre dos cosas que conocemos: mi voz y esta luz.»',
   steps:['Elegí dos palabras sencillas relacionadas con lo que realmente están compartiendo, como «luz» y «voz».','Cantá las palabras en una melodía propia y terminá con una pausa tranquila; no pidas que repita sonidos ni gestos.'],
   example:'Podés cantar muy suavemente «Luz de la mañana, voz que te acompaña», dejando que la canción termine sin esperar nada a cambio.',
   why:'Las palabras repetidas naturalmente en una canción ofrecen una oportunidad de familiaridad con sonidos del lenguaje durante un momento compartido.',
   observe:'Disfrutá de cantar; cualquier respuesta del bebé es opcional y no demuestra un aprendizaje.',
   ifNo:'Si necesita dormir o consuelo, suspendé la canción y priorizá sus cuidados.',
   skill:'Escucha de palabras y ritmos del lenguaje'
  }
 },
 'baby-middle':{
  conectar:{
   title:'Nuestro estribillo pequeño',
   intro:'Compartirán una canción conocida con una pausa tranquila en el medio, para disfrutar tu voz y el rato juntos.',
   setup:'Elegí un lugar tranquilo y una postura segura en la que tu bebé esté cómodo. No necesitás música grabada ni materiales.',
   opening:'«Tengo ganas de cantarte un poquito nuestra canción. ¿La escuchamos juntos?»',
   steps:['Cantá unas líneas cortas de una canción conocida con voz suave, mirándolo solo si mantiene la mirada naturalmente.','Detené la canción un instante y terminá con otra línea si el momento sigue siendo agradable; si necesita pausa, dejala ahí.'],
   example:'Por ejemplo, tarareá una canción de cuna breve, sonreí y terminá con una frase suave. No intentes provocar una sonrisa ni comprobar si te imita.',
   why:'Un encuentro sin exigencias permite disfrutar la compañía y prestar atención a la comodidad del bebé sin convertir el juego en un examen.',
   observe:'Recordá si el momento resultó tranquilo y agradable, no si respondió de una manera específica.',
   ifNo:'Si aparece cansancio, hambre o malestar, dejá la canción y atendé sus necesidades.',
   skill:'no aplica'
  },
  comprender:{
   title:'Una página y lo que despierta curiosidad',
   intro:'Van a mirar juntos una imagen grande y sencilla, dejando que el momento dure lo que resulte cómodo, sin buscar señales ni aciertos.',
   setup:'Tomá un libro infantil de imágenes grandes y páginas resistentes, sostenido por el adulto. Sentate con el bebé en una postura segura y cómoda.',
   opening:'«Mirá, acá hay un dibujo. Te cuento qué veo y compartimos un ratito.»',
   steps:['Mostrá una sola imagen del libro a una distancia cómoda y nombrá algo que ves, sin mover el libro deprisa.','Si el bebé dirige naturalmente la atención a otro lado, acompañá esa pausa; cerrá el libro cuando el momento termine.'],
   example:'Si aparece un dibujo de un perro, podés decir «Acá hay un perro con orejas grandes». Después guardá el libro si ya prefiere descansar.',
   why:'Observar qué momentos se sienten cómodos ayuda a acompañar su ritmo cotidiano, sin suponer que una mirada aislada revela una preferencia estable.',
   observe:'Notá si ambos disfrutaron el encuentro; evitá convertir las miradas en resultados.',
   ifNo:'Si el libro no interesa o hay cansancio, guardalo y quedate cerca sin insistir.',
   skill:'no aplica'
  },
  sembrar:{
   title:'La historia de dos imágenes',
   intro:'Contarás una historia muy breve usando dos dibujos grandes de un libro adecuado, para ofrecer palabras y atención compartida de forma natural.',
   setup:'Elegí un libro infantil de imágenes grandes, sostenido por el adulto. Buscá un momento tranquilo y una posición cómoda y segura.',
   opening:'«Te cuento un cuento pequeñito: primero pasa esto y después aquello.»',
   steps:['Mostrá una imagen y narrá una acción sencilla que veas, como «El pájaro está en el árbol», sin pedir respuestas.','Pasá a otra imagen solo si el momento sigue siendo agradable y agregá una segunda frase. Cerrá con tranquilidad.'],
   example:'Podés señalar dos dibujos y contar «El perrito encuentra una flor. Después se queda a descansar». No importa si el bebé mira otra cosa.',
   why:'Escuchar una narración breve durante un momento compartido ofrece exposición natural a palabras y secuencias, sin evaluar capacidades ni exigir imitación.',
   observe:'Quedate con el momento de lectura, sin medir cuánto tiempo miró el libro.',
   ifNo:'Si necesita una pausa o descanso, cerrá el libro y retomá otro día si se da naturalmente.',
   skill:'Escucha de palabras y secuencias narrativas'
  }
 },
 'baby-late':{
  conectar:{
   title:'Una canción con tu gesto favorito',
   intro:'Vas a cantar algo conocido e incorporar un gesto suave propio, sin pedir que el bebé lo imite ni intentar provocar una reacción.',
   setup:'Sentate cerca del bebé en una postura estable y segura. No uses objetos ni hagas movimientos sobre su cuerpo.',
   opening:'«Te canto un poquito y hago este gesto con mi mano.»',
   steps:['Elegí una canción breve y acompañá una línea con un gesto lento de tu propia mano, sin tocar ni dirigir las manos del bebé.','Terminá con una sonrisa o una frase suave y dejá que el momento se cierre cuando sea natural.'],
   example:'Podés tararear una melodía y dibujar un círculo en el aire con tu mano. No acerques la mano a su cara ni pidas que copie el círculo.',
   why:'El juego ofrece un momento alegre de tu voz y tu presencia, sin medir destrezas ni convertir la interacción en una tarea.',
   observe:'Valorá si el encuentro fue cómodo, incluso cuando prefirió mirar otra cosa.',
   ifNo:'Si aparece incomodidad o sueño, dejá el gesto y acompañá lo que necesite.',
   skill:'no aplica'
  },
  comprender:{
   title:'Tu historia de las cosas de hoy',
   intro:'Le contarás con palabras sencillas algo que compartieron durante el día, dejando espacio para que el encuentro siga su ritmo.',
   setup:'Buscá un momento en que el bebé esté cómodo y acompañado. No necesitás objetos ni modificar su postura.',
   opening:'«¿Sabés qué hicimos hoy? Te lo cuento en una historia cortita.»',
   steps:['Recordá una escena cotidiana sencilla que realmente hayan compartido y contala con una o dos frases.','Hacé una pausa natural y terminá si el bebé necesita descanso o atención. No repitas la historia para comprobar una respuesta.'],
   example:'Podés decir «Hoy entró el sol por la ventana y la habitación quedó iluminada». Después quedate cerca y dejá que la historia termine.',
   why:'Elegir el momento y adaptar su duración a la comodidad del bebé te ayuda a acompañar su ritmo sin interpretar señales aisladas como conclusiones.',
   observe:'Recordá qué forma de acompañamiento resultó cómoda para ambos, sin buscar evidencias.',
   ifNo:'Si hoy prefiere otra cosa, dejá el cuento sin insistir.',
   skill:'no aplica'
  },
  sembrar:{
   title:'Una pequeña narración de lo cotidiano',
   intro:'Vas a unir dos acciones familiares en una historia hablada, ofreciendo palabras y secuencias sin pedir que el bebé las repita.',
   setup:'Elegí un momento tranquilo con el bebé seguro y acompañado. No necesitás materiales especiales.',
   opening:'«Te cuento una historia de dos momentos: primero y después.»',
   steps:['Narrá una acción cotidiana que ocurrió de verdad, en una frase sencilla y con voz natural.','Agregá una segunda frase con «después» y cerrá; no busques una reacción ni evalúes si comprendió.'],
   example:'Podés contar «Primero abrimos la ventana. Después escuchamos la lluvia». Si nada de eso pasó, elegí otra situación real y sencilla.',
   why:'Escuchar frases ligadas a hechos familiares ofrece oportunidades naturales de exposición al lenguaje y a una secuencia, en un momento de compañía.',
   observe:'Disfrutá el intercambio sin interpretar gestos como una prueba de comprensión.',
   ifNo:'Si necesita descansar, dejá el relato para otra oportunidad.',
   skill:'Escucha de frases y secuencias de acciones'
  }
 },
 'toddler':{
  conectar:{
   title:'Un paseo con dos descubrimientos',
   intro:'Van a recorrer un rincón conocido y elegir juntos dos cosas agradables para mirar, sin apuro ni obligación de continuar.',
   setup:'Elegí un espacio cotidiano seguro, dentro de casa o en un lugar tranquilo, con supervisión cercana. No necesitás materiales.',
   opening:'«¿Vemos juntos dos cosas lindas de este lugar? Podemos parar cuando quieras.»',
   steps:['Mostrá algo sencillo que esté a la vista, como una ventana o una planta fuera de su alcance, y nombralo.','Dejá espacio para que señale o mire lo que prefiera, si tiene ganas; acompañá ese interés sin forzarlo.'],
   example:'Podés decir «A mí me gusta cómo entra la luz por acá». Si quiere mirar otra cosa, acompañalo y nombrá esa elección.',
   why:'Compartir una exploración guiada por su interés ofrece presencia y oportunidad de elegir sin convertir el paseo en una prueba.',
   observe:'Disfrutá alguna elección espontánea si surge, sin esperar que ocurra.',
   ifNo:'Si necesita descanso o no quiere recorrer, quedate a compartir el lugar sin proponer más cosas.',
   skill:'no aplica'
  },
  comprender:{
   title:'La página que elegimos hoy',
   intro:'Van a compartir un libro de imágenes, dejando que decida si quiere continuar, cambiar de página o simplemente escuchar.',
   setup:'Elegí un libro infantil de páginas resistentes apropiado para su edad y sostenelo con supervisión en un lugar cómodo.',
   opening:'«¿Querés que veamos este libro? Vos podés elegir por dónde empezamos.»',
   steps:['Ofrecé mirar una página y nombrá un detalle del dibujo sin pedir que lo encuentre o lo señale.','Si manifiesta ganas de pasar de página o detenerse, acompañá esa elección. Cerrá el libro con calma cuando termine.'],
   example:'En una página con animales, podés decir «Hay una vaca entre las flores». Si elige otra página, seguí sin devolverlo a la anterior.',
   why:'Responder a una elección cotidiana te permite conocer qué le interesa en ese momento, sin exigir explicaciones ni respuestas.',
   observe:'Fijate si surge una elección espontánea, sin convertirla en un resultado.',
   ifNo:'Si no tiene ganas del libro, guardalo y elegí otro momento de compañía.',
   skill:'no aplica'
  },
  sembrar:{
   title:'La historia que empieza con un dibujo',
   intro:'Van a inventar una historia corta mirando un dibujo conocido, ofreciendo la posibilidad de agregar una palabra, gesto o idea si quiere.',
   setup:'Buscá un libro con imágenes grandes y seguras para su edad. El adulto sostiene el libro y acompaña todo el tiempo.',
   opening:'«Mirá esta imagen. Yo cuento un pedacito y vos podés agregar algo si querés.»',
   steps:['Elegí una página y empezá un relato breve nombrando un personaje y una acción.','Hacé una pausa natural; si aparece una idea, incorporala. Si no, cerrá la historia con una segunda frase sencilla.'],
   example:'Podés decir «Un perrito salió a pasear y encontró una hoja». Si hace un sonido o señala algo, seguí esa idea sin pedirle repetirla.',
   why:'Escuchar y, si desea, contribuir a una historia sencilla ofrece una oportunidad de expresión espontánea, sin transformar el juego en un examen.',
   observe:'Disfrutá la historia que compartieron, tenga o no una intervención propia.',
   ifNo:'Si no quiere mirar el libro, guardalo sin insistir.',
   skill:'Expresión espontánea de ideas o sonidos'
  }
 },
 'child-early':{
  conectar:{
   title:'Dos personajes y un encuentro inesperado',
   intro:'Van a inventar dos personajes que se cruzan y descubrir juntos qué sucede, dejando que la historia cambie según sus ideas.',
   setup:'Buscá una hoja y dos lápices en la mesa, o jueguen hablando si no hay papel. Reservá unos diez minutos.',
   opening:'«¿Inventamos dos personajes, uno cada quien, y vemos qué pasa cuando se encuentran?»',
   steps:['Dejá que elija su personaje y contale cuál elegís vos. Pueden dibujarlos o simplemente describirlos.','Hacé que tu personaje salude y seguí lo que proponga, sin corregir sus ideas. Denle juntos un final breve.'],
   example:'Si inventa un gato que vive en una nave, tu personaje puede preguntarle «¿Puedo visitar tu planeta?». Dejá que decida qué ocurre.',
   why:'Seguir su imaginación sin decidir por él abre un momento de juego compartido en el que sus decisiones tienen lugar.',
   observe:'Recordá una ocurrencia que te haya sorprendido, sin pedir que explique por qué la eligió.',
   ifNo:'Si prefiere otro juego o no tiene ganas, dejá la propuesta y acompañá una elección suya.',
   skill:'no aplica'
  },
  comprender:{
   title:'Una elección con una buena razón',
   intro:'Van a escoger entre dos pequeños planes cotidianos y charlar sobre qué los hace atractivos, sin tratar de convencer a nadie.',
   setup:'Elegí dos opciones posibles y gratuitas para compartir, como escuchar música o dibujar un rato en casa.',
   opening:'«Tenemos dos opciones para compartir: ¿cuál te gustaría más hoy?»',
   steps:['Presentá las dos opciones como invitación, no como examen, y dejá que elija o proponga una tercera.','Si tiene ganas de contarlo, escuchá qué le gusta de esa elección y hagan juntos el plan durante unos minutos.'],
   example:'Si elige dibujar en vez de escuchar música, podés responder «Me gusta esa idea; ¿querés empezar vos o empiezo yo?»',
   why:'Escuchar una preferencia real sin discutirla te ayuda a descubrir cómo quiere compartir tiempo y le muestra que sus elecciones importan.',
   observe:'Quedate con una preferencia que haya expresado espontáneamente.',
   ifNo:'Si no quiere elegir ahora, ofrecé compartir simplemente un rato tranquilo.',
   skill:'no aplica'
  },
  sembrar:{
   title:'Un plan en dos pasos para nuestra aventura',
   intro:'Van a inventar una miniaventura de dos pasos y probar el orden, permitiendo que cambie su idea cuando quiera.',
   setup:'Usen una hoja y un lápiz, o simplemente sus voces. No hace falta salir de casa ni preparar materiales.',
   opening:'«¿Inventamos una aventura que tenga dos pasos? Vos elegís qué pasa primero.»',
   steps:['Invitá a elegir un personaje y dos acciones sencillas para su aventura. Podés dibujarlas o contarlas en voz alta.','Seguí los pasos en el orden que propuso y preguntá si quiere cambiar algo; aceptá el final que elija.'],
   example:'Puede inventar «Primero el dragón cruza el puente y después encuentra una flor». Si quiere cambiar el orden, recontá la historia como decidió.',
   why:'Organizar una secuencia pequeña y modificarla si desea ofrece una práctica lúdica de planificación e iniciativa, sin puntajes ni aciertos.',
   observe:'Disfrutá cómo construye la historia, sin exigir que ordene nada de una manera específica.',
   ifNo:'Si quiere contar otra historia libremente, acompañala sin imponer pasos.',
   skill:'Planificación de una secuencia de dos acciones'
  }
 },
 'child-middle':{
  conectar:{
   title:'Dos personajes construyen una historia',
   intro:'Van a imaginar un encuentro entre dos personajes elegidos por ustedes y a construir juntos una aventura breve con un giro inesperado.',
   setup:'Una hoja y dos lápices alcanzan; también pueden hacerlo sin materiales, contando la escena de manera oral.',
   opening:'«Elegí un personaje que te guste; yo invento otro y vemos qué aventura nos sale entre los dos.»',
   steps:['Dejá que elija un personaje de alguna historia o invente uno, y elegí otro sin imponer un escenario.','Proponé un encuentro entre ambos y dejá que agregue el siguiente giro; cerrá siguiendo su idea o acordando un final juntos.'],
   example:'Si elige una criatura de un videojuego, tu personaje puede aparecer pidiendo ayuda para encontrar un camino. Su idea decide qué sucede después.',
   why:'Cuando su propuesta cambia tu parte de la historia, compartís una creación en la que su imaginación influye realmente en lo que hacés.',
   observe:'Guardá un detalle de la historia que hayan disfrutado, sin pedir un balance.',
   ifNo:'Si hoy prefiere otra actividad, no insistas con este juego.',
   skill:'no aplica'
  },
  comprender:{
   title:'Tu versión de nuestro próximo plan',
   intro:'Van a comparar dos maneras de pasar un rato juntos y elegir cuál encaja mejor con lo que tiene ganas de hacer hoy.',
   setup:'Pensá dos propuestas simples y posibles, como dibujar juntos diez minutos o dar una vuelta corta a pie.',
   opening:'«¿Qué te gustaría más hoy: crear algo juntos o salir un rato? También podés proponer otra idea.»',
   steps:['Ofrecé las opciones sin apurar una respuesta y escuchá su propuesta, aunque sea diferente de las dos iniciales.','Si quiere, preguntale qué le atrae de ese plan y hacé espacio para compartirlo, sin convertir la elección en debate.'],
   example:'Puede responder «Prefiero quedarme y dibujar». En vez de preguntar muchas veces por qué, podés decir «Perfecto, ¿dónde empezamos?»',
   why:'Conocer cómo elige pasar tiempo con vos permite adaptar la compañía a su momento real, en lugar de adivinar lo que prefiere.',
   observe:'Notá alguna elección espontánea, sin usarla como preferencia definitiva.',
   ifNo:'Si no tiene ganas de elegir, dejá las opciones para otro momento.',
   skill:'no aplica'
  },
  sembrar:{
   title:'Una misión con un problema para resolver',
   intro:'Van a inventar un pequeño obstáculo para un personaje y pensar juntos dos soluciones posibles, sin decidir cuál es la correcta.',
   setup:'Pueden jugar hablando en la mesa o dibujar en una hoja. Reservá unos diez minutos.',
   opening:'«Inventemos un personaje que tiene un problema. ¿Qué dos ideas podríamos probar?»',
   steps:['Dejá que invente un personaje y un desafío imaginario fácil de entender. Preguntá por una primera solución.','Proponé buscar otra alternativa y conversen qué podría pasar con cada una, sin premiar ni corregir respuestas.'],
   example:'Un personaje quiere cruzar un río imaginario. Puede buscar un puente o pedir ayuda a otro personaje. Su idea define el final.',
   why:'Inventar alternativas y anticipar lo que podría suceder permite practicar flexibilidad y creatividad sin convertir el encuentro en una tarea escolar.',
   observe:'Disfrutá una solución inesperada, incluso si parece extravagante.',
   ifNo:'Si no quiere resolver problemas, dejen que los personajes jueguen libremente.',
   skill:'Imaginar y comparar dos soluciones posibles'
  }
 },
 'teen':{
  conectar:{
   title:'Una canción que dice algo de nosotros',
   intro:'Van a compartir una canción o un fragmento que cada persona elija, sin juzgar gustos ni pedir explicaciones personales.',
   setup:'Busquen diez minutos en un lugar tranquilo. Si no quieren reproducir música, pueden simplemente nombrar una canción o artista.',
   opening:'«¿Te pinta mostrarme una canción que te guste? Yo después elijo una que me acompañó esta semana.»',
   steps:['Invitá a elegir una canción, un artista o una frase musical, sin exigir que muestre su teléfono o cuentas.','Compartí también una elección propia y escuchá la suya con respeto; cerrá sin calificar cuál es mejor.'],
   example:'Si nombra una banda que no conocés, podés decir «No la tenía; me interesa saber qué te gusta de ese sonido», sin interrogatorio.',
   why:'Compartir gustos por decisión propia abre una conversación de igual a igual y demuestra interés sin invadir su intimidad.',
   observe:'Recordá algo que hayas descubierto sin convertirlo en una pregunta de seguimiento obligatoria.',
   ifNo:'Si prefiere no compartir música, respetá la decisión y dejá la invitación abierta.',
   skill:'no aplica'
  },
  comprender:{
   title:'La forma de compartir que te resulta cómoda',
   intro:'Van a conversar brevemente sobre qué tipo de compañía prefiere en un momento cotidiano, sin pedir explicaciones íntimas.',
   setup:'Buscá un momento sin apuro, como una merienda o una caminata corta; evitá hacerlo frente a otras personas.',
   opening:'«Quiero acompañarte de una manera que te resulte cómoda. ¿Hoy preferís charla, hacer algo juntos o un rato de espacio?»',
   steps:['Ofrecé las tres opciones sin presionar una respuesta ni interpretar el silencio como rechazo.','Acompañá la opción que elija si es posible, o acordá otro momento; no transformes la elección en una discusión.'],
   example:'Si responde «Prefiero estar por mi cuenta», podés decir «Dale, gracias por decírmelo. Estoy disponible cuando quieras».',
   why:'Respetar su manera de pedir compañía o espacio puede fortalecer la confianza porque su decisión tiene consecuencias reales.',
   observe:'Fijate si pudiste respetar su respuesta sin volver a insistir.',
   ifNo:'Si no quiere hablar del tema, aceptalo y seguí con normalidad.',
   skill:'no aplica'
  },
  sembrar:{
   title:'Un plan posible con dos caminos',
   intro:'Van a elegir un objetivo cotidiano pequeño y pensar dos caminos viables para intentarlo, sin convertirlo en una obligación.',
   setup:'Reservá diez minutos en un momento tranquilo. No hace falta una planilla ni entrar a ninguna aplicación.',
   opening:'«Si te sirve, podemos pensar dos maneras de hacer algo que tengas ganas de probar. Vos elegís el tema.»',
   steps:['Invitá a elegir un objetivo pequeño y voluntario, como organizar un rato libre o preparar una salida económica.','Piensen dos caminos, con ventajas diferentes. Escuchá cuál le parece más realista y dejá la decisión en sus manos.'],
   example:'Si quiere organizar un encuentro con amistades, una opción es proponer un día; otra es preguntar primero quién puede. No decidas por él.',
   why:'Comparar alternativas sobre un objetivo que realmente eligió ofrece una práctica de autonomía y planificación sin control adulto excesivo.',
   observe:'Valorá su decisión, aunque no quiera ejecutar el plan hoy.',
   ifNo:'Si no quiere planificar, cambiá de tema sin insistir.',
   skill:'Planificación autónoma y evaluación de alternativas'
  }
 }
};

const families={
 withBabyOnly:{
  title:'Un estribillo tranquilo para compartir',
  intro:'Van a compartir una canción breve con el bebé en un momento cómodo, sin esperar respuestas ni sumar una actividad exigente.',
  setup:'Elegí un lugar tranquilo donde puedas acompañarlo en una postura segura y cómoda. No necesitás música grabada ni materiales.',
  opening:'«Hoy tenemos un ratito para cantar juntos. Te voy a tararear nuestra canción.»',
  steps:['Elegí una canción sencilla que conozcas y cantá un fragmento con voz suave.','Cuando termine, quedate cerca en silencio. Si el bebé necesita cuidados, atendelos primero y cerrá el momento.'],
  example:'Podés tararear una estrofa de una canción familiar mientras lo acompañás en brazos con el sostén que necesita. No busques que imite ningún gesto.',
  why:'Compartir una canción en un momento de calma permite estar presentes en familia sin convertir las señales del bebé en resultados.',
  observe:'Recordá si fue un momento cómodo para ambos, sin medir respuestas.',
  ifNo:'Si necesita dormir, alimentarse o estar tranquilo, terminá la canción y acompañá su necesidad.'
 },
 withBaby:{
  title:'Una canción que elegimos en familia',
  intro:'Van a elegir una canción conocida para compartir unos minutos. Quienes sean mayores pueden decidir cuál; el bebé simplemente acompaña con comodidad.',
  setup:'Busquen un lugar tranquilo para sentarse. Asegurá una postura cómoda y segura para el bebé. No hace falta pantalla ni preparar objetos.',
  opening:'«¿Qué canción podríamos compartir hoy? Podemos elegir entre todos, sin apuro.»',
  steps:['Ofrecé que alguien de los mayores proponga una canción que conozcan y aceptá otra idea si surge.','Cantá un fragmento con quien tenga ganas; el bebé puede escuchar de manera tranquila y terminar cuando necesite cuidados.'],
  example:'Una persona mayor elige una canción de una película y vos empezás a tararearla. Si el bebé necesita atención, bajás la voz y lo cuidás primero.',
  why:'Compartir una decisión auténtica de quienes tienen ganas de participar ofrece una experiencia familiar sencilla, sin exigirle al bebé cumplir un papel.',
  observe:'Recordá alguna elección o momento que hayan disfrutado juntos.',
  ifNo:'Si nadie tiene ganas de cantar, podés dejar la propuesta para otro momento sin insistir.'
 },
 noBaby:{
  title:'Tres ideas para una aventura en casa',
  intro:'Van a inventar juntos una aventura breve con una idea de cada persona, sin competir por quién propone la mejor.',
  setup:'Busquen un lugar cómodo para compartir diez o quince minutos. Si quieren, tengan una hoja para dibujar; no es necesaria.',
  opening:'«¿Inventamos una aventura donde cada quien agregue una idea? Puede ser cualquier cosa que nos divierta.»',
  steps:['Invitá a cada persona a proponer un lugar, personaje o situación, y anotá las ideas solo si lo desean.','Construyan una historia corta usando las ideas que quieran y ciérrenla cuando el grupo sienta que terminó.'],
  example:'Alguien imagina una ciudad bajo el mar y otra persona agrega un tren que la recorre. Acompañá las ideas sin decidir vos toda la historia.',
  why:'Inventar algo juntos y aceptar aportes distintos ofrece un momento compartido donde cada voz puede tener lugar sin presión.',
  observe:'Guardá una ocurrencia que haya hecho sonreír a alguien.',
  ifNo:'Si alguien prefiere mirar o escuchar, puede hacerlo sin obligación de participar.'
 }
};
const safeText=value=>String(value||'').replace(/[<>{}\n\r]/g,' ').trim().slice(0,120);
export const stageFor=child=>{
 if(Number(child?.age)<2){
  const months=Number.isInteger(child.ageMonths)?child.ageMonths:Number(child.age)*12;
  if(months<4)return 'baby-early';
  if(months<12)return 'baby-middle';
  if(months<18)return 'baby-late';
  return 'toddler';
 }
 if(Number(child?.age)<6)return 'child-early';
 if(Number(child?.age)<10)return 'child-middle';
 return 'teen';
};
const allowedKind=new Set(['conectar','comprender','sembrar']);
export function curatedMission(child,kind,monthlyGoal){
 if(!allowedKind.has(kind))throw Error('huella_fallback_invalid_kind');
 const source=missions[stageFor(child)]?.[kind];
 if(!source)throw Error('huella_fallback_missing_stage');
 const target=safeText(child?.goal)||safeText(child?.interests?.[0])||safeText(monthlyGoal)||'compartir tiempo';
 return {...structuredClone(source),kind,target,source:'curated_safe_alternative'};
}
export function curatedFamily(children){
 const withBaby=children.some(c=>Number(c.age)<2);
 const hasOlder=children.some(c=>Number(c.age)>=2);
 const key=withBaby?(hasOlder?'withBaby':'withBabyOnly'):'noBaby';
 return {...structuredClone(families[key]),kind:'familiar',source:'curated_safe_alternative'};
}
