# HUELLA — intento adicional autorizado después de rechazo editorial

## Autorización
El adulto autorizó explícitamente una sola generación adicional con costo de OpenAI para evaluar tres misiones nuevas de un bebé de 6 meses y una misión familiar. No autoriza la activación del cron, el mes de 30 días ni llamadas automáticas de recuperación.

## Comandos WhatsApp
- `PREVIA BEBÉ 2`: inicia **una sola llamada** a OpenAI, únicamente si existe un intento anterior `huellaInfantReview` con `status=failed`. También requiere consentimiento activo, un único teléfono permitido, proveedor Evolution en modo test, clave OpenAI y meses del bebé validados.
- `PREVIA BEBÉ 2 VER`: si el resultado está listo, devuelve el resultado guardado sin una nueva llamada.
- La primera revisión `PREVIA BEBÉ` conserva el mismo comportamiento y sigue bloqueada después de agotarse.

## Aislamiento y límite
El segundo intento queda guardado exclusivamente en `state.huellaInfantReviewV2`, revisión `infant-stage-naturalness-20261119-v2-single-approved-retry`. No borra ni altera `state.huellaInfantReview`, `huellaPreview`, `huellaQualityPreview`, los perfiles ni el calendario. La reserva transaccional se hace ANTES de la llamada de pago. Los duplicados y nuevos mensajes no abren nuevas generaciones, aunque la llamada termine en error.

## Calidad y análisis
Aplica el código del PR #103: controles que distinguen expresiones protectoras de instrucciones dañinas y códigos anónimos por campo en `issueCodes` (no se guarda el JSON crudo de OpenAI). No se envían misiones que fallen seguridad o formato. Las propuestas siguen siendo evaluadas manualmente antes de poner en marcha el piloto.

## No habilitar
- `HUELLA_WEEKLY_V2_ENABLED`
- `HUELLA_SOLO_PILOT_ENABLED`
- `CERCA_EVOLUTION_SCHEDULED_ALLOWED`

El despliegue por sí solo no consume tokens de OpenAI. La llamada de pago ocurre únicamente si el adulto envía `PREVIA BEBÉ 2` desde su WhatsApp autorizado.
