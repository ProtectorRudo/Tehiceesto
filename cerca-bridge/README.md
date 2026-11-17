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

1. Provisionar **un único** VPS de al menos 2 vCPU, 4 GB RAM y 40 GB disco persistente, con Docker Engine + Compose, Node.js 22 y DNS `EVOLUTION_HOST` apuntando al VPS. Es un paso externo que puede costar dinero y **no se ha realizado**. El número será exclusivo de CERCA; no reutilizar servicios de otros productos.
2. Copiar `.env.example` a `.env` y reemplazar **todos** los secretos por **cuatro valores hexadecimales de 64 caracteres distintos** generados con `openssl rand -hex 32` cada uno. Nunca copiar secretos a GitHub ni a este chat.
3. Desde `cerca-bridge/` ejecutar `./install.sh` (requiere Node.js 22, Docker Engine y Compose). El instalador valida la configuración sin revelar claves, revisa DNS, levanta 5 contenedores y ejecuta la configuración inicial del webhook dentro de la red privada.
4. Verificar `docker compose ps` y `docker compose logs --tail=60 monitor`. El monitor revisa el webhook cada minuto y lo restaura si Evolution borra su URL, eventos o cabeceras. **No crea instancias, no envía mensajes ni vincula teléfonos.**
5. **Importante:** el Caddy público solo expone `/instance/connect/cerca-piloto` y `/message/sendText/cerca-piloto`; no se exponen endpoints de creación, administración ni configuración. El script de instalación crea la instancia por la red Docker interna, no a través de la URL pública.
6. En Render `cerca-piloto`, configurar **sin compartir secretos en chat**: `CERCA_PROVIDER=evolution`, `EVOLUTION_API_URL=https://<EVOLUTION_HOST>/`, `EVOLUTION_INSTANCE=cerca-piloto`, `EVOLUTION_API_KEY`, `CERCA_BRIDGE_WEBHOOK_SECRET`, y `CERCA_OPERATOR_PASSWORD` (al menos 32 caracteres). Inicialmente mantener `CERCA_SEND_MODE=disabled` y `CERCA_EVOLUTION_SCHEDULED_ALLOWED=false`.
7. Desde el celular abrir `https://cerca-piloto.onrender.com/internal/bridge`; autenticarse como `cerca-admin` con la contraseña de operador y obtener el QR. En WhatsApp del número exclusivo, ir a Dispositivos vinculados → Vincular dispositivo y escanear ese QR desde otro dispositivo cuando corresponda. Si se usa un único celular, será necesario evaluar vinculación por código, que **no está implementada** en este panel.
8. Cuando PostgreSQL de CERCA esté efectivamente conectado desde Render, habilitar **solo** `CERCA_SEND_MODE=test` y `CERCA_TEST_WA_IDS=<número(s) E.164 sin +>`. Las misiones proactivas siguen desactivadas. Enviar "Hola" desde un destinatario aprobado y comprobar registro, historial, BAJA y respuestas duplicadas.
9. Una vez comprobados permisos, consentimiento, costo y calidad de misiones, se puede evaluar habilitar la programación mediante `CERCA_EVOLUTION_SCHEDULED_ALLOWED=true` y `EVOLUTION_TEMPLATE_DAILY` / `EVOLUTION_TEMPLATE_WEEKLY` (identificadores internos; no son plantillas aprobadas por Meta). **No activar sin autorización explícita y prueba de entrega.**

## Problemas conocidos y recuperación

- Evolution v2.3.x/2.4 RC tiene informes comunitarios de pérdida de URL/cabeceras/eventos del webhook después de reinicios y de entregas que no llegan aunque la API responda éxito. El monitor intenta restaurar **solo la configuración del webhook** y deja constancia en los logs; **no garantiza entrega real**. Debe validarse desde dos teléfonos y registrar los mensajes recibidos.
- Ante una caída del VPS, restaurar desde copias de seguridad cifradas de los volúmenes de `postgres` y `evolution`; Redis se usa como cache. No divulgar sesiones de WhatsApp.
- Las 62 pruebas de código (53 del backend, 9 del monitor/instalador) no equivalen a una conexión real; un VPS y un teléfono dedicado siguen pendientes.

## Seguridad

- El webhook debe llevar `X-Cerca-Bridge-Secret` configurado mediante `configure.mjs`; CERCA valida el secreto antes de leer el JSON.
- Se ignoran grupos, mensajes propios, eventos inesperados, números sin identificación telefónica y mensajes con antigüedad superior a 23 horas.
- El panel privado QR usa autenticación HTTP Basic bajo HTTPS, CSP restrictiva, sin almacenar ni mostrar claves. El QR es una credencial de vinculación: no compartir ni capturar públicamente.
- Evolution API contiene una integración no oficial con posibles errores y riesgos de seguridad. Proteger el acceso externo, mantener copias de las sesiones y aplicar actualizaciones controladas. El script de configuración se puede volver a ejecutar si un reinicio pierde los webhooks.
- El paquete `.env` no se incluye en esta entrega. La base de familias no se toca al crear el bridge.

## Qué falta para considerarlo operativo

VPS con persistencia, dominio y TLS, claves, conexión de la base CERCA al backend Render, `configure.mjs` ejecutado contra una instancia real, QR escaneado y prueba teléfono a teléfono. Ninguna prueba local sustituye esos controles.

**Un solo celular:** el panel privado puede solicitar un *código de vinculación* que se introduce en WhatsApp sin escanear una segunda pantalla. Que Evolution lo emita correctamente deberá verificarse en la instancia real.

**Cuidado con los comandos del README de versiones anteriores:** las rutas administrativas (`/webhook/*`, `/instance/fetchInstances`) ahora están bloqueadas desde Internet por Caddy; se consultan únicamente desde la red Docker. Para inicializar, usá `./install.sh`.