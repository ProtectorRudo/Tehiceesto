# CERCA — piloto de crianza por WhatsApp (backend independiente)

**Estado:** motor de flujo, misiones, integraciones y 19 pruebas localmente implementados. **No hay WhatsApp real conectado ni servicio desplegado con esta versión**. No anunciar funcionamiento de punta a punta sin verificar un alta real y un mensaje entregado mediante Cloud API.

## Restricción del producto
WhatsApp es la única interfaz de las familias. CERCA **NO** da consejos conversacionales ni atiende consultas abiertas. La IA se invoca exclusivamente por el generador programado de misiones; ni los mensajes inesperados ni los que llegan durante el flujo se pasan a la IA. Los textos fuera de flujo reciben respuesta fija como máximo una vez por día. Señales claras de emergencia reciben un mensaje fijo de seguridad. Los menores no escriben a CERCA.

## Arquitectura
- Node.js 22 HTTP (sin SDK de terceros, dependencias cero).
- Webhook `/webhooks/whatsapp` GET (verificación Meta) / POST (HMAC SHA-256 de `META_APP_SECRET`).
- Parser de Meta Cloud API, mensajes interactivos con botones/listas, plantillas aprobadas para envíos iniciados por CERCA.
- Estado de registro explícito: consentimiento > nombre adulto > hijos > nombre/edad/intereses/objetivo por hijo > objetivo mensual > horario.
- Base de datos Supabase **NUEVA y EXCLUSIVA**, SQL en `sql/001_cerca_isolated.sql`. RLS y sin acceso anónimo ni autenticado; único backend con `service_role`.
- Función de BD `cerca_commit`: transacción atómica, versionado optimista, deduplicación de evento y outbox durable. No se guardan conversaciones espontáneas.
- Cron privado: `POST /internal/dispatch`, requiere `Authorization: Bearer <CRON_SECRET>`; genera 3 misiones/día/hijo y una familiar semanal. Costos máximos en USD para salidas y cron limitado por familias.
- OpenAI Responses API en servidor, únicamente para propuestas de misión, con `store:false` y verificación de calidad; si no está configurado o la respuesta falla, biblioteca editorial con variantes por edad.
- Expiración para respuestas interactivas dentro de la ventana de servicio; envío diario siempre mediante plantillas de Meta aprobadas.

## Estado y pruebas
```sh
node --version # v22+
npm test
npm start
curl http://localhost:3000/healthz
```
El health check responde `pending` para dependencias sin credenciales y no expone secretos.

## Envío seguro: apagado por defecto
- `CERCA_SEND_MODE=disabled` garantiza que no haya envíos externos.
- `CERCA_SEND_MODE=test` exige `CERCA_TEST_WA_IDS` con números autorizados de prueba; se ignora cualquier otro mensaje entrante.
- `CERCA_SEND_MODE=production` exige además `CERCA_PRODUCTION_AUTHORIZED=true`. No activar sin aprobación comercial y validación de políticas.
- Ante BAJA se cancelan envíos pendientes en la base y se consulta el consentimiento otra vez justo antes de transmitir.
- El feedback HECHA/NO PUDE/OMITIR permite elegir el hijo y la misión concreta.
- Los estados `sent/delivered/read/failed` de Meta se registran sin convertirse en conversaciones.

## Conexión: NO habilitar gastos sin autorización
1. Crear **nuevo repo** `ProtectorRudo/cerca` y proyecto Supabase CERCA independiente, una vez confirmado el costo por su organización. No ejecutar la migración en TeHiceEsto/OFI/Cómplices/Cotironda.
2. Configurar variables de `.env.example` *solo* en el servicio CERCA; nunca subir secretos. Probar exclusivamente con número de prueba de Meta y usuario de prueba autorizado.
3. Registrar un número empresarial WhatsApp Cloud API, Webhook URL HTTPS: `/webhooks/whatsapp`, token de verificación distinto, y Meta App Secret. Comprobar verificación GET y firma POST.
4. Presentar a Meta para aprobación los templates `cerca_misiones_diarias` y `cerca_mision_familiar` (ambas obligatorias). **No asumir** que Meta clasificará contenidos de crianza como utilidad; presupuestar marketing.
5. Ejecutar `POST /internal/dispatch` con un scheduler seguro que funcione aunque Render Free entre en reposo; confirmar cron protegido, límites y zona horaria.
6. Primera prueba: alta desde WhatsApp > perfiles > envío de misiones por plantilla > estado de entrega > feedback > BAJA. Validar duplicados, límites y RLS, más revisión editorial humana de ejemplos reales anonimizados.

## Riesgos conocidos / pendientes
- El proveedor Meta podría rechazar plantillas con texto libre altamente variable; no hay aprobación de plantillas ni credenciales reales verificadas. Adaptar mensajes al diseño aprobado antes de enviar.
- Cloud API, número oficial, plantillas, Supabase y cron no conectados. Ausencia de credenciales significa que no habrá mensajes ni cargos.
- La cola evita ejecuciones paralelas dentro de una misma instancia, pero carece de bloqueo por múltiples workers: desplegar solo **una instancia** hasta agregar claim transaccional `SKIP LOCKED` y lease de entrega. La emisión externa exactamente una vez no se puede garantizar sin deduplicación del proveedor.
- La variable de presupuesto es una estimación conservadora, no reemplaza facturación de Meta; antes de cobrar o escalar revisar clasificación y precio real del destino.
- `DATOS` muestra resumen y `BORRAR` elimina el perfil, conservando un registro mínimo de supresión para impedir nuevos envíos; el SQL elimina los eventos y salidas anteriores al borrado. Exportación íntegra, purga de datos auxiliares y cumplimiento legal deben ampliarse y verificarse antes del lanzamiento público.
- La biblioteca editorial tiene 8 variantes por misión y franja etaria, probadas en una simulación de 30 días por edad; aún necesita revisión de una persona con experiencia en crianza antes del piloto público. La IA todavía no tiene evaluación longitudinal de resultados.
- No hay historias verificadas enviadas automáticamente, ni cobros de suscripciones, ni panel de operador (a propósito: primero flujo principal).
- Limitar a adultos responsables mayores de edad; política de privacidad, retención, incidente y derecho a acceso/borrado deben revisarse con asesoramiento local antes de usuarios reales no testers.

## Referencias técnicas
- https://whatsappbusiness.com/products/platform-pricing/
- https://whatsappbusiness.com/es-la/policy/
- https://developers.facebook.com/docs/whatsapp/cloud-api/
- https://www.unicef.org/lac/crianza/whatsapp

**Aislamiento:** este proyecto es código autónomo, sin importar módulos de OFI/Cómplices ni enlazar sus tablas/servicios. No colocarlo en carpetas compartidas sin una decisión deliberada de migración.

## Estado de segunda etapa (16/11/2026)
- Suite local 19/19 aprobada, incluye una simulación HTTP completa sin enviar mensajes reales.
- Costo cotizado de proyecto Supabase adicional en la organización conectada: USD 0 mensuales de costo inicial; aún sin creación ni migración.
- Un costo orientativo de 2 mensajes de marketing por día y 4 semanales a USD 0,0618 = USD 3,9552 por familia/mes, antes de IA, hosting, impuestos y otras conversaciones.
- La rama CERCA tiene un frontend anterior incompatible. Se debe publicar este backend en un despliegue propio y sin interfaz web para familias.