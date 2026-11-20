# HUELLA — Whapi.Cloud Sandbox gratuito
**Alcance**: solamente registro y respuestas solicitadas por la familia de prueba; no campañas ni cron de misiones. Supabase, perfiles y lógica de Sol no cambian.

## Requisitos de acceso (operador)
1. Entrar a https://panel.whapi.cloud/ con cuenta propia y crear/seleccionar **Developer Sandbox gratuito** (5 chats/mes, 150 mensajes/día, 1000 API requests/mes). Evitar activar Premium o tarjetas; Whapi también ofrece prueba comercial de 5 días, que no es necesaria.
2. Crear un canal **exclusivo para HUELLA** (no reutilizar la integración de Cotironda). Vincular su número desde WhatsApp → Dispositivos vinculados, por QR/código. Nunca compartir QR, contraseñas o token en chat.
3. En el panel obtener el ID exacto del canal y su Bearer token. Guardar token **solo en Environment de Render**, no en GitHub ni en el teléfono del operador.
4. Generar un secreto de webhook aleatorio e independiente de al menos 32 caracteres, p.ej. desde PowerShell:
   `[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLower()`
   Guardar ese valor de forma segura y configurarlo **igual** en Render y en Whapi, bajo el encabezado personalizado `X-Whapi-Secret`. Nunca colocarlo en el URL del webhook.
5. En Render, servicio **cerca-piloto**, configurar SOLO estas variables nuevas:
   - `WHAPI_TOKEN` = Bearer token del canal de HUELLA.
   - `WHAPI_CHANNEL_ID` = ID exacto del mismo canal.
   - `WHAPI_WEBHOOK_SECRET` = secreto aleatorio, distinto del token.
   - Después de verificar las tres, cambiar `CERCA_PROVIDER=whapi`. Mantener `CERCA_SEND_MODE=test`, y el `CERCA_TEST_WA_IDS` **limitado al teléfono autorizado**. No usar `production`.
6. En Whapi → canal HUELLA → Settings → Webhooks, configurar **POST** hacia
   `https://cerca-piloto.onrender.com/webhooks/whapi`.
   Activar evento **messages / post** y, si interesa el recibo de entrega, **statuses / post**. Incluir el encabezado personalizado `X-Whapi-Secret` con el secreto del paso 4. Activar callback persistence/reintentos cuando esté disponible. Probar con la opción Check webhook del panel. No habilitar eventos de contactos, chats, grupos ni medios que HUELLA no procesa.
7. Verificar `https://cerca-piloto.onrender.com/healthz`: `provider: whapi`, `database: ready`, `messaging: session_ready`, `weeklyPilot: disabled`. **Esto valida configuración, no entrega real**.
8. Hacer prueba con un mensaje nuevo desde el teléfono allowlisted. La primera respuesta esperada según el estado actual de la familia es la siguiente pregunta de registro; comprobar entrada y salida real en logs y outbox antes de declarar éxito.

## Seguridad operativa
- La API de Whapi se usa solamente para `POST https://gate.whapi.cloud/messages/text`; nunca trae historial, contactos ni documentos.
- Webhook firmado por secreto compartido elegido por el operador, validado antes del JSON. Se exige `channel_id` igual al configurado y se ignoran grupos, contactos desconocidos, mensajes propios y medios.
- Idempotencia por `channel_id + message id` persiste en `cerca.events` (misma lógica actual). El mensaje se guarda antes de responder al webhook.
- No se envían misiones programadas ni marketing mientras `CERCA_PROVIDER=whapi`. No reutilizar trabajos antiguos de Evolution pendientes de confirmación, sobre todo si podrían haberse entregado con demora.
- Whapi no es la API oficial de Meta; para venta a familias reales migrar a WhatsApp Business Platform oficial y contemplar privacidad de información de menores.
