# HUELLA — motor semanal premium, fase de validación

## Estado y canales

Este módulo se despliega dentro del backend existente cerca-piloto, sin renombrar su conexión, base ni webhook. La única interfaz del usuario es WhatsApp. El calendario nuevo está detrás de interruptores apagados por defecto. Publicar código NO implica habilitar mensajes automáticos.

## Modelo de IA

- Modelo por defecto del NUEVO motor: gpt-6.2-sol, razonamiento high, Responses API con Structured Outputs y store:false.
- Variable opcional independiente: HUELLA_CONTENT_MODEL. El antiguo OPENAI_MODEL pertenece al generador heredado y no define el modelo semanal premium.
- Misiones específicas por hijo (conectar, comprender, sembrar), con pasos, fundamento, observación y objetivo/interés vinculado.
- Solo se transmiten edad, intereses, objetivos y feedback pertinente, sin números WhatsApp ni nombres.
- Las referencias se asignan desde fuentes editoriales conocidas; la IA no inventa fuentes.
- No se usa fallback genérico: sin API, con error o con respuesta rechazada, esa misión NO se envía.
- Fallo del modelo: el estado guarda un bloqueo por fecha para evitar repetir llamadas costosas a cada ejecución de cron.
- healthz.ai.configured=true confirma presencia de clave, no que la API responda exitosamente.

## Horario (hora local de la familia)

| Día | Contenido |
| --- | --- |
| Lunes | Misión familiar |
| Martes | Conectar: una misión específica por hijo |
| Miércoles | Historia real registrada y con fuente UNICEF |
| Jueves | Comprender: una misión específica por hijo |
| Viernes | Sin mensaje |
| Sábado | Sembrar: una misión específica por hijo |
| Domingo | Resumen basado solo en feedback registrado + una pregunta concreta |

El plan semanal se crea a lo sumo una vez por semana y se usa durante los días programados. Los slots tienen clave estable y estado persistido en la ficha familiar. Los envíos vencen a medianoche de Argentina.

## Seguridad, activación y costos

Para que el NUEVO programador funcione deben verificarse simultáneamente:

- CERCA_PROVIDER=evolution y CERCA_SEND_MODE=test.
- CERCA_TEST_WA_IDS contiene exactamente un número personal autorizado.
- HUELLA_WEEKLY_V2_ENABLED=true (apagado hasta aprobar).
- HUELLA_SOLO_PILOT_ENABLED=true (apagado hasta aprobar).
- CERCA_EVOLUTION_SCHEDULED_ALLOWED=true más EVOLUTION_TEMPLATE_DAILY y EVOLUTION_TEMPLATE_WEEKLY.
- OPENAI_API_KEY válido, conexión PostgreSQL y un cron autentificado que llame a /internal/dispatch.

Mientras esas condiciones no estén completas, el envío automático permanece bloqueado. Los controles de consentimiento, costos mensuales de mensajería, destinatario, autorización de webhook y bajas siguen activos. El cálculo de costos actuales del backend no incluye aún la factura real de OpenAI y debe auditarse antes de habilitar 30 días.

Las historias fueron comprobadas contra sus páginas de UNICEF el 2026-11-19. Las historias se sintetizan editorialmente sin inventar testimonios ni garantizar resultados.

## Restricciones actuales

- Programación automática real NO activada.
- Evolution no es WhatsApp Business Platform oficial; para comercializar se requiere el canal oficial.
- Falta prueba real de salida programada a WhatsApp, medición de costos por familia y cron externo confirmado.
- Los balances solo recogen feedback expreso, no afirman causalidad ni mejoras clínicas.
- La prueba comienza al entregar correctamente el primer contenido de la agenda, no por desplegar código.
