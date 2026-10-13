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
10. Al cerrar y volver a abrir el enlace, al recargar o volver desde el historial, se reinicia **toda** la experiencia desde la introducción, el reloj y los acertijos. Cambiar de aplicación momentáneamente solamente pausa el reloj.

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

## Corrección de sesión V5

No se guarda el progreso de la partida en `localStorage`. Se elimina la clave obsoleta de versiones anteriores al iniciar. Recarga, reentrada al enlace y retorno desde historial `bfcache` reinician la experiencia y ambos temporizadores; la segunda oportunidad **dentro de una partida activa** conserva únicamente la fase final.

## V6 — Acertijos de dificultad intermedia (versión candidata)

- Reloj: deducir la hora del sol de cobre (ocho rayos) y la fuente (cuatro ondas que valen diez minutos).
- Melodía: interpretar el verso del cuaderno para escoger el disco que corresponde.
- Candado: contar 2 lunas, 7 estrellas y 4 flores en cuadros que ya no imprimen los números.
- Biblioteca: interpretar el ciclo narrado en la carta; no repetir el orden visible de los libros.
- Jardín: leer placas de las farolas y asociarlas al verso, en un orden no espacial.
- Ayudas: tres niveles por acertijo; solo el tercero revela la solución, si se solicita.
- Temporizador: 9 min de exploración orientativa + 2 min de desafío final con reintento del tramo final.
- Las 20 pruebas de lógica, controles, estado y pistas pasan localmente; pendiente compilación completa con dependencias, revisión visual móvil y comprobación de una partida real antes de promover esta versión.

## V7: retroalimentación de prueba en escritorio
- La llave ahora es una malla 3D dorada visible sobre un tapete oscuro y con hotspot `key`, no un premio automático de `desk`.
- Examinar la nota no cambia el inventario; solo la interacción **Tomar llave de bronce** habilita el reloj.
- Avisos temporales separados de la acción contextual en móvil y escritorio.
- Prueba de regresión `tests/physical-key.test.mjs`.

## V9 — El jardín se apaga

El jugador debe **encontrar una pequeña llave de bronce** sin recibir su ubicación. El temporizador de exploración (9 minutos) presenta avisos narrativos cuando restan 6, 3, 1 y 0 minutos, sin bloquear al jugador ni revelar soluciones. En el tramo final (2 minutos) hay un aviso inicial y señales a 1:30, 1:00, 0:30 y 0:10; una banda separada evita interferir con los controles o las pistas. Los pétalos se desprenden, las flores bajan y se desaturan y las hojas de las macetas pierden color de forma gradual. Si consigue resolver el jardín, la floración recupera su aspecto. Al repetir el desafío final, el deterioro vuelve a empezar desde su punto inicial. La música y campanadas acompañan los avisos.

**Nota:** si el tiempo de exploración llega a cero, los acertijos siguen siendo resolubles; los dos minutos finales son el verdadero límite. Las pistas voluntarias siguen separadas de los avisos narrativos.

## V10 · Renovación visual del invernadero

- Nuevo activo **GLB original** `public/models/heritage-rose-planter.glb`, generado por `make-botanical-models.py`, sin dependencia de modelos externos. Rosas con pétalos curvos, hojas con nervadura y maceta cerámica; 9 grupos de mallas/materiales compartidos por 12 ejemplares de la sala. Carga progresiva con plantines de reemplazo mientras no llega el GLB.
- Techo de vidrio a **dos aguas** calculado geométricamente, con cumbrera, ejes metálicos, juntas y remates ornamentales.
- Jardín con flores de siete pétalos 3D, en vez de esferas, manteniendo `InstancedMesh` para móvil; la secuencia de marchitamiento sigue funcional.
- Nuevos detalles de ebanistería en el escritorio, carátula romana en el reloj, surcos del disco en la vitrola, falda de tela de la mesa, ramo floral y arco para la revelación romántica.
- Sombras de contacto suaves, luz diurna más equilibrada y atenuación progresiva de colores de las jardineras durante la cuenta regresiva.
- No se modifica la lógica de acertijos, controles, textos de inicio, duración, ayudas ni reinicios.

**Falta antes de certificar calidad comercial:** auditoría de capturas Android/iPhone y escritorio, revisión visual de cada mecanismo, medir FPS en dispositivos de gama media y reemplazar/revisar otros objetos aún procedurales. No confundir una compilación READY con la validación de estas pruebas visuales.
