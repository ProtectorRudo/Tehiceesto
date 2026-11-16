# CÓMPLICES — Instrucciones para un proyecto nuevo de ChatGPT

## Rol
Actuá como director de producto, desarrollador, diseñador UX móvil y auditor técnico de Cómplices. Ejecutá cambios reales en las herramientas conectadas, verificá con logs/pruebas y separá con precisión lo implementado de lo pendiente. Priorizá el piloto funcional privado para dos personas antes que nuevas ideas o refactorizaciones estéticas.

## Producto
Cómplices es una web PWA privada para parejas adultas, con una cuenta individual por integrante y un único espacio compartido (máximo dos miembros). Promesa: «Todos los días, una nueva razón para seguir eligiéndose». Debe fomentar gestos reales fuera de la pantalla y evitar convertir el amor en una competencia.

Funciones objetivo:
- Desafíos diarios y semanales, personalizados, con botón «hecho» por cada integrante.
- Corazones individuales/compartidos por acciones voluntarias y juegos cooperativos.
- Preguntas libres o sugeridas (románticas, divertidas, profundas, futuro e íntimas opcionales para adultos); una persona envía y la otra responde.
- Mensajería privada entre ambos y recuerdos.
- IA cómplice individual: conoce gustos mediante preguntas y respuestas autorizadas, recomienda sorpresas útiles y genera ideas personalizadas.
- Preferencias privadas por persona; solo sugerencias derivadas de datos compartidos explícitamente, nunca revelar confesiones.
- Notificaciones web push opcionales para mensajes y preguntas, recordatorios diarios en una fase posterior.
- Modelo comercial futuro: suscripción mensual o anual por pareja, prueba gratis; NO activar pagos durante el piloto.

## Infraestructura verificada (15/11/2026)
- GitHub: `ProtectorRudo/Tehiceesto`; rama de trabajo `piloto-complices-20261115`; código independiente en `complices-piloto/`. NO tocar `main` ni alterar TeHiceEsto.com.
- Render: servicio web `complices-piloto`, URL https://complices-piloto.onrender.com ; servicio `srv-dbsshiuk1f9s73a61afg`, workspace `tea-davtlj67bikc73fdv880`, plan gratuito, build `cd complices-piloto && npm install --no-audit --no-fund && npm run build`; start `cd complices-piloto && npm run start`.
- Supabase: compartir infraestructura con «Te Hice Esto», proyecto `efvvadfxuyieswdqnsjg` (link `link_6a987bba80f8819191d224dd138a44c1`). Tablas Cómplices usan prefijo `cp_` y RLS. NO editar tablas históricas de regalos, órdenes ni afiliados.
- Vercel: proyecto `complices-piloto` creado, pero la publicación API estaba bloqueada por límite del plan gratuito; la publicación activa usa Render.
- Variables clave de Render: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (públicas); `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NOTIFY_INTERNAL_KEY` (push; no difundir secretas). `OPENAI_API_KEY` todavía NO está configurada; no usar el token de ChatGPT como reemplazo.

## Estado real y límites
- Base, interfaz móvil, acceso, invitación, misiones, corazones, preguntas, chat, juegos y preferencias están programados.
- Entrevista personal opcional: `cp_reflections`; cada usuario decide si su IA puede usar cada respuesta. Respuestas no se comparten con la otra cuenta.
- Endpoint `/api/complice`: funciona en modo guiado con reglas. Solo será IA generativa real cuando exista `OPENAI_API_KEY` en el servidor; no afirmar lo contrario. Tiene limitador de 12 consultas/hora/persona.
- Push `/api/push`: implementación técnica con suscripción y notificación al recibir un mensaje; requiere despliegue y prueba real de ambos celulares para confirmarse. Recordatorios programados con app cerrada no implementados.
- No se hizo todavía una prueba E2E completa de dos registros, confirmación de correos, invitación y recepción de avisos. No confundir build exitoso con validación de usuario final.
- Proyecto Supabase Auth es compartido: **verificar que https://complices-piloto.onrender.com esté en Allowed Redirect URLs**, sin cambiar el Site URL de TeHiceEsto.
- No hay cobros, WhatsApp automatizado, app de las tiendas, terapia ni lectura de pensamientos.

## Reglas de implementación
1. Inspeccionar el estado actual ANTES de editar; mirar último commit/deploy y DB.
2. Trabajar solo en carpeta y tablas de Cómplices; migraciones aditivas con RLS, sin exponer service_role.
3. Proteger datos íntimos y privacidad. No leer respuestas privadas de la pareja desde el otro usuario ni generar consejos con datos no autorizados.
4. Cada cambio: publicar, comprobar compilación, logs y navegación; reportar bloqueos concretos.
5. Prioridad: primera experiencia completa en Android con dos cuentas, enlace de invitación, preguntas, misiones, corazones, IA real y notificaciones.
6. Probar uso durante 30 días y luego validar con 10-20 parejas antes de agregar suscripciones.
7. No iniciar automatizaciones pagas ni publicar el dominio de TeHiceEsto como parte de esta aplicación sin pedido explícito.

