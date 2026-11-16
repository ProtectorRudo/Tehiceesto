# CERCA — piloto privado independiente

CERCA es una aplicación móvil instalable para adultos que quieren cuidar su vínculo con sus hijos: exactamente 3 misiones diarias por hijo (conectar, comprender, sembrar autonomía) y una misión semanal familiar. Los menores no crean cuentas ni reciben solicitudes. No es terapia ni un sistema de obediencia.

## Aislamiento confirmado
- Carpeta **cerca-piloto/** en rama **cerca-piloto-20261116**; no modifica código de Cómplices, Cotironda ni TeHiceEsto. Repositorio contenedor compartido temporalmente hasta crear un repositorio independiente cuando esté disponible la operación.
- Servicio Render exclusivo con build/start `cd cerca-piloto && ...`.
- Requiere **proyecto Supabase nuevo**, NO utilizar los existentes. El archivo sql/001_initial.sql está preparado pero no debe ejecutarse en ninguna base compartida.
- OpenAI solo en servidor, con clave propia de CERCA; `store:false`, sin secretos en el repositorio.
- Protección: RLS en todas las tablas, titular único por familia en esta fase, mínimo de datos de menores, exportación y borrado de datos familiares.
- No hay cobros, testimonios inventados, gamificación competitiva ni notificaciones enviadas sin permiso.

## Arranque
1. Crear proyecto Supabase **cerca-piloto** independiente en `sa-east-1`.
2. Ejecutar exclusivamente allí `sql/001_initial.sql`; inspeccionar advisors de seguridad.
3. Configurar Render en la rama CERCA con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (solo valores de CERCA).
4. Configurar `OPENAI_API_KEY` en el servidor y opcional `CERCA_OPENAI_MODEL=gpt-6.1-terra`. Sin clave, las misiones provienen de biblioteca editorial, identificada como tal.
5. Configurar los enlaces de Auth y email en Supabase apuntando a la URL pública CERCA; probar registro, verificación de correo y sesión.
6. Probar de punta a punta una familia: crear adulto > añadir dos hijos > ánimo > 3×2 misiones + una semanal > completar/omitir > recuerdo > historial > guía > exportar > eliminar.
7. Confirmar que otra cuenta no puede leer perfiles, misiones ni recuerdos ajenos (prueba de RLS negativa).

## Estado real 2026-11-16
- Implementado: aplicación Next.js, autenticación Supabase con contraseña, perfiles, calendario, misiones con validación y caché, referencia editorial de contingencia, ánimo, guía IA, recuerdos, exportación, borrado de datos familiares, PWA, tests.
- Pendiente: proyecto Supabase separado y migración aplicada, configurar credenciales, prueba real de sesiones, OpenAI conectado, notificaciones Web Push, relatos familiares de fuente revisada, segundo adulto con permisos, baja completa de Supabase Auth, pagos, auditoría end-to-end. **No anunciar piloto funcional antes de probarlo**.
- Debilidad a corregir: biblioteca editorial tiene una variante por franja de edad y repite propuestas en distintos días si se usa sin OpenAI. El motor IA también requiere mayor diversidad y evaluación en familias reales antes de apertura comercial.
- Seguridad: la cuenta Auth continúa después de `Eliminar datos familiares`. La baja total de cuentas requiere implementación y revisión adicional.

## Evidencia consultada
- https://www.cdc.gov/child-development/positive-parenting-tips/index.html
- https://developingchild.harvard.edu/resource-guides/guide-serve-and-return/
- https://supabase.com/docs/guides/api/securing-your-api
