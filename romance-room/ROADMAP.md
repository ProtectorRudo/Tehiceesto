# Hoja de ruta de producción · LA ÚLTIMA CAMPANADA

**Última actualización:** 12 de octubre de 2026
**Estado:** Primera implementación técnica, todavía NO aprobada como producto comercial.

Las casillas significan verificaciones técnicas completadas, no percepciones ni intenciones. No declaramos una fase finalizada por una simple implementación de prueba.

## Puerta A — Diseño y narrativa
- [x] Definir la premisa: habitación misteriosa que esconde una invitación romántica.
- [x] Escribir introducción, pistas encadenadas y mensaje final personalizable.
- [x] Definir el evento «La última campanada» y sus dos desenlaces.
- [x] Diseñar solución determinista de cinco acertijos y reinicio local de la prueba de 2 minutos.
- [ ] Test narrativo real con jugadores: intriga, claridad, emoción y duración.

## Puerta B — Base de código
- [x] Estructura independiente React / TS / Three.js / Vite.
- [x] Separar máquina de estados, motor gráfico, audio y HUD.
- [x] Control local de progreso y personalización desacoplada del código.
- [x] Pruebas automáticas del flujo lógico y segundas oportunidades.
- [ ] Instalar dependencias y verificar TypeScript + compilación Vite (la red del entorno bloquea npm).
- [ ] Integración en repositorio remoto nuevo y configuración CI.

## Puerta C — Arte y escenografía
- [x] Distribuir biblioteca y jardín como geometría auténticamente tridimensional.
- [x] Preparar iluminación PBR, sombras, tone mapping ACES y niebla atmosférica.
- [x] Modelar y exportar GLB original de butaca victoriana con materiales PBR.
- [x] Cargador GLTFLoader y AnimationMixer listo.
- [ ] Sustituir la totalidad del mobiliario de previsualización por modelos GLB definitivos de calidad acreditada.
- [ ] Revisar a mano texturas PBR, UV, normal maps, AO, rodamientos y geometría.
- [ ] Validar que los objetos no atraviesen paredes o suelos.
- [ ] Revisión artística en capturas de dispositivos reales.

## Puerta D — Jugabilidad
- [x] Cámara 3D con arrastre, movimiento y zoom táctil con dos dedos.
- [x] Selección raycasting de objetos 3D en escena.
- [x] Reloj, discos, combinación, libros y tres farolas operativos en la máquina de estados.
- [x] HUD discreto, introducción, ayuda y reset de partida.
- [ ] Hacer que todos los mecanismos tengan manipulación completamente diegética, sin recurrir a overlays.
- [ ] Verificar físicamente alcance y accesibilidad de cada objetivo en Android/iOS.
- [ ] Colisiones por geometría real; actualmente límites de la habitación.

## Puerta E — Últimos dos minutos
- [x] Activador después de la secuencia de libros; temporizador real de 120 segundos.
- [x] Campanadas, aceleración sonora, atenuación de lámparas y cierre gradual de puerta.
- [x] Pista automática a los 35 segundos y repique final de diez segundos.
- [x] Ganar congela el tiempo, enciende farolas y activa pétalos.
- [x] Perder repite solo el desafío final.
- [ ] Verificar animaciones, rendimiento y equilibrio con jugadores.

## Puerta F — Final y comercialización
- [x] Caja final y lectura de invitación individualizada.
- [x] Mensaje, nombres, fecha, lugar y respuesta WhatsApp mediante archivo JSON externo.
- [x] Reproducción opcional de voz privada al abrir la caja.
- [ ] Incorporar selector de diseño y editor para personalización por comprador.
- [ ] Verificar consentimiento y ciclo de vida de fotos, voz y teléfonos.
- [ ] Guardar confirmación de invitación a un backend cuando corresponda.

## Puerta G — Ingeniería de producto
- [ ] Ejecutar `npm install`, `npm run build` y pruebas automatizadas de extremo a extremo.
- [ ] Probar Android gama media, Android de gama alta, iPhone Safari y escritorio.
- [ ] Medir FPS y memoria y ajustar pixel ratio adaptativo + LOD según resultados.
- [ ] Inspeccionar errores de consola, recursos 404, fugas WebGL y reconexión de audio.
- [ ] Probar textos largos, pantalla vertical, pantallas pequeñas y accesibilidad.
- [ ] Subir a GitHub, enlazar proyecto Vercel e inspeccionar despliegue **READY**.
- [ ] Terminar una partida entera en la URL publicada y corregir incidencias.
- [ ] Aprobar la versión como comercial solo si las etapas anteriores están cerradas.

## Política de publicación
Nunca comunicar una URL como jugable o publicada sin verificarla. No confundir pruebas de lógica de Node con pruebas de render real. Cualquier demo que use mobiliario procedural será denominada **versión técnica de desarrollo**.
