# Cómplices — estándar de misiones con sentido (noviembre 2026)

Una misión tiene que dejar una sensación humana: «Pensó en mí y se acordó de lo que me gusta». No tiene que parecer una obligación escolar ni una frase romántica vacía.

## Reglas
- Diarias: entre 5 y 15 minutos. Semanales: 15 a 45 minutos.
- Debe haber una acción concreta, un detalle reconocible (mate, receta, foto, canción, nota, paseo, ayuda cotidiana) y una intención afectiva auténtica.
- Sin gasto obligatorio ni materiales difíciles de conseguir. Cada persona puede rechazar cualquier actividad sin penalización.
- Cuando existen gustos del otro autorizados explícitamente, cada propuesta debe tener una relación verificable con esos gustos.
- Cuando todavía no hay gustos autorizados, no inventar preferencias. Ofrecer un gesto universal, sencillo y con significado.
- No usar confidencias, chat de pareja ni datos íntimos de la otra persona como contexto de generación.
- Evitar repeticiones recientes. Alternar recuerdos, detalles, juego, ayuda y pequeños momentos.
- Rechazar propuestas vagas, caras, extensas, repetidas, ajenas al perfil autorizado o que impliquen contacto físico sin consentimiento.

## Implementación
- Motor principal: app/api/central/route.js
- Evaluación editorial: lib/mission-quality.mjs
- Misiones originales de respaldo: lib/meaningful-playbook.mjs (56 opciones curadas en ocho temas)
- Adaptación por preferencias individuales autorizadas: lib/meaningful-partner.mjs
- Pruebas: tests/meaningful-missions.test.mjs
- Revisión de cache: meaningful_missions_v3, sin alterar misiones ya cumplidas

Ejemplo: si la otra persona autorizó que disfruta el mate, no sugerir simplemente «pasen tiempo juntos»; recomendar cebarle uno si tienen mate en casa y acompañarlo con una nota que recuerde algo verdadero de la relación.

El trabajo no es un nuevo entrenamiento de pesos del modelo: son mejores instrucciones para OpenAI, ejemplos, un evaluador automático y un respaldo curado. Una compilación correcta no demuestra aún que las cuatro misiones generativas sean buenas con personas reales.

Último estado de base al comenzar: 1 integrante, 0 respuestas de perfil, 4 actividades y 0 evaluaciones. Falta validación real con dos personas y permisos individuales. Las propuestas se preparan al entrar o actualizar preferencias; no existe aún generación diaria con la app cerrada.
