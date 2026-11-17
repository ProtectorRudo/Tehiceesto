# CERCA — piloto WhatsApp con esquema aislado en Supabase compartido

**Actualizado 17/11/2026:** CERCA usa un esquema privado `cerca` dentro del proyecto Supabase de **Te Hice Esto** (no comparte tablas, datos ni claves con Te Hice Esto/Cómplices). `sql/002_cerca_shared_private.sql` se aplicó al proyecto confirmado y se verificaron permisos de acceso. No usar `sql/001_cerca_isolated.sql` en la base compartida: es un borrador anterior para un proyecto independiente.

La interfaz de madres, padres y cuidadores es **solo WhatsApp**. El backend usa la API oficial de Meta, flujo de registro determinista, consentimiento, tres misiones por hijo y una familiar semanal, historial, bajas y mensaje fijo para conversaciones fuera del servicio.

## Estado de integración

- El esquema `cerca` y sus tres tablas tienen RLS; `anon` y `authenticated` no tienen permiso de lectura; `cerca_worker` no puede leer tablas de Te Hice Esto ni Cómplices (prueba de privilegios real).
- La cuenta `cerca_worker` se creó como `NOLOGIN` por seguridad. Para conectar Render hace falta obtener de Supabase la **cadena de conexión de Session Pooler** y activar una contraseña exclusiva en el rol mediante un procedimiento seguro, sin guardar secretos en GitHub.
- El backend elegirá el adaptador privado `src/db_pg.mjs` únicamente cuando `CERCA_DATABASE_URL` esté configurada. No se admite usar la credencial `SUPABASE_SERVICE_ROLE_KEY` compartida en producción.
- **`CERCA_SEND_MODE=disabled` por defecto.** No se emiten mensajes de WhatsApp hasta configurar Meta y aprobar plantillas.
- Render `cerca-piloto` debe publicar rama `cerca-piloto-20261116`, carpeta `cerca-piloto/`.

## Variables de Render (solo servidor)

`CERCA_DB_HOST` = hostname exacto del **Session Pooler** copiado de Supabase Connect (sin usuario ni contraseña). `CERCA_DB_PROJECT_REF=efvvadfxuyieswdqnsjg` y `CERCA_DB_PASSWORD` son secretos y metadatos guardados solo en Render; el backend construye internamente una conexión TLS al rol `cerca_worker` por puerto 5432. `CERCA_DATABASE_URL` queda como alternativa para instalaciones autónomas.

`CERCA_DB_CA_PEM` = certificado de confianza opcional cuando corresponda.

`META_APP_SECRET`, `META_VERIFY_TOKEN`, `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID`, `META_TEMPLATE_DAILY`, `META_TEMPLATE_WEEKLY` = credenciales y plantillas de Meta.

`CERCA_SEND_MODE=disabled` (después `test` con `CERCA_TEST_WA_IDS` y `CERCA_TEMPLATES_APPROVED=true`, nunca pasar a `production` sin prueba completa).

`CRON_SECRET` = token de autenticación del disparador programado, generado y guardado solo en Render.

Ver detalle completo en `docs/SEGUNDA_ETAPA.md`.

## Pruebas locales

`npm test` (Node >=22). Las pruebas no generan cargos ni mensajes reales; usan sustitutos de Meta y DB.

## Aislamiento y límites

La separación es **lógica**, no física: se comparten cuotas, respaldos y disponibilidad del mismo proyecto. CERCA no usa Auth ni Storage de los otros negocios. Cada familia se identifica internamente mediante el WhatsApp del adulto que consintió; solo el backend con firma verificada de Meta consulta esas filas. Datos sensibles de menores deben mantenerse mínimos.

## Prueba progresiva sin plantillas de marketing (v0.4.1)

- El registro y sus respuestas operan **solo dentro de la ventana de atención iniciada por el adulto**. Se permite probarlas con `CERCA_SEND_MODE=test`, `CERCA_TEST_WA_IDS` y las credenciales verificadas de Meta; **no requieren aprobar las plantillas diarias**. Solo teléfonos explícitamente habilitados.
- Las misiones programadas continúan **bloqueadas** hasta `CERCA_TEMPLATES_APPROVED=true` y los nombres de ambas plantillas aprobadas (`META_TEMPLATE_DAILY`, `META_TEMPLATE_WEEKLY`).
- La cola prioriza respuestas de registro/baja por delante de plantillas. Un reintento de webhook con antigüedad superior a 23 horas se ignora y las respuestas de servicio caducan antes de las 24 horas.
- Los envíos reales siguen desactivados en el despliegue actual: `CERCA_SEND_MODE=disabled`. Que un test pase no autoriza gastos ni significa que Meta o el cron estén conectados.
- Para completar la conexión de base faltan: hostname real del Session Pooler, contraseña exclusiva del rol `cerca_worker` provisionada por un canal seguro, conexión desde Render y prueba de acceso limitado desde la cuenta de ejecución. `cerca_worker` sigue `NOLOGIN` hasta esa configuración.

## Prioridad real de la cola (v0.4.1)

- La base de datos ordena mensajes de sesión antes de marketing **antes del límite SQL de 100 filas**. Antes solo se ordenaban los primeros 100 registros en memoria y una cola saturada podía ocultar mensajes de alta/baja.
- Los tests incluyen 150 campañas pendientes y una respuesta nueva, y verifican tanto el adaptador PostgreSQL como el adaptador simulado REST.
- Esta corrección no implica conexión real con la base ni aprobación de Meta. Para eso siguen pendientes la cuenta `cerca_worker` con LOGIN y contraseña restringida, hostname oficial del Session Pooler y las credenciales del número de Meta de prueba.

## Protección adicional (v0.4.2)

Los webhooks verifican `metadata.phone_number_id` para procesar únicamente el número comercial de CERCA cuando Meta envía eventos de varias líneas a una misma aplicación. Timestamps inválidos se descartan sin bloquear el webhook. Los trabajos proactivos expiran al terminar el día local de Argentina para evitar misiones atrasadas. El modelo editorial predeterminado cambia a `gpt-6.1-terra` (su acceso y rendimiento reales siguen pendientes de probar con una clave propia).