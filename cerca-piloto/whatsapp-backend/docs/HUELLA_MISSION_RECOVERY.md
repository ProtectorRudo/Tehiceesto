# HUELLA — recuperador editorial: ninguna misión perdida por un rechazo puntual

## Decisión de producto
El adulto pidió que **las tres misiones por hijo y la misión familiar siempre conserven su lugar**. No quiere que un rechazo del validador interno deje el calendario incompleto. Esa decisión no autoriza enviar una instrucción peligrosa a un niño.

## Arquitectura implementada
1. La IA Central Sol crea y autoevalúa propuestas originales y personalizadas como hasta ahora (una llamada de OpenAI por lote).
2. HUELLA conserva las misiones de Sol que están completas y no contienen instrucciones consideradas peligrosas. Observaciones de estilo y redacción no bloquean la entrega.
3. Cuando una misión necesita retirarse por seguridad o porque sus instrucciones no son utilizables, HUELLA **reemplaza solo ese lugar** con una actividad de la **biblioteca editorial de reserva**, apropiada a la etapa de edad y a la función de la misión.
4. La misión familiar tiene también una alternativa separada; si hay bebés, el plan evita forzarles a representar un personaje y no presupone una capacidad. La biblioteca incluye etapas de 0–3, 4–11, 12–17, 18–23 meses, 2–5, 6–9 y 10–15 años.
5. Se ejecuta de nuevo la comprobación mínima de seguridad sobre **el lote completo, incluidas las sustituciones**. Si algo siguiera siendo inseguro, se detiene antes de entregar: no se anula la seguridad infantil para cumplir un objetivo de cantidad.
6. La salida conserva 3 misiones por hijo y 1 familiar, con `replaced` (solo identificadores anónimos de lugares sustituidos), `withheld=[]`, `source='curated_safe_alternative'` para diferenciar las actividades de reserva de las que generó Sol.
7. Las vistas previas explican cuando se usó la biblioteca editorial, sin presentar estas propuestas como texto generado por la IA. No se realizan llamadas extras pagas ni reintentos silenciosos.

## Qué se recupera, qué NO se promete
- Se recupera cada posición de misión cuando la API respondió con un lote interpretable, sin necesidad de una segunda llamada.
- Un corte de OpenAI, una respuesta vacía, pérdida de consentimiento, falta de red/WhatsApp o problemas de infraestructura **no permiten garantizar físicamente un envío**: son errores de servicio que deben tratarse como tales. Tampoco se envía contenido considerado inseguro.
- Las alternativas son material editorial predefinido, no recuerdos reales inventados ni resultados personales falsos. En casos de rescate repetido, la variedad debe ampliarse antes del lanzamiento comercial.
- La biblioteca no sustituye el objetivo principal de personalización profunda de Sol: es la última instancia para que un fallo puntual no arruine la experiencia semanal.

## Seguridad, estado, costos
No se habilitan `HUELLA_WEEKLY_V2_ENABLED`, `HUELLA_SOLO_PILOT_ENABLED`, `CERCA_EVOLUTION_SCHEDULED_ALLOWED` ni plantillas de Meta. No se altera el consentimiento, perfil, calendario ni intentos históricos. El despliegue no ejecuta la IA ni envía WhatsApp. Las llamadas pagas solo pueden producirse en los comandos privados autorizados por el adulto.

## Pruebas indispensables
- Una misión peligrosa de bebé se reemplaza, se conservan las otras y se cumple 3 + familiar.
- Un plan familiar inseguro se reemplaza, sin perder las individuales.
- Todas las etapas editoriales alternativas pasan la misma comprobación de seguridad.
- Si todo el lote generado es peligroso, ninguna instrucción peligrosa se conserva y se obtienen alternativas completas.
- Cuando las misiones de Sol son seguras, se entregan sin alterarlas, con una sola llamada.
- Las vistas previas indican las sustituciones con transparencia y no activan el mes de prueba.
