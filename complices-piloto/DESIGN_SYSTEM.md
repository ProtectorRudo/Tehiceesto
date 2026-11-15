# Cómplices — Sistema visual v2 (15/11/2026)

## Objetivo
Rediseño mobile-first del piloto privado para parejas adultas, siguiendo el clima visual de la referencia Paired sin utilizar su código, marca, pantallas ni recursos gráficos. Estilo propio de Cómplices: cálido, sofisticado, luminoso, íntimo y simple. El trabajo afecta **solo** a la carpeta \`complices-piloto/\` de la rama \`piloto-complices-20261115\`.

## Identidad
- Fondo crema/rosa: \`#FFF8F8\`.
- Berenjena oscura para títulos: \`#492342\`; berenjena \`#6A2E5B\`.
- Rosa principal: \`#E75F86\`, gradiente interactivo \`#EB6A92\` a \`#C44073\`.
- Lila: \`#E9D5F5\`; melocotón \`#FFD6CE\`; rosa pálido \`#F9A8B8\`.
- Tipos existentes \`DM Sans\` para UI y \`Instrument Serif\` para títulos con personalidad.
- Esquinas suaves 15–29px, tarjetas blancas con sombras discretas y respiración generosa.
- SVG propio \`public/couple-sunset.svg\` para portada y hero, logo propio \`public/icon.svg\`. Sin copiar assets de Paired.

## Pantallas
1. **Portada y acceso**: mensaje emocional, ilustración de pareja, beneficios, registro y login reales.
2. **Creación o unión**: se reutiliza el alta y código privado existente en una pantalla más clara.
3. **Hoy**: saludo, portada ilustrada, corazones, 2 misiones diarias, semanal, pregunta y cómplice personal.
4. **Misiones**: navegación diaria/semanal, tarjetas compactas, confirmación personal y evaluación de recomendación.
5. **Juegos**: juegos cooperativos existentes y pregunta recomendada por el motor central.
6. **Preguntas**: temas, gran tarjeta de pregunta, envío, pregunta manual y respuestas/historial.
7. **Chat**: burbujas con jerarquía visual, historial y envío de mensajes reales.
8. **Mi cómplice**: ideas, preferencias, reflexiones privadas, memorias, permiso de pistas y modo guiado/generativo según configuración.
9. **Perfil y privacidad**: pantalla independiente, horarios de silencio, exportación JSON, borrado de memoria y cierre de sesión.

Navegación inferior: Hoy, Misiones, Juegos, Chat, Cómplice. Las preguntas se alcanzan desde Juegos o Hoy. Perfil se abre desde el botón superior con etiqueta accesible.

## Implementación
- \`app/paired-redesign.css\`: capa de diseño agregada tras \`app/globals.css\` para no romper estilos funcionales antiguos mientras se refina el piloto.
- \`app/page.jsx\`: reorganización de la presentación y navegación, conservando consultas Supabase y endpoints existentes.
- \`app/layout.jsx\`: metadatos y \`themeColor\` claro.
- \`public/couple-sunset.svg\` y \`public/icon.svg\`: ilustraciones originales, escalables y sin dependencias externas.
- \`tests/redesign.test.mjs\`: 8 controles de presencia de pantallas, privacidad y sistema visual que se suman a los 11 tests del motor central durante \`npm test && next build\`.

## Reglas importantes
- Este trabajo **no conecta automáticamente** \`OPENAI_API_KEY\`; la IA generativa sigue pendiente de configuración en Render, el modo guiado continúa.
- No altera tablas, RLS, contratos de API, suscripción ni lógica de pagos. TeHiceEsto.com no cambia.
- Compilar y publicar no sustituyen las pruebas reales de dos celulares ni una inspección visual en navegadores reales. Verificar iPhone Safari/Android Chrome y tamaños de texto.
- En caso de fallos visuales, ajustar clases en \`paired-redesign.css\` sin reescribir o duplicar la lógica de usuarios y consentimientos.