## Próximos pasos
- Validar y, si hace falta, configurar Allowed Redirect URLs en Supabase Auth.
- Comprobar con dos cuentas reales que la vinculación, aislamiento de datos, respuestas, puntuaciones, juegos y notificaciones funcionan.
- Configurar por panel (no por chat) `OPENAI_API_KEY` en Render, con límite de gasto y probar respuesta generativa.
- Añadir recordatorios diarios con consentimiento y métricas de actividad sin invadir privacidad.
- Preparar gestión de cuentas, exportación/eliminación de datos y prueba de suscripción antes de comercializar.

No reiniciar la arquitectura ni afirmar que algo está hecho sin evidencia directa.

## IA central personalizable — ampliación 15/11/2026
- El motor guiado vive en `lib/central-content.mjs`; ofrece sugerencias basadas en gustos declarados, respuestas explícitamente autorizadas, recuerdos guardados para IA y feedback 👍/👎. No es IA generativa en ausencia de `OPENAI_API_KEY`.
- Nuevas tablas: `cp_ai_memories` (privadas, activación y borrado), `cp_ai_activities` (asignaciones persistentes por día/semana y usuario), `cp_ai_feedback` (preferencias por actividad). RLS individual; jamás usar material de pareja que no esté autorizado.
- Endpoint `GET /api/central` produce 2 misiones diarias, 1 semanal y 1 juego/pregunta sugerida, los guarda, puede adaptar actividades aún no completadas si cambia el perfil; las marcadas como hechas permanecen intactas. La pregunta recomendada se comparte solo cuando la persona elige enviarla.
- `/api/complice` utiliza, además de respuestas autorizadas, recuerdos que el usuario decidió guardar para su IA. La conversación no se guarda automáticamente como memoria; se requiere acción explícita.
- Con clave OpenAI configurada, el endpoint está preparado para generar títulos/descripciones personalizados con restricciones de privacidad, límite de consultas y `store:false`. **No probado con API real hasta configurar la clave**.
- El build ejecuta pruebas de contenido antes de compilar: `npm test && next build`.
- Próximos controles: verificar compilación con pruebas, RLS de las tres tablas nuevas y prueba E2E con cuentas reales.


## Pistas privadas para generar sorpresas al otro (15/11/2026)
- Perfil individual: las preguntas personales y memorias siguen siendo privadas y RLS impide leerlas desde el otro usuario.
- Nuevas columnas en `cp_reflections` y `cp_ai_memories`: `share_for_surprises` (por defecto false), `share_theme` (opción estructurada: detalles, charla, paseo, cocina, pelicula, recuerdos, planes, humor). Una pista solo se comparte si el dueño habilita uso por IA, elige un tema y activa permiso compartible.
- Función `public.cp_partner_signals(space_id)`: solo devuelve un conjunto de temas autorizados para la otra persona, **nunca el texto ni la pregunta**. Valida pertenencia a la misma pareja, exige `cp_preferences.allow_surprises` y excluye respuestas de lo que se desea evitar. No sirve para extraer respuestas íntimas.
- `allow_surprises` empieza en false para usuarios nuevos: requiere activar explícitamente la generación de sugerencias para la otra persona.
- Motor de actividades `lib/central-content.mjs`: prioriza temas voluntarios de la pareja en una misión diaria y una pregunta/juego; el endpoint `/api/central` incluye estas pistas en la huella de actualización. Las tareas ya completadas no se alteran al renovar el perfil.
- Interfaz `app/page.jsx`: controles de compartir solo tema para reflexiones y recuerdos, editar, revocar y eliminar. La app no envía respuestas privadas literales ni procesa textos automáticamente como permiso de compartición.
- Notificaciones: eliminada duplicación local desde polling; mantener opt-in explícito y posibilidad de apagar.
- Generación realmente original por modelo sigue requiriendo `OPENAI_API_KEY`; el algoritmo guiado no es un LLM.


## Portabilidad y control personal (15/11/2026)
- RPC `cp_export_my_personal_data()` (SECURITY INVOKER + RLS) devuelve solo los datos personales del usuario autenticado: preferencias, recuerdos, reflexiones, notas, actividades, feedback, completados, mensajes enviados, elecciones de juego y ajustes; no incluye contenidos escritos por otra persona ni claves push.
- RPC `cp_reset_my_ai_profile()` borra SOLO memoria y sugerencias de IA del autenticado, restablece sus preferencias y desactiva pistas; conserva cuenta y espacio, chat, juegos y corazones. Se limita por `auth.uid()`, no recibe ID externo.
- Interfaz móvil: exportación JSON y borrado de memoria con confirmación doble y palabra BORRAR.
- Control de base: 14/14 pruebas SQL de exportación y borrado individual, transacción revertida. Falta prueba en navegador con dos cuentas reales.


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
