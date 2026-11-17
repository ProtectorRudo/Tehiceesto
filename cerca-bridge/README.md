# CERCA Bridge — instalación privada

## Objetivo

Servidor de conexión QR de WhatsApp exclusivo de CERCA usando la API Evolution (Baileys/WhatsApp Web). Separa **completamente** el estado de vinculación del esquema privado `cerca` de Supabase donde viven familias y misiones. No utiliza Whapi, Meta Cloud API ni Twilio. La conexión es **no oficial**; WhatsApp puede restringir o bloquear el número sin aviso.

## Estado verificado

- La aplicación CERCA tiene adaptador `evolution.mjs`, con validación de webhook y emisor `sendText`, y pruebas HTTP simuladas.
- Esta carpeta contiene una instalación **declarativa**, no desplegada. No se escaneó ningún QR ni se conectó un número real.
- Imagen Evolution fijada a `evoapicloud/evolution-api:v2.3.7`, tag confirmado en Docker Hub (17/11/2026). No cambiar a `latest` sin pruebas; auditar avisos de seguridad antes de operar públicamente.
- PostgreSQL, Redis y sesiones tienen volúmenes propios. Solo Caddy publica HTTPS. Se requieren VPS/Docker y un dominio apuntando al servidor; no crear recursos pagos sin autorización.
- Recomendación: probar con un número nuevo/exclusivo de CERCA. No usar números de Cotironda u otros proyectos.

## Despliegue de servidor (operador técnico)

1. Provisionar **un único** servidor VPS con Docker/Compose, volumen persistente y DNS `EVOLUTION_HOST` apuntando al VPS. Es un paso externo que requiere elección de alojamiento y puede costar dinero.
2. Copiar `.env.example` a `.env` y reemplazar **todos** los secretos con claves aleatorias únicas; ejemplos: `openssl rand -hex 32` (clave API, webhook y contraseñas). No usar caracteres reservados en contraseñas URI o codificarlos para la cadena PostgreSQL/Redis. No agregar `.env` a GitHub.
3. En el VPS: `docker compose config --quiet && docker compose up -d`.
4. Verificar `docker compose ps` y `curl -H "apikey: $EVOLUTION_API_KEY" https://$EVOLUTION_HOST/instance/fetchInstances`.
5. Ejecutar `node --env-file=.env configure.mjs` en el directorio `cerca-bridge/` (Node 22). El script instala el webhook privado y lee de vuelta su configuración.
6. En Render `cerca-piloto`, configurar **sin compartir secretos en chat**: `CERCA_PROVIDER=evolution`, `EVOLUTION_API_URL=https://<EVOLUTION_HOST>/`, `EVOLUTION_INSTANCE=cerca-piloto`, `EVOLUTION_API_KEY`, `CERCA_BRIDGE_WEBHOOK_SECRET`, y `CERCA_OPERATOR_PASSWORD` (al menos 32 caracteres). Inicialmente mantener `CERCA_SEND_MODE=disabled` y `CERCA_EVOLUTION_SCHEDULED_ALLOWED=false`.
7. Desde el celular abrir `https://cerca-piloto.onrender.com/internal/bridge`; autenticarse como `cerca-admin` con la contraseña de operador y obtener el QR. En WhatsApp del número exclusivo, ir a Dispositivos vinculados → Vincular dispositivo y escanear ese QR desde otro dispositivo cuando corresponda. Si se usa un único celular, será necesario evaluar vinculación por código, que **no está implementada** en este panel.
8. Cuando PostgreSQL de CERCA esté efectivamente conectado desde Render, habilitar **solo** `CERCA_SEND_MODE=test` y `CERCA_TEST_WA_IDS=<número(s) E.164 sin +>`. Las misiones proactivas siguen desactivadas. Enviar "Hola" desde un destinatario aprobado y comprobar registro, historial, BAJA y respuestas duplicadas.
9. Una vez comprobados permisos, consentimiento, costo y calidad de misiones, se puede evaluar habilitar la programación mediante `CERCA_EVOLUTION_SCHEDULED_ALLOWED=true` y `EVOLUTION_TEMPLATE_DAILY` / `EVOLUTION_TEMPLATE_WEEKLY` (identificadores internos; no son plantillas aprobadas por Meta). **No activar sin autorización explícita y prueba de entrega.**

## Seguridad

- El webhook debe llevar `X-Cerca-Bridge-Secret` configurado mediante `configure.mjs`; CERCA valida el secreto antes de leer el JSON.
- Se ignoran grupos, mensajes propios, eventos inesperados, números sin identificación telefónica y mensajes con antigüedad superior a 23 horas.
- El panel privado QR usa autenticación HTTP Basic bajo HTTPS, CSP restrictiva, sin almacenar ni mostrar claves. El QR es una credencial de vinculación: no compartir ni capturar públicamente.
- Evolution API contiene una integración no oficial con posibles errores y riesgos de seguridad. Proteger el acceso externo, mantener copias de las sesiones y aplicar actualizaciones controladas. El script de configuración se puede volver a ejecutar si un reinicio pierde los webhooks.
- El paquete `.env` no se incluye en esta entrega. La base de familias no se toca al crear el bridge.

## Qué falta para considerarlo operativo

VPS con persistencia, dominio y TLS, claves, conexión de la base CERCA al backend Render, `configure.mjs` ejecutado contra una instancia real, QR escaneado y prueba teléfono a teléfono. Ninguna prueba local sustituye esos controles.

**Un solo celular:** el panel privado también puede solicitar un *código de vinculación* a Evolution API, que podés ingresar desde WhatsApp sin escanear una pantalla externa. Este flujo requiere soporte de código de vinculación en la versión de Evolution instalada y será confirmado en la prueba real.