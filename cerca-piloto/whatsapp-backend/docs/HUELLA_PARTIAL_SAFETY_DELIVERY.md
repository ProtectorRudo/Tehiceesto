# HUELLA — continuidad de entrega ante una misión cuestionada

## Incidente comprobado el 19/11/2026

La tercera vista previa infantil (V3) ejecutó una llamada real a Sol y quedó en `failed / huella_ai_safety_or_structure`. Código guardado: **`child0:sembrar:infant_hazard`**. No hay otros códigos. El sistema descartó el conjunto completo (dos misiones infantiles adicionales y una familiar) aunque esas propuestas no quedaron marcadas como problemáticas. No se conservó la respuesta completa del modelo; no es posible recuperarla retroactivamente.

## Corrección de arquitectura (sin aumentar costo ni quitar seguridad)

**Antes:** una sola advertencia grave de un elemento hace fallar toda la generación.

**Ahora:** el evaluador identifica códigos individuales, coloca en cuarentena únicamente cada misión o actividad familiar afectada y entrega las demás actividades que cumplen los requisitos mínimos y no activaron riesgos. Nunca envía el texto cuestionado, ni lo registra en la nueva vista previa, ni lo sustituye por una misión inventada.

- El modelo sigue creando las actividades y la valoración editorial sigue sin bloquear.
- La puerta mínima de seguridad revisa cada misión infantil, cada misión de hijos mayores y también la familiar. Los riesgos claros se mantienen.
- El lote devuelve `withheld` (solo códigos anónimos) y las actividades restantes.
- En `PREVIA BEBÉ`, el mensaje de inicio indica **la cantidad real** de misiones disponibles, y explica con transparencia cuando se apartó alguna. Se guarda el estado `ready` con las actividades seguras; el rechazo puntual no provoca otro intento pago.
- Las vistas previas semanales también muestran únicamente lo seguro y explican por qué faltan propuestas.
- El calendario semanal, aún apagado, enviará misiones válidas del otro hijo aunque una haya quedado apartada. Si la familiar quedó apartada, se registra el día como no enviado para evitar una generación nueva en cada cron; los días siguientes continúan con el lote existente.
- Las misiones apartadas NO se cuentan como realizadas, NO se muestran en historial de actividad y NO generan un reemplazo pago.
- Si el lote entero es inseguro o no tiene contenido utilizable, se bloquea completamente: **no se desactiva la seguridad infantil**.

## Estado y límites

No se ejecuta generación ni envíos por desplegar. La V3 fallida continúa bloqueada, con su único intento consumido. La familia, consentimiento, límites de costo y las banderas del mes de 30 días permanecen intactos.

**Pendientes antes del piloto comercial:** pruebas con WhatsApp Business Platform oficial, validación de plantillas, recuperación editorial puntual de una propuesta cuestionada con presupuesto controlado y retroalimentación real de familias. No inventar resultados de uso. 
