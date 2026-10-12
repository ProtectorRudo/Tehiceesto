# La última campanada ❤️

Escape room romántico tridimensional, móvil-first, preparado para personalizar invitaciones.

## Arquitectura

- React + TypeScript + Vite para interfaz y compilación.
- Three.js / WebGL2, ACES tone mapping, materiales PBR, sombras adaptadas a móvil.
- `src/scene/World.ts`: mundo 3D, cámara, raycasting, interacciones, animaciones y carga opcional GLB.
- `src/game/logic.ts`: máquina de estados de acertijos y cronología. Sin React; testeable.
- `src/game/AudioEngine.ts`: audio sintetizado con Web Audio API, música ambiental y campanadas.
- `src/App.tsx`: HUD, mensajes, puzzles, temporizador, final y personalización.
- `public/config/invitation.json`: información editable de quien invita y la persona destinataria.

## Probar localmente

```
npm install
npm run dev
npm run test:logic
npm run build
```

## Recorrido completo

1. Recibir carta e ingresar.
2. Investigar el escritorio, recoger llave y ajustar reloj a 09:15.
3. Elegir disco **azul** en gramófono.
4. Observar cuadros Luna (2), Estrellas (7), Flor (4) y abrir cajón: **274**.
5. Leer carta y activar libros **luna → lluvia → flor**.
6. Empieza la última campanada: 2 minutos para entrar al jardín y tocar farolas izquierda, centro, derecha.
7. Al lograrlo, se detiene el tiempo; caminar a la mesa y tocar la caja.
8. Ver invitación y aceptar.
9. Si se agota el tiempo, reiniciar únicamente el desafío de las farolas.

## Personalización

Modificar `public/config/invitation.json` con nombres, pregunta, texto, fecha, lugar y teléfono de WhatsApp. `voiceUrl` opcional con URL HTTPS de grabación para el desenlace. No subir grabaciones privadas a un repositorio público.

## Mejoras de segunda iteración

- Colisión del cuerpo del jugador con mobiliario; ya no se atraviesan escritorio, gramófono, biblioteca ni mesa de jardín.
- Anillo de movimiento táctil y botón de acción contextual que aparece solo al enfocar un objeto cercano.
- Cuenta regresiva robusta con pausa al ocultar la pestaña y reinicio exclusivo de los 120 segundos.
- Progresión dramática: lluvia animada, farolillos del jardín apagándose secuencialmente, puerta cerrándose y sonido urgente.
- Libros decorativos convertidos a grupos `InstancedMesh` para reducir draw calls; calidad de resolución adaptable a rendimiento.
- Cinco pruebas automatizadas de la lógica y movimiento, más pruebas de temporizador.

## Calidad actual

**Versión técnica inicial, no producto comercial final.** La lógica de acertijos cuenta con pruebas, pero falta validación de render real en Android/iOS, pruebas de FPS, sustitución de mobiliario de previsualización por modelos GLB profesionales y una evaluación artística completa. Los modelos en `public/models/` son opcionales: `victorian-armchair.glb` y `antique-camera.glb`; actualmente la escena usa geometría detallada de previsualización si no existen.

## Licencias

El código fuente original se entrega con fin de evaluación. Cualquier recurso GLB incorporado posteriormente requiere revisión de licencia y créditos correspondientes. Se identificaron recursos CC0 de Kenney, y modelos Poly Haven CC0 como posibles sustitutos, pero **no se incluyen assets de terceros descargados**. La banda sonora actual se genera con Web Audio API sin archivos de música externos. No publicar fotos, audios o números privados en demo pública sin autorización.

## Sesiones nuevas (V5)

Al volver a abrir el enlace, recargar o regresar con el historial del navegador, se inicia una partida nueva: intro, posición del jugador, acertijos y relojes. Las partidas no se guardan en `localStorage`; se borra el guardado obsoleto. Cambiar de aplicación sin salir del navegador solo pausa el reloj; el reintento de los últimos dos minutos sigue sin borrar los acertijos anteriores.
