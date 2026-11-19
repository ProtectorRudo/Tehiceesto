# HUELLA — mejora editorial para bebés y tercera prueba enfocada

## Motivo de la mejora
En la segunda evaluación real, las misiones para la hija mayor fueron claras y disfrutables, pero dos propuestas de bebé se parecían a experimentos de reacción (mano cercana, gesto de boca repetido en respuesta a una patada) y la misión familiar era artificial. Los perfiles existentes guardan años; para menores de 2, eso es poco preciso.

## Flujos limitados, solo WhatsApp
- Durante el alta, si la edad es 0 o 1 año, se consulta opcionalmente la edad aproximada en meses; no se registra DOB.
- Para familias ya dadas de alta: escribir EDAD BEBÉ y responder con los meses (0–23). Se guarda en su hijo correspondiente como ageMonths con ageMonthsUpdatedAt. El dato puede corregirse, no borra perfiles ni objetivos.
- Si hay dos bebés registrados, se solicita el número del perfil correcto.
- Si el adulto omite la pregunta durante el registro, queda sin dato; las llamadas de IA que dependan de la edad en meses se bloquean antes de cobrar, hasta que lo indique.
- No se inventan edades, hitos de desarrollo ni problemas clínicos.

## Criterio editorial
- Perfiles infantiles en meses pasan a la IA como dato mínimo, sin fecha de nacimiento.
- Las misiones para bebés son encuentros reales de juego y compañía, no exámenes del bebé. Rechazar señales artificiales como tratar una patada casual como un turno de conversación o proponer acercar la mano para medir reacción.
- Evitar lenguaje mecánico excesivo y no prometer resultados; respetar señales de comodidad, etapa real y cuidado seguro. La propuesta tiene que resultar disfrutable y natural.
- Conectar / Comprender / Sembrar mantienen funciones diferentes. Para Sembrar, ofrecer una oportunidad adecuada de practicar alguna habilidad cotidiana, sin ejercicios forzados.
- Las propuestas familiares deben involucrar auténticamente al niño mayor; el bebé no tiene obligación de jugar ni interpretar un papel.

## Tercera prueba, focalizada y con límite de costo
- Comando: PREVIA BEBÉ (acepta PREVIA BEBE).
- Se permite UNA generación de OpenAI por revisión, con deduplicación transaccional, consentimiento activo y una única cuenta WhatsApp autorizada en Evolution test.
- Antes de generar, se comprueba que la edad aproximada en meses esté guardada. Si falta, se indica EDAD BEBÉ, sin llamar a OpenAI.
- Se generan solo tres misiones infantiles nuevas y una familiar, con contexto mínimo de hermanos sin nombres, comparables con las anteriores.
- El comando PREVIA BEBÉ VER repite el resultado guardado sin volver a generar contenido.
- Un fallo no reinicia el límite; no se envía contenido genérico, no se marca nada como cumplido.
- Los resultados anteriores y los dos intentos de la primera vista previa permanecen intactos.
- No activar HUELLA_WEEKLY_V2_ENABLED, HUELLA_SOLO_PILOT_ENABLED, CERCA_EVOLUTION_SCHEDULED_ALLOWED ni el mes de 30 días.
- Evaluación humana sobre originalidad, claridad, naturalidad, adecuación por meses, propósito relacional y seguridad.

## Referencias pediátricas para criterios editoriales
- American Academy of Pediatrics, How Active Is Your Baby? https://www.healthychildren.org/English/ages-stages/baby/pages/How-Active-is-Your-Baby.aspx
- CDC, Milestones by 4 Months: https://www.cdc.gov/act-early/milestones/4-months.html

Estas guías orientan actividades seguras de juego e interacción; HUELLA no aplica un cribado de desarrollo ni ofrece diagnósticos.
