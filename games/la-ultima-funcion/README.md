# La Última Función

Experiencia de escape 3D para invitaciones personalizadas. **Primera versión de desarrollo**, todavía no es el acabado premium definitivo.

## Arquitectura
- React + TypeScript + Vite; Three.js WebGL2 en `src/TheaterWorld.ts`.
- Máquina de estados y puzzles en `src/main.tsx`.
- Audio procedural Web Audio API en `src/audio.ts`.
- Canvas PBR con materiales físicos y luces en escena. `GLTFLoader` preparado para incorporar modelos artísticos profesionales GLB durante la fase de producción.
- Controles táctiles con joystick izquierdo y arrastre derecho. Teclado WASD y tecla E en escritorio.

## Flujo actual
Butaca reservada → luces (ámbar, azul, rojo) → proyector (3-1-7) → palanca del telón → invitación.

## Personalización
`?nombre=Martina&evento=Mi%20cumplea%C3%B1os&fecha=S%C3%A1bado%2024%20de%20octubre&hora=21%3A00&lugar=Sal%C3%B3n%20Principal&mensaje=Te%20espero&rsvp=5492211234567`

## Créditos y assets
Escena base creada con geometrías propias y texturas sintéticas de Canvas; no se incluye todavía ningún modelo GLB externo ni grabaciones. Los modelos GLB profesionales, animaciones esqueléticas y mezcla final de sonido son tareas pendientes para la fase visual premium.
