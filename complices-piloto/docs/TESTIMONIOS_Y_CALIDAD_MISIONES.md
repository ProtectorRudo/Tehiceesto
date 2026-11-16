# Cómplices — testimonios públicos como inspiración, no como contenido copiado

## Motivación (16/11/2026)

La misión semanal «Una cita para reír a nuestra manera» no ofrecía una actividad definida y trasladaba la preparación al usuario. Para solucionarlo, el motor debe proponer pasos ejecutables, con respeto a gustos autorizados y elección voluntaria de la pareja.

## Fuentes públicas consultadas

- [Reddit r/Marriage — Little Things (02/10/2024)](https://www.reddit.com/r/Marriage/comments/1fu73v5/): experiencias de aliviar tareas cotidianas; material testimonial, autoseleccionado.
- [Reddit r/Marriage — My wife made me feel so loved (03/05/2020)](https://www.reddit.com/r/Marriage/comments/gcv9r7): sentirse comprendido por preferencias pequeñas recordadas.
- [Reddit r/Marriage — Marriage tips (26/06/2023)](https://www.reddit.com/r/Marriage/comments/14jq9x7): agradecer contribuciones específicas.
- [Reddit r/Marriage — What made you feel loved (10/07/2024)](https://www.reddit.com/r/Marriage/comments/1dzujeo): anticipación y preparación de detalles que la otra persona aprecia.
- [Reddit r/AskWomen — Without buying anything (13/08/2020)](https://www.reddit.com/r/AskWomen/comments/i92ij9): apoyo cotidiano, bebidas, tiempo y palabras.
- [Gottman Institute — Small actions make big impacts](https://www.gottman.com/blog/small-actions-make-big-impacts/): atención y respuesta a pequeñas invitaciones de conexión.

**Interpretación**: los testimonios son relatos públicos, no evidencia científica de que una misión vaya a funcionar para todas las parejas. La investigación sobre pequeñas invitaciones a conectar respalda la dirección general, no las preferencias individuales.

## Reglas editoriales

1. Extraer **mecanismos generales**: alivio concreto, preferencia recordada, reconocimiento preciso, tiempo preparado, escucha y gesto cotidiano.
2. No incluir autores, citas textuales, eventos identificables ni confesiones. No recopilar publicaciones individuales en la base de datos.
3. Seleccionar ejemplos solo a partir del perfil estructurado que la otra persona autorizó compartir. Si no hay una preferencia, no inventarla.
4. Cada misión debe responder **qué hago**, **cómo lo preparo u ofrezco** y **qué valor de conexión aporta**. Nombre propio de juego o acción identificable siempre que sea necesario.
5. Las semanales (15–45 min) deben proponer una iniciativa o experiencia; no son juegos improvisados sin sentido.
6. Respetar límites: sin compras forzadas, intimidad no consentida, presión o puntuación del afecto.
7. Fallback guiado con acciones concretas y nombres de juegos del producto; si falla la IA, nunca dejar una instrucción vacía.
8. Rechazar misiones superficiales guardadas que aún no se realizaron, **sin tocar las completadas, su historial ni sus corazones**.
9. La valoración del usuario es una señal de calidad para SUS futuras misiones, no prueba de que la pareja efectivamente recibió el gesto.
10. Mantener presupuesto del modelo y frecuencia actuales. La biblioteca de patrones es local; la aplicación no hace búsquedas web cuando alguien abre «Hoy».

## Estado de validación

La biblioteca `lib/testimony-inspiration.mjs` contiene seis patrones reinterpretados con enlaces a las fuentes públicas. La selección `selectInspiration` filtra por gustos estructurados, enviando solo mecanismos abstractos (sin citas o URL) al modelo generativo. Los tests de `tests/testimony-missions.test.mjs` y `tests/mission-substance.test.mjs` comprueban claridad, límites y rechazo de la misión semanal anterior. La respuesta emocional de parejas reales todavía requiere un piloto de uso y feedback.
