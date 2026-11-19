# HUELLA — vista previa privada por WhatsApp

**Propósito**: validar una única semana de misiones generadas por GPT-6.2 Sol con perfiles familiares existentes, antes de habilitar el calendario de 30 días.

## Activación del operador

1. Confirmar GET /healthz: database ready, messaging session_ready, ai.configured true, weeklyPilot disabled.
2. Confirmar que CERCA_TEST_WA_IDS contenga solo el número del titular que consintió y que CERCA_SEND_MODE sea test.
3. Activar HUELLA_PREVIEW_ENABLED=true desde variables de entorno en Render. Por defecto es false.
4. No tocar HUELLA_WEEKLY_V2_ENABLED, HUELLA_SOLO_PILOT_ENABLED, CERCA_EVOLUTION_SCHEDULED_ALLOWED ni plantillas de programación: deben permanecer desactivados.
5. El adulto escribe PREVIA desde su WhatsApp ya registrado. Solo esa acción hace una llamada a OpenAI.
6. El sistema devuelve un acuse breve, y cuando la respuesta cumple calidad, entrega la misión familiar y los bloques de conectar/comprender/sembrar para cada hijo, además de una historia real y la pregunta dominical. Ningún envío automático ni inicio del piloto.
7. Si la vista previa ya está lista, el usuario puede escribir PREVIA VER para volver a verla sin llamar a OpenAI. Si la IA falla, PREVIA REINTENTAR permite **un solo reintento adicional**. Máximo dos generaciones por semana.

## Controles

- Requiere HUELLA_PREVIEW_ENABLED=true, OPENAI_API_KEY presente, Evolution configurado, CERCA_SEND_MODE=test, exactamente un destinatario autorizado, consentimiento y perfil activo.
- Deduplicación transaccional por ID de mensaje entrante ANTES de la llamada de pago. No es un chatbot abierto.
- La reserva y el resultado de la previa se persisten en el estado exclusivo de esa familia. Los cambios concurrentes de perfil se conservan y las bajas impiden generar entregas finales.
- Nunca se reemplaza una generación fallida por material genérico.
- No se cobra si el comando no se envía; actualizar el servidor no llama a OpenAI.
- La respuesta de Sol puede consumir hasta 9000 tokens de salida, incluidos los de razonamiento interno; el límite real de gasto se controla por dos llamadas como máximo por semana.
- No se modifican otras aplicaciones ni las credenciales guardadas en Render.
- Para compartir la evaluación con el equipo, copiar solo las misiones deseadas; no publicar el número de teléfono, secretos ni datos privados.

## Pendientes

- Confirmar acceso efectivo a Sol en la primera generación (una clave presente no demuestra permiso de uso).
- Valorar manualmente originalidad, claridad, relevancia, fundamento y seguridad de las siete experiencias.
- Revisar longitudes de las misiones y respuesta que recibe el usuario.
- Solo después: probar un cron real, las plantillas aprobadas y el flujo oficial de WhatsApp Business antes del piloto de pago.

Este módulo deliberadamente no marca misiones como hechas y no establece huellaPilotStartDay. Las 4 semanas del piloto siguen sin comenzar.
