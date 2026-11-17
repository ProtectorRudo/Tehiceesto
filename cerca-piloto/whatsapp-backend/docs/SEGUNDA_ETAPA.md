# CERCA — Segunda etapa: control estricto y publicación segura

Fecha: 2026-11-16. Estado: **19/19 pruebas locales**, sin credenciales Meta ni base real ni mensajes enviados.

## Qué fue agregado
1. Opt-in informativo obligatorio: no acepta ACEPTO antes de mostrar el texto de consentimiento.
2. MENÚ no interrumpe el registro y mantiene la pregunta pendiente.
3. BAJA cancela la cola; se revalida el estado de la familia antes de transmitir.
4. Después de una baja todavía se puede pedir BORRAR.
5. Feedback por fecha, hijo y misión; evita atribuir una acción a toda la familia.
6. Envíos bloqueados por defecto; modo test solo destinatarios autorizados, producción requiere doble activación.
7. Webhook registra acuses `sent/delivered/read/failed` para distinguir aceptación de entrega.
8. Banco editorial ampliado a 8 ideas por categoría y edad; simulaciones de 30 días completas sin títulos repetidos durante una semana.
9. Esquema SQL añade `provider_message_id` y `delivery_status` en la outbox.

## No confundir código probado con producto conectado
- No se ha completado una prueba WhatsApp real. Las entregas de Meta fueron simuladas.
- Las plantillas pueden no ser aprobadas, en especial si Meta interpreta las variables como contenido genérico excesivo.
- No activar ni producción ni envíos de prueba sin configurar allowlist y consentimiento.
- Las credenciales no están incluidas en los archivos ni deben subirse a GitHub.
- La política de retención, exportación íntegra y eliminación total requiere auditoría antes de lanzamiento público.

## Presupuesto de transporte
Con lista Meta Argentina octubre 2026: marketing = USD 0,0618/mensaje entregado. Si cada hijo recibe un mensaje diario y la familia una misión semanal: 1 hijo, 30+4=34 mensajes, USD 2,10; 2 hijos, 60+4=64 mensajes, USD 3,96; 4 hijos, 120+4=124 mensajes, USD 7,66. Cifras de transporte estimativas, no cotización de facturación. Vigilar fragmentación por límites de plantilla, mensajes de servicio, API OpenAI y variaciones de moneda.

## Próximo hito
Crear base exclusivamente de CERCA, migrar y verificar RLS; configurar el número de prueba Meta, plantillas y cron; completar opt-in, perfiles, 3 misiones por hijo, feedback y BAJA a través de WhatsApp real.