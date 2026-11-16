# Cómplices — verificación del piloto (15/11/2026)

## Alcance y separación
- URL piloto: https://complices-piloto.onrender.com
- Servicio Render: `srv-dbsshiuk1f9s73a61afg`.
- GitHub: rama `piloto-complices-20261115`, directorio `complices-piloto/`.
- Supabase compartido con TeHiceEsto, **solo** objetos `cp_*`; no modificar regalos, pedidos ni pagos.
- Monetización, WhatsApp y recordatorios diarios con app cerrada: todavía no disponibles.

## Evidencias de pruebas de base (sin persistir identidades)
Se usaron identidades de prueba transitorias en transacciones SQL, revertidas con `ROLLBACK`.
- 10/10: cada pareja solo puede ver sus espacios y mensajes; preferencias y respuestas individuales inaccesibles para terceros; no se puede escribir en espacios ajenos.
- 5/5: crear espacio con RLS; segunda persona acepta invitación; acceso privado; preferencias iniciales; rechazo de una tercera cuenta.
- 5/5: preferencias y endpoints push invisibles para otros, horario de silencio efectivo, aviso habilitado fuera del silencio y sin duplicado.
- 5/5: crear espacio y preferencias en una sola operación atómica, obtener invitación de 24 caracteres y bloquear un segundo espacio para el mismo usuario.

**No equivalen a una prueba E2E** de navegador, correo real, notificación recibida ni IA generativa.

## Pruebas obligatorias con dos teléfonos reales
1. Revisar `https://supabase.com/dashboard/project/efvvadfxuyieswdqnsjg/auth/url-configuration`: añadir `https://complices-piloto.onrender.com/**` a **Redirect URLs** sin modificar el **Site URL** de TeHiceEsto.
2. En Android, abrir el enlace, crear cuenta y confirmar correo. Revisar que regrese a Cómplices y permita iniciar sesión.
3. Crear espacio; compartir invitación desde el teléfono A; abrirla en teléfono B; crear segunda cuenta, confirmar, unirse. Comprobar que el código no se pierda.
4. Guardar gustos en cada cuenta. Verificar sugerencia al otro solo con `allow_surprises` activado; desactivar y confirmar que vuelva a una sugerencia general.
5. Enviar pregunta, responder, marcar misión como hecha en cada cuenta, comprobar corazones. Abrir juegos en ambos móviles y verificar revelación solo cuando ambos hayan respondido.
6. Probar mensajes privados y que ninguna cuenta vea las respuestas privadas del otro al cómplice.
7. En ambos dispositivos, aceptar notificaciones desde la web instalada si corresponde; enviar mensaje mientras el otro celular tiene la app cerrada. Revisar horario de silencio y desactivar avisos.
8. Crear una clave API de OpenAI desde el panel de la API, cargarla **solo** como `OPENAI_API_KEY` en las variables secretas de Render, con presupuesto de uso; verificar el estado de `/api/status` y probar 3 preguntas personalizadas. ChatGPT Plus no provee automáticamente créditos ni clave API.

## Riesgos/bloqueos pendientes
- Sin redirección permitida en Supabase, los enlaces de confirmación pueden llevar a TeHiceEsto. No tocar el Site URL.
- La instalación PWA y recepción Web Push dependen de permisos y políticas de cada teléfono.
- Las preferencias de notificación incluyen período de silencio en horario de Argentina. Los avisos automáticos cotidianos no están implementados.
- No prometer cifrado extremo a extremo; usar RLS y TLS, no exponer información privada en notificaciones.
- Para separar aún más el piloto de uso comercial, agregar exportación y eliminación segura por usuario.
- No habilitar pagos antes del piloto de 30 días y prueba con 10 a 20 parejas adultas.

## Normas de continuidad
Verificar estado de GitHub, Supabase y Render antes de publicar. Ejecutar migraciones aditivas con RLS. No repetir tareas hechas ni exponer secretos. Distinguir compilado, publicado y probado con dos cuentas reales.

## Mejoras publicadas en esta iteración
- Código de invitación conservado durante el alta y usado en enlace de confirmación si la URL está permitida en Supabase.
- Configuración personal de notificaciones con activación, desactivación y horario de silencio.
- Al cerrar sesión, el navegador deja de recibir notificaciones de la cuenta.
- Creación atómica de espacios por RPC `cp_create_space`; evita alta parcialmente realizada.
- Endpoint de diagnóstico no sensible `GET /api/status` con modo de IA y bandera de Push.


## Motor central incorporado en esta iteración
- Objetos nuevos: `cp_ai_memories`, `cp_ai_activities`, `cp_ai_feedback` con políticas que limitan lectura y escritura a la cuenta dueña.
- Comprobación SQL transaccional: **9/9 controles aprobados** sobre aislamiento entre integrantes de la misma pareja, escritura y lectura privadas, retroalimentación y actualización autorizada. Pruebas revertidas sin dejar datos ficticios.
- Recomendaciones guiadas de diario, semanal y juego, con persistencia, favoritos/descartes y cambio de actividades pendientes al actualizar el perfil.
- **Diferencia de estados:** código implementado ≠ publicado ≠ probado desde dos móviles. Validar logs del último despliegue antes de informar LIVE.
- La IA generativa no funciona si falta `OPENAI_API_KEY`; el motor algorítmico sí puede recomendar actividades sin llamar a la API.


## Nueva verificación: pistas cruzadas, privacidad y recomendaciones
- 8/8 pruebas SQL para que un miembro reciba solo temas autorizados, sin texto libre; sin acceso a otra pareja; revocación inmediata de permisos generales o particulares (transacciones reversibles).
- 5/5 pruebas adicionales: los datos «evitar» NO se transforman en recomendaciones positivas; solo se transmiten los temas positivos y revocables; no hay acceso directo a respuestas.
- Pruebas automáticas añadidas para que temas no autorizados/desconocidos no afecten la selección, las pistas del otro no revelen su texto y la generación siga determinista.
- Todavía faltan dos cuentas reales, correos de confirmación, push en teléfonos y OpenAI API conectada. No confundir tests SQL/build con prueba real de uso.


## Exportación y borrado privado
- 14/14 pruebas SQL (ROLLBACK) con dos cuentas: exportación no incluye mensajes, respuestas ni recuerdos escritos por el otro; borrado no afecta al otro, a los corazones previos, al chat ni a la pareja.
- Interfaz: exportar JSON local, borrar memoria IA con doble confirmación. El borrado real solo ocurre si el usuario lo solicita desde su sesión.
- No elimina cuenta Supabase Auth compartida con TeHiceEsto. La eliminación completa de cuenta y espacio requiere otro flujo.


## IA central: perfil de gustos estructurado y motor cruzado (15/11/2026)
- La IA de cada integrante usa información privada propia (preferencias, reflexiones autorizadas, recuerdos opt-in, respuestas estructuradas). Solo usa información de la otra persona si esta habilitó pistas explícitas.
- Nuevas 9 preguntas estructuradas en `lib/ai-profile.mjs`: afecto, detalle, plan, ritmo, presupuesto, horario, conversaciones, cosas a evitar y objetivo de pareja. `cp_ai_profile_cards` almacena solo elección codificada, con RLS por `user_id` y `share_with_partner_ai=false` por defecto. No copiar textos de confesiones.
- Función `cp_partner_profile(p_space,p_internal_secret)` con `SECURITY DEFINER` restringido: solo dos cuentas de la misma pareja pueden invocar, exige secreto interno exclusivamente en Render (`CP_PROFILE_INTERNAL_KEY`), verifica `auth.uid()`, pertenencia y `cp_preferences.allow_surprises` del dueño. No entrega notas ni respuestas libres, únicamente códigos validados por whitelist. El cliente no recibe ese secreto.
- Ruta `/api/central`: personaliza 2 actividades diarias, 1 semanal y 1 pregunta/juego con opciones explícitas; crea recomendaciones accionables y respeta presupuesto/ritmo/límites; mantiene intactas las actividades ya marcadas realizadas. Usa ambos perfiles de manera separada.
- Ruta `/api/complice`: modo guiado usa ideas adaptadas a las pistas autorizadas; con `OPENAI_API_KEY` real agrega ambos perfiles autorizados a un prompt que prohíbe citar la fuente o divulgar confesiones. Un validador `isIdeaCompatible` rechaza sugerencias generativas que contradigan límites comunes.
- La pantalla «Mi cómplice» muestra cuestionario progresivo, progreso de respuestas, selección de permiso por cada pista, edición y eliminación; advierte que además hay un permiso global para sorpresas.
- `cp_export_my_personal_data()` incluye las respuestas codificadas propias, y `cp_reset_my_ai_profile()` también las elimina, sin afectar a la pareja.
- **Prueba SQL transaccional: 13/13 aprobadas**, incluyendo acceso cruzado, permisos, revocación, exportación y borrado. Tests de Node en `tests/partner-personalization.test.mjs` y el resto de suites corren en el build.
- Pendientes reales: no se probó la IA de OpenAI con una clave ni la experiencia entre dos cuentas reales en celulares. No confundir motor guiado personalizado con LLM generativo.


## Evolución de producto: IA central invisible, sin chat (16/11/2026)
Decisión explícita: Cómplices **NO** debe presentar conversaciones de una persona con la IA. La IA trabaja como motor central que aprende mediante preguntas de perfil, preferencias autorizadas, misiones realizadas, opiniones sobre recomendaciones y recuerdos personales voluntarios.

Implementado en código:
- «Mi cómplice» muestra un tablero de inteligencia, el mapa de 9 preguntas, progreso, permisos por pista y sugerencia automática. La conversación directa con IA fue retirada. El endpoint POST \`/api/complice\` responde **410**; se conserva por separado el chat privado entre dos integrantes.
- Inicio: si faltan respuestas del perfil, ofrece una sola pregunta de conocimiento, sin obligar a contestarla.
- Motor \`/api/central\`: al ingresar o regresar a la aplicación obtiene cuatro actividades personalizadas para la persona autenticada (dos diarias, una semanal y un juego/pregunta). OpenAI puede generar las cuatro en JSON estricto; ante límites, respuesta no válida o indisponibilidad, conserva su equivalente guiado seguro. Las tareas ya realizadas no se reescriben.
- Aprendizaje pasivo: los temas de misiones **realizadas por el propio usuario** aportan una señal pequeña al motor, separada de los 👍/👎 explícitos. No se interpretan como consentimiento para compartir la información con la pareja.
- El sistema revisa las propuestas cuando se ingresa y al volver al navegador, con un intervalo mínimo de cinco minutos para evitar consultas redundantes; también al guardar o borrar preferencias propias.
- Las respuestas de cada cuenta quedan bajo RLS. Las pistas cruzadas requieren el permiso global y el permiso particular; el otro nunca recibe respuestas literales. Se auditó y endureció \`cp_partner_surprise\`: dejó de inferir regalos basados en campos generales de preferencias sin la autorización de una pista específica.
- Se agregaron pruebas automáticas del motor proactivo, chat IA deshabilitado y fallback para propuestas inválidas; validación transaccional SQL 5/5 para el permiso de sorpresas, incluida su revocación y exclusión de terceros.

Límites honestos:
- El sitio aún no realiza generación diaria programada mientras está cerrado, ni envía por sí solo recordatorios diarios de fondo.
- No se han realizado pruebas reales de personalización cruzada con dos cuentas activas: la última verificación de Supabase informó **1 integrante, 1 espacio, 0 respuestas estructuradas**. Las pruebas SQL anteriores usaron usuarios sintéticos y se revirtieron.
- La sola compilación y publicación **no** prueban la calidad de las cuatro propuestas de OpenAI. Es necesaria prueba en teléfono y revisión de recomendaciones reales.
- No modificar TeHiceEsto.com, \`main\` ni sus tablas comerciales. Todos los cambios siguen aislados en \`complices-piloto/\` y \`cp_*\`.


## Aprobado: calendario 3 + 3 + 1 y deseos con inferencia emocional (16/11/2026)
- **Tres misiones por cada integrante por semana**, una en cada uno de tres días alternados. Los seis días de misión de la pareja no se superponen, y el domingo no se programa misión individual nueva. Se alternan los días de A y B en semanas sucesivas.
- **Una misión semanal por pareja**: rota entre una misión individual encargada al miembro A, otra al miembro B y otra compartida para los dos. En la compartida ambos reciben exactamente el mismo texto, sin datos privados.
- Misiones individuales preparadas al principio de la semana pero **ocultas hasta el día asignado**. Si no se realizan ese día siguen disponibles el resto de la semana, sin rachas ni castigos. Juegos y preguntas quedan fuera de la cuota de misiones.
- **La IA no copia literalmente los deseos privados**. Se incorporó al cuestionario personal una décima pregunta sobre necesidad emocional: reconocimiento, iniciativa, prioridad, complicidad, seguridad o escucha. Una pista solo pasa al cómplice del otro si su titular activa el permiso de esa respuesta y el permiso global; nunca el texto libre de una confesión.
- Si una persona desea, por ejemplo, que aparezca una foto de la pareja en WhatsApp, el modelo no propone «cambiá tu foto de perfil». La señal general autorizada «reconocimiento» debe inspirar **acciones indirectas, originales y respetuosas**, como celebrar un recuerdo compartido de manera privada. El filtro de calidad rechaza misiones que pidan cambiar perfiles de redes.
- Los deseos estructurados se guardan en la tabla privada existente `cp_ai_profile_cards`, no en memoria del modelo ni en un chat. Siguen teniendo RLS, exportación, eliminación y revocación de permisos. No se ha hecho fine-tuning: hay contexto privado persistente, prompt inteligente y validación de salida.
- Código del calendario: `lib/mission-schedule.mjs`, `lib/weekly-missions.mjs`; motor `app/api/central/route.js` con huella `weekly_three_each_v4`. Tests nuevos `tests/couple-schedule.test.mjs`. Tabla `cp_ai_activities` admite slots `mission_1,mission_2,mission_3` junto a los antiguos, sin borrar datos históricos.
- Pendientes: prueba real de la cadencia y de recomendaciones cruzadas entre **dos usuarios**, aún no disponible en último control (1 integrante, 0 respuestas estructuradas), y prueba de calidad de las generaciones LLM. El backend prepara misiones cuando se abre la web o se actualizan gustos, no ejecuta tareas con app cerrada.


## Inteligencia de relación: fechas, profundidad y presencia semanal (16/11/2026)

### Objetivo
Cómplices debe hacerse útil con el tiempo sin invadir la vida de la pareja. No persigue rachas ni una interacción diaria obligatoria. La IA conserva contexto personal autorizado y recuerda fechas reales.

### Implementación
- **Fechas importantes**: `public.cp_important_dates`, por persona y espacio, con RLS. Tipos: aniversario, primera cita/encuentro, primer beso, compromiso, cumpleaños, tradición y otro. Pueden repetirse anualmente o registrarse como evento único. Visibilidad **privada por defecto**, compartible de forma explícita; el propietario puede revocarla o eliminar la fecha. Una persona solo ve sus propias fechas y las que la otra autorizó. Las fechas propias forman parte de la exportación de datos.
- En la pantalla **Cómplice → Fechas que importan**, cada uno puede registrar, compartir o eliminar. En **Hoy**, se destacan fechas confirmadas que se acercan. `app/api/central/route.js` consulta las fechas bajo el JWT del usuario y las incluye en el contexto de OpenAI. Cuando hay un evento dentro de 14 días y le toca misión semanal individual, el modo guiado también puede proponer una sorpresa con sentido. No se inventan fechas ni se comparten las privadas ajenas.
- **Conocer a fondo**: `lib/relationship-intelligence.mjs` contiene 12 preguntas abiertas adicionales (q09–q20) sobre momentos que hicieron sentir elegido, apoyos concretos, rutinas, iniciativas, recuerdos y prioridades. Las 8 preguntas originales se conservan para no perder historiales. Se priorizan las profundas, sin obligar a responder. Las respuestas de texto siguen en `cp_reflections`, privadas por RLS; la IA propia solo las usa con `ai_use_allowed=true`. Los textos nunca se comparten literalmente con la otra cuenta.
- **Índice de conocimiento**: indicador 0–100 % de *cobertura de contexto útil* de la IA, no precisión, compatibilidad ni amor. Hasta 40 puntos por gustos estructurados, 32 por 4 reflexiones profundas autorizadas, 12 por 2 fechas conocidas, 16 por 4 señales de experiencia (valoraciones/cumplimientos). No otorga puntos por leer secretos ajenos.
- **Pregunta ocasional**: una pregunta personal diferente por semana, orientada a reconocer gestos, iniciativa, emociones cotidianas y recuerdos de la pareja. Se ofrece en **Hoy** en uno de los días libres del usuario cuando el otro ya está vinculado. La respuesta es privada y se puede permitir su uso para la propia IA por separado. No cuenta como misión ni añade obligaciones.
- **Web Push con la web cerrada**: nuevo permiso **Preguntas especiales** en el perfil, separado del permiso general de notificaciones; apagado por defecto. El Cron existente de Supabase (`pg_cron` + `pg_net`) invoca el endpoint protegido `/api/engagement/dispatch` los viernes a las 19:30 de Buenos Aires. Se usan secretos internos guardados en Vault y Render, sin exposición al cliente. Una función con privilegios restringidos controla: ambas cuentas vinculadas, inscripción Push, opt-in doble, horario de silencio, pregunta no contestada y máximo una entrega por persona y semana. La notificación es genérica y no contiene confesiones ni respuestas personales. Las notificaciones existentes entre los dos integrantes permanecen sin cambios.
- El scheduler no llama a OpenAI: las preguntas semanales son seleccionadas de un catálogo curado y no generan cargos por tokens. No se agregó una suscripción comercial ni infraestructura paga nueva. La semana sigue teniendo 3 misiones por integrante más 1 semanal rotativa.
- **Seguridad comprobada**: 9/9 casos SQL de fechas y reflexiones, 5/5 de consentimiento/límite de avisos, con cuentas sintéticas y rollback. Las pruebas automatizadas en `tests/relationship-intelligence.test.mjs` cubren calendario, leap years, puntuación, preguntas y endpoint con autorización.

### Pendientes de validación piloto
- Dos cuentas reales todavía no se probaron. Último conteo antes de este cambio: **1 integrante / 0 respuestas de perfil**.
- No se probó una notificación real con Android/iOS y la aplicación cerrada. Las comprobaciones de RLS y el job programado no prueban recepción Web Push. El permiso del teléfono es individual.
- No se comprobó con una fecha verdadera si OpenAI propone la misión emocionalmente adecuada: requiere revisión humana del contenido generado.
- La PWA no realiza tareas cada minuto en segundo plano; únicamente el cron semanal programado puede solicitar un Push con la web cerrada.


## Corrección del guardado de gustos y aprendizaje continuo — 16/11/2026
- Causa verificada del fallo en «Mis gustos»: la tabla `cp_ai_profile_cards` otorgaba `SELECT, INSERT, DELETE` a `authenticated`, pero faltaba `UPDATE`. El componente usaba `upsert(onConflict: user_id,question_key)`, que necesita el permiso de actualización también. Se añadió `GRANT UPDATE` únicamente a esa tabla `cp_*`, manteniendo las políticas RLS propias de cada usuario. En transacción reversible, 5/5 casos SQL pasaron: insertar, volver a guardar/editar, leer y aislamiento entre personas.
- UI: el guardado ahora requiere confirmación de la fila persistida (`.select(...).single()`), muestra éxito/error visible debajo del botón y avanza a la siguiente pregunta **sin repetir la misma**. La ficha cargada informa errores de lectura en vez de silenciarlos.
- El indicador del 100 % representa la **cobertura inicial de información**, nunca el final del aprendizaje. Tras las 12 preguntas profundas, Cómplices propone una pregunta nueva una vez por semana, adaptando un tema entre 10 dimensiones del perfil. OpenAI puede redactar una pregunta personalizada si hay clave, cuota y respuesta segura; si no, usa una pregunta cuidada. La pregunta se conserva en `cp_learning_questions` bajo RLS por usuario, sin costos repetidos en cada visita.
- La persona responde con sus propias palabras (almacenadas privadas en `cp_reflections`) y puede actualizar una **preferencia estructurada** que mejora las futuras misiones; si habilitó previamente la personalización para los dos, solo el código de gusto puede alimentar la IA de su pareja, nunca su texto.
- El 100 % permanece en el indicador del perfil inicial, acompañado de un contador de nuevos aprendizajes, sin inflar artificialmente el número. No se premia contestar por obligación.
- Se ampliaron exportación y borrado de la memoria personal para incluir preguntas generadas. 9/9 pruebas transaccionales SQL confirmaron lectura privada, aislamiento, exportación y borrado.
- Pendiente crítico: prueba real de botón en un teléfono y preguntas después de completar 12 respuestas; las pruebas SQL sintéticas se revierten y no sustituyen la experiencia de dos personas.
