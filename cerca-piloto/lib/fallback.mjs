// Biblioteca editorial de contingencia por franja etaria: útil incluso si la IA está indisponible.
// No inventa aficiones ni atributos del menor. No atribuir estas propuestas a una generación IA.
const templates={
 baby:[
 ["El juego de las respuestas","Sentate a su altura, esperá que mire, mueva o vocalice algo y respondé con una sonrisa o un sonido parecido. Hacé pausas para darle tiempo, sin exigir ninguna reacción.","Responder a sus señales promueve una interacción atenta y respetuosa.",5],
 ["Un minuto para observar","Elegí un rato tranquilo y observá qué llama su atención. Seguí su mirada o gesto y nombrá suavemente lo que ve, sin dirigirle todo el tiempo.","Observar antes de intervenir ayuda a conocer su ritmo y sus intereses.",5],
 ["Palabras para lo cotidiano","Durante una rutina habitual, nombrá dos acciones que ya están sucediendo y dejá un silencio entre frases. Sin objetos pequeños ni materiales nuevos.","Vincular palabras con experiencias reales acompaña la comunicación temprana.",5]
 ],
 little:[
 ["Un momento a su elección","Ofrecele dos juegos sencillos que ya tengan en casa. Seguí su elección durante unos minutos y dejá que marque el ritmo, sin corregir las reglas.","Ceder pequeñas decisiones da espacio a su iniciativa y conexión.",10],
 ["Descubrir lo que sintió","Mientras dibujan o miran una imagen que ya tengan, nombrá una emoción posible y preguntá qué cree que siente el personaje. Escuchá sin respuestas correctas.","Hablar de emociones a través de personajes permite explorar sin presionar.",8],
 ["Una tarea de dos","Invitalo a guardar juntos cinco objetos grandes y seguros que ya estén fuera de lugar. Elegí una parte para cada uno, con ayuda y sin convertirlo en prueba.","Una colaboración breve practica autonomía con acompañamiento.",7]
 ],
 school:[
 ["La pregunta inesperada","Invitalo a elegir entre inventar un lugar nuevo o recordar un momento divertido. Compartí también tu respuesta y seguí su idea sin corregirla.","Intercambiar imaginación y recuerdos abre una conversación compartida.",10],
 ["Escuchar sin solucionar","En un momento tranquilo, preguntale qué parte de la semana le resultó más interesante o difícil. Si quiere contar, escuchá y preguntá si desea ideas o solo compañía.","Dar espacio a su perspectiva fortalece confianza y escucha.",10],
 ["Plan de una pequeña decisión","Elegí una tarea cotidiana segura que le corresponda y ofrecé dos maneras de organizarla. Dejá que decida y revisen juntos qué funcionó, sin premios ni castigos.","Practicar decisiones pequeñas ayuda a desarrollar autonomía.",10]
 ],
 teen:[
 ["Diez minutos de su mundo","Ofrecé un rato sin pantallas propias para que te muestre o te cuente algo que le interese. Si no tiene ganas, ofrecé acompañarlo en silencio.","La disponibilidad sin interrogatorios mantiene abierta la conexión.",10],
 ["Una opinión sin debate","Preguntale por una decisión cotidiana donde le gustaría tener más voz. Escuchá sus razones y resumí lo que entendiste antes de responder.","Ser escuchado con respeto favorece el diálogo y la confianza.",10],
 ["Elegir una responsabilidad","Conversen sobre una tarea personal que quiera resolver con mayor independencia. Ofrecé ayuda si la pide y definan juntos un primer paso realista.","Dar autonomía gradual acompaña el desarrollo de habilidades.",10]
 ]
};
export function editorialMissions(children){
 return children.flatMap(c=>{
  const age=Math.min(18,Math.max(0,Number(c.age_years)||0));
  const band=age<2?"baby":age<5?"little":age<11?"school":"teen";
  return templates[band].map(([title,how,why,minutes],i)=>({
    child_id:c.id,kind:["conectar","comprender","sembrar"][i],
    title,how,why,minutes,origin:"editorial"
  }));
 });
}
export function editorialWeekly(){
 return {title:"La cápsula de esta semana",how:"Invitá a quienes quieran participar a recordar un momento agradable de la semana. Cada persona puede contarlo, dibujarlo o simplemente escuchar. Anotá una frase que quieran conservar, sin exigir participación.",why:"Crear un recuerdo compartido y accesible para distintas edades, sin convertirlo en obligación.",minutes:20,origin:"editorial"};
}
