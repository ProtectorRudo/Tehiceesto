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

`CERCA_DATABASE_URL` = URI de Session Pooler con usuario `cerca_worker.efvvadfxuyieswdqnsjg`, contraseña exclusiva y puerto `5432`; hostname **copiado de Supabase Connect**, no inferido.

`CERCA_DB_CA_PEM` = certificado de confianza opcional cuando corresponda.

`META_APP_SECRET`, `META_VERIFY_TOKEN`, `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID`, `META_TEMPLATE_DAILY`, `META_TEMPLATE_WEEKLY` = credenciales y plantillas de Meta.

`CERCA_SEND_MODE=disabled` (después `test` con `CERCA_TEST_WA_IDS` y `CERCA_TEMPLATES_APPROVED=true`, nunca pasar a `production` sin prueba completa).

`CRON_SECRET` = token de autenticación del disparador programado, generado y guardado solo en Render.

Ver detalle completo en `docs/SEGUNDA_ETAPA.md`.

## Pruebas locales

`npm test` (Node >=22). Las pruebas no generan cargos ni mensajes reales; usan sustitutos de Meta y DB.

## Aislamiento y límites

La separación es **lógica**, no física: se comparten cuotas, respaldos y disponibilidad del mismo proyecto. CERCA no usa Auth ni Storage de los otros negocios. Cada familia se identifica internamente mediante el WhatsApp del adulto que consintió; solo el backend con firma verificada de Meta consulta esas filas. Datos sensibles de menores deben mantenerse mínimos.