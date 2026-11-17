# CERCA — piloto independiente WhatsApp

**Interfaz de clientes:** exclusivamente WhatsApp, con mensajes programados y flujos predefinidos. No es una aplicación web ni una IA de consulta libre.

**Infraestructura:** servicio independiente `cerca-piloto` en Render; backend en [`whatsapp-backend/`](./whatsapp-backend/). Datos de CERCA en el esquema privado `cerca` del proyecto Supabase de **Te Hice Esto**, con RLS y rol técnico limitado `cerca_worker`. Es independencia lógica, no física: comparte cuotas de cómputo y disponibilidad de Supabase, pero no comparte tablas ni permisos de acceso a datos de las otras aplicaciones. El rol se creó sin capacidad de iniciar sesión hasta configurar el pooler; no se usó la clave de administrador compartida.

**Seguridad:** mensajes externos por defecto **desactivados** (`CERCA_SEND_MODE=disabled`), aún faltan credenciales y plantillas de Meta. No compartir claves en GitHub ni habilitar `service_role` de Te Hice Esto para CERCA.

**Documentación y migraciones:** ver [`whatsapp-backend/README.md`](./whatsapp-backend/README.md) y [`whatsapp-backend/sql/002_cerca_shared_private.sql`](./whatsapp-backend/sql/002_cerca_shared_private.sql). La migración 001 queda como referencia histórica para proyecto autónomo; NO ejecutarla en el Supabase compartido.

`npm run build` ejecuta las pruebas y `npm start` inicia el webhook HTTP; Node >=22.