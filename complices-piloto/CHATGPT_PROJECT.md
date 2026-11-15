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
