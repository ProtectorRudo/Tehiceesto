# Te Hice Esto

**Un regalo que no se abre. Se vive.**

Te Hice Esto es una plataforma de experiencias digitales personalizadas. No vende páginas: convierte fotos, audios, cartas, recuerdos y pequeñas interacciones en recorridos emocionales privados.

## Estado actual

- Home comercial premium y mobile-first.
- 8 experiencias iniciales:
  - Pareja
  - Cumpleaños
  - Hijos
  - Abuelos
  - Aniversario
  - Propuesta de casamiento
  - Mamá / Papá
  - Amistad
- Cada ocasión tiene una receta distinta de escenas.
- Motor interactivo reutilizable.
- Creador guiado de 6 pasos con autosave local.
- Preview con nombres, carta y fotos del cliente antes de publicar.
- Ruta privada `/r/[code]` preparada para regalos reales.
- Esquema seguro de Supabase en `supabase/schema.sql`.
- Panel interno protegido en `/admin`.
- CI de GitHub Actions ejecutando `next build` en cada push.
- Regalos privados y panel con `noindex`.

## Filosofía del producto

```
Historia + medios + receta de escenas + personalización = experiencia privada
```

Un regalo no es un HTML nuevo. Miles de regalos pueden ejecutarse sobre el mismo motor.

## Flujo previsto

```
Home
  ↓
Elegir experiencia
  ↓
Contar historia + subir recuerdos
  ↓
Preview local privado
  ↓
Pago
  ↓
Persistencia segura
  ↓
tehiceesto.com/r/CODIGO
  ↓
Reacción del destinatario
```

El borrador se mantiene local antes de publicar para reducir basura en base de datos y limitar la exposición temprana de fotos e historias personales.

## Datos y privacidad

La arquitectura prevista usa un proyecto Supabase exclusivo para Te Hice Esto:

- tablas con RLS activo;
- sin permisos de lectura para `anon` ni `authenticated`;
- consultas públicas resueltas únicamente por el servidor de Next.js;
- media en bucket privado;
- URLs firmadas para contenido;
- clave secreta únicamente del lado servidor;
- URLs de regalos con códigos no predecibles.

Variables necesarias cuando conectemos la base:

```env
SUPABASE_URL=
SUPABASE_SECRET_KEY=
ADMIN_ACCESS_KEY=
MERCADOPAGO_ACCESS_TOKEN=
```

## Rutas

- `/`
- `/crear`
- `/experiencias/[slug]`
- `/r/[code]`
- `/admin`

## Siguientes etapas

1. Crear Supabase exclusivo y aplicar el esquema.
2. Storage real de fotos, audio y video.
3. Persistir regalo al aprobar pago.
4. Mercado Pago + webhook idempotente.
5. Publicación automática del código privado.
6. Editor interno de escenas.
7. Reacciones del destinatario.
8. Narrativa asistida por IA.
9. Métricas de conversión y finalización.

## Desarrollo

```bash
npm install
npm run dev
```

Producción:

```bash
npm run build
npm start
```
