# Cómplices — estándar de misiones con sentido (noviembre 2026)

Una misión tiene que dejar una sensación humana: «Pensó en mí y se acordó de lo que me gusta». No tiene que parecer una obligación escolar ni una frase romántica vacía.

## Reglas
- Diarias: entre 5 y 15 minutos. Semanales: 15 a 45 minutos.
- Debe haber una acción concreta, un detalle reconocible (mate, receta, foto, canción, nota, paseo, ayuda cotidiana) y una intención afectiva auténtica.
- Sin gasto obligatorio ni materiales difíciles de conseguir. Cada persona puede rechazar cualquier actividad sin penalización.
- Cuando existen gustos del otro autorizados explícitamente, cada propuesta debe tener una relación verificable con esos gustos.
- Cuando todavía no hay gustos autorizados, no inventar preferencias. Ofrecer un gesto universal, sencillo y con significado.
- No usar confidencias, chat de pareja ni datos íntimos de la otra persona como contexto de generación.
- Evitar repeticiones recientes. Alternar recuerdos, detalles, juego, ayuda y pequeños momentos.
- Rechazar propuestas vagas, caras, extensas, repetidas, ajenas al perfil autorizado o que impliquen contacto físico sin consentimiento.

## Implementación
- Motor principal: app/api/central/route.js
- Evaluación editorial: lib/mission-quality.mjs
- Misiones originales de respaldo: lib/meaningful-playbook.mjs (56 opciones curadas en ocho temas)
- Adaptación por preferencias individuales autorizadas: lib/meaningful-partner.mjs
- Pruebas: tests/meaningful-missions.test.mjs
- Revisión de cache: meaningful_missions_v3, sin alterar misiones ya cumplidas

Ejemplo: si la otra persona autorizó que disfruta el mate, no sugerir simplemente «pasen tiempo juntos»; recomendar cebarle uno si tienen mate en casa y acompañarlo con una nota que recuerde algo verdadero de la relación.

El trabajo no es un nuevo entrenamiento de pesos del modelo: son mejores instrucciones para OpenAI, ejemplos, un evaluador automático y un respaldo curado. Una compilación correcta no demuestra aún que las cuatro misiones generativas sean buenas con personas reales.

Último estado de base al comenzar: 1 integrante, 0 respuestas de perfil, 4 actividades y 0 evaluaciones. Falta validación real con dos personas y permisos individuales. Las propuestas se preparan al entrar o actualizar preferencias; no existe aún generación diaria con la app cerrada.


## Aprobado: calendario 3 + 3 + 1 y deseos con inferencia emocional (16/11/2026)
- **Tres misiones por cada integrante por semana**, una en cada uno de tres días alternados. Los seis días de misión de la pareja no se superponen, y el domingo no se programa misión individual nueva. Se alternan los días de A y B en semanas sucesivas.
- **Una misión semanal por pareja**: rota entre una misión individual encargada al miembro A, otra al miembro B y otra compartida para los dos. En la compartida ambos reciben exactamente el mismo texto, sin datos privados.
- Misiones individuales preparadas al principio de la semana pero **ocultas hasta el día asignado**. Si no se realizan ese día siguen disponibles el resto de la semana, sin rachas ni castigos. Juegos y preguntas quedan fuera de la cuota de misiones.
- **La IA no copia literalmente los deseos privados**. Se incorporó al cuestionario personal una décima pregunta sobre necesidad emocional: reconocimiento, iniciativa, prioridad, complicidad, seguridad o escucha. Una pista solo pasa al cómplice del otro si su titular activa el permiso de esa respuesta y el permiso global; nunca el texto libre de una confesión.
- Si una persona desea, por ejemplo, que aparezca una foto de la pareja en WhatsApp, el modelo no propone «cambiá tu foto de perfil». La señal general autorizada «reconocimiento» debe inspirar **acciones indirectas, originales y respetuosas**, como celebrar un recuerdo compartido de manera privada. El filtro de calidad rechaza misiones que pidan cambiar perfiles de redes.
- Los deseos estructurados se guardan en la tabla privada existente `cp_ai_profile_cards`, no en memoria del modelo ni en un chat. Siguen teniendo RLS, exportación, eliminación y revocación de permisos. No se ha hecho fine-tuning: hay contexto privado persistente, prompt inteligente y validación de salida.
- Código del calendario: `lib/mission-schedule.mjs`, `lib/weekly-missions.mjs`; motor `app/api/central/route.js` con huella `weekly_three_each_v4`. Tests nuevos `tests/couple-schedule.test.mjs`. Tabla `cp_ai_activities` admite slots `mission_1,mission_2,mission_3` junto a los antiguos, sin borrar datos históricos.
- Pendientes: prueba real de la cadencia y de recomendaciones cruzadas entre **dos usuarios**, aún no disponible en último control (1 integrante, 0 respuestas estructuradas), y prueba de calidad de las generaciones LLM. El backend prepara misiones cuando se abre la web o se actualizan gustos, no ejecuta tareas con app cerrada.
