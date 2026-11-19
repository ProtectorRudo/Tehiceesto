# HUELLA — tercera evaluación privada de entrega libre y segura (V3)

## Objetivo
Validar en WhatsApp la arquitectura del PR #106, que distingue observaciones editoriales no bloqueantes de instrucciones realmente peligrosas y contenido estructuralmente inutilizable. El usuario pidió probar en vez de dejar el sistema sin validación real.

## Alcance de la nueva autorización
- El comando privado es `PREVIA BEBÉ 3` desde el teléfono consentido y habilitado en modo test.
- Máximo **UNA** nueva generación paga con Sol, de 3 misiones infantiles (6 meses aprox., según perfil actualizado) y 1 familiar. No equivale al mes de prueba.
- `PREVIA BEBÉ 3 VER` recupera el resultado guardado y no genera de nuevo.
- Requiere que la revisión `huellaInfantReviewV2` haya terminado en `failed`, y que esta nueva revisión no exista previamente.
- Usa una reserva transaccional independiente en `huellaInfantReviewV3` ANTES de llamar a OpenAI; duplicados, fallos o nuevos mensajes no desbloquean una segunda llamada.
- Conserva íntegras `huellaInfantReview`, `huellaInfantReviewV2`, `huellaPreview`, `huellaQualityPreview`, perfiles y el estado del piloto.

## Qué cambia con el PR #106
- La IA crea y revisa el contenido.
- Las advertencias editoriales (repetición de títulos, exactitud de etiquetas, pequeñas diferencias de forma) no bloquean ni hacen pagar otra generación.
- HUELLA conserva únicamente controles indispensables: contenido mínimo coherente, instrucciones dañinas, seguridad infantil, autorización de la familia y restricciones del canal.
- Si una misión supera el tamaño de un mensaje, se divide sin truncar el texto.
- Una instrucción claramente peligrosa no se entrega. Esta revisión NO incluye reparación automática de una misión peligrosa ni presupuesto de reintentos.

## Estado
El despliegue por sí mismo NO llama a OpenAI ni envía misiones. El comando desde WhatsApp es el único disparador de esta prueba. No se activan horarios, plantillas ni el período de 30 días.

## Comprobación posterior
Revisar: estado V3 guardado, cuatro experiencias completas recibidas, ningún bloqueo editorial inocuo, pertinencia para etapa del bebé, seguridad, e identificación de problemas reales. Comparar con la primera y segunda vista previa y decidir si se puede iniciar el piloto.
