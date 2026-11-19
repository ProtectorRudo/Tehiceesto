# HUELLA — auditoría del segundo rechazo de misiones infantiles (19/11/2026)

## Evidencia observada, sin datos identificatorios
Supabase registró una vista previa adicional fallida en `huellaInfantReviewV2`. Estado `failed`, código `huella_ai_quality_rejected`, con dos fallos concretos:
- `child0:conectar:infant_gender_assumption`
- `child0:sembrar:infant_hazard`

La generación terminó dentro del tiempo de espera. La API se configuró con `store:false`; la salida original rechazada no fue conservada y **no podemos afirmar retrospectivamente qué frases exactas la causaron**. La primera advertencia es gramatical; la segunda puede corresponder a una acción insegura o una mención preventiva a materiales peligrosos.

## Causa verificada en código
- La validación de género bloqueaba toda la semana por expresiones literales como «está despierto» o «atendela primero», aunque fueran cuestiones de estilo sin riesgo para el bebé.
- La detección de riesgo usaba una búsqueda sin contexto. Rechazaba «sin globos», «no usar piezas pequeñas» e incluso «tené en cuenta» por la palabra «cuenta», aunque la frase no propusiera ofrecer cuentas a un bebé.
- **No se deshabilita** el control de riesgos; se distingue una acción peligrosa afirmativa de una negación protectora clara. Las menciones ambiguas siguen bloqueadas.

## Corrección
1. Normalización local y determinista de unas pocas formas gramaticales no neutras (sin llamar a la IA) antes de realizar nuevamente TODAS las validaciones. No cambia actividades, objetos ni precauciones.
2. Detección infantil de materiales riesgosos basada en frases de acciones e instrucciones, con excepciones conservadoras para negaciones explícitas y expresiones idiomáticas. Se mantiene el bloqueo por uso de globos, cordones, cuentas, tapitas, piezas pequeñas, bolsas y otras acciones peligrosas.
3. Instrucciones de generación que favorecen frases naturales, sin suposiciones de género y usando materiales seguros concretos en vez de listas largas de prohibiciones.
4. Pruebas de seguridad positivas y negativas, corrección gramatical y validación después del ajuste. La salida no pasa si hay riesgo real.

## Operación y costos
No se habilita un tercer intento pago, no se modifica la reserva fallida, no se reinicia el calendario y no comienza el piloto. Las vistas previas anteriores permanecen guardadas. A futuro, ante rechazos, revisar los códigos anónimos de validación y evitar llamar a OpenAI sin autorización.
