# HUELLA — segunda vista previa de calidad

## Operación
- Comando privado WhatsApp: PREVIA CALIDAD.
- Solo se acepta desde el número registrado en la lista de prueba, con consentimiento vigente, Evolution habilitado en modo test, OPENAI_API_KEY presente y HUELLA_PREVIEW_ENABLED=true.
- El comando inicia UNA llamada a GPT-6.2 Sol para la revisión editorial executable-missions-20261119-v1.
- Se guarda huellaQualityPreview de forma independiente. El resultado previo huellaPreview (dos intentos) no se borra, modifica ni se vuelve a facturar.
- La reserva es transaccional: duplicados y mensajes posteriores no generan nuevas llamadas. Si esta nueva generación falla, se bloquean los reintentos automáticos.
- Se envían por WhatsApp la misión familiar, seis misiones por hijo, historia real narrada y pregunta dominical, con explicación de preparación, frase para empezar y ejemplo concreto.
- El despliegue en sí no ejecuta el modelo ni inicia los 30 días; el plan semanal sigue deshabilitado.

## Criterios de evaluación humana (0, 1 o 2 puntos cada uno)
1. Preparación e inicio literales, sin tener que inventar qué hacer.
2. Pasos realizables en un orden lógico.
3. Ejemplo de interacción que hace comprensible el juego.
4. Personalización real por intereses, etapa y objetivo.
5. Sentido relacional explícito: cómo acompañar, escuchar o practicar una capacidad.
6. Adecuación, seguridad, autonomía y alternativa si el hijo no quiere participar.

Para avanzar al piloto: siete misiones con 10/12 puntos o más cada una, sin ceros en 1, 2 o 6, y una historia con fuente verificable, protagonistas, problema, decisiones y desenlace fiel al caso. Las puntuaciones internas no prueban resultados clínicos ni garantizan efectos.

## Restricciones
- No modificar la familia registrada ni registros de hijos.
- No activar HUELLA_WEEKLY_V2_ENABLED ni mensajes programados.
- No se usa la IA para conversaciones libres.
- Revisar contenido real antes de habilitar el piloto de 30 días.
