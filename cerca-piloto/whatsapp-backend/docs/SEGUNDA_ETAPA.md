# CERCA — Fase de integración sobre Supabase compartido — 17/11/2026

## Hecho
- Auditadas las tablas: `public` contiene Te Hice Esto y Cómplices, con `comp_private` para datos internos de Cómplices.
- Se aplicó exclusivamente una migración a un NUEVO esquema `cerca` en el proyecto `Te Hice Esto`.
- Hay tablas nuevas `cerca.families`, `cerca.events`, `cerca.outbox` y función `cerca.apply_event` (`SECURITY INVOKER`).
- RLS habilitada en todas las tablas nuevas; `anon` y `authenticated` sin USAGE de esquema ni SELECT de tablas; `cerca_worker` sin SELECT sobre `public.gifts`, `public.cp_spaces` y `public.cp_preferences`.
- `cerca_worker` creado `NOLOGIN` hasta conectar Render, sin contraseña en código.
- Backend integrado con adaptador SQL de permisos mínimos; llamadas siempre calificadas con `cerca.`.
- Entrega WhatsApp por defecto desactivada.

## Pendiente para activar DB de Render
1. En Supabase proyecto Te Hice Esto > Connect, seleccionar Session pooler. Copiar el hostname exacto (índice de pooler no deducible por región). No compartir la contraseña de postgres.
2. Habilitar `LOGIN` y establecer contraseña **exclusiva** para `cerca_worker` por SQL administrativo sin conservar el secreto en el código; guardarla directamente como `CERCA_DB_PASSWORD` en Render.
3. Configurar `CERCA_DB_HOST` SOLO en el servicio `cerca-piloto` de Render con el hostname copiado de Supabase Connect (sin usuario ni contraseña). `CERCA_DB_PROJECT_REF=efvvadfxuyieswdqnsjg`. El backend construye la URI por puerto 5432 y exige TLS con verificación de certificado. Confirmar conectividad con `/healthz` mostrando `database=ready`.
4. Probar `/healthz` y un registro ficticio por webhook firmado (o prueba end-to-end de base), manteniendo envíos desactivados.
5. Configurar número Meta Cloud API, webhook, plantillas aprobadas y whitelist de pruebas; revisar políticas actuales y consumo.

NO tocar proyectos OFI, Cómplices ni Cotironda. No usar el `service_role` compartido de Te Hice Esto. No declarar WhatsApp funcional hasta prueba real de teléfono a teléfono.