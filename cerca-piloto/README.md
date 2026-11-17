# CERCA — servicio WhatsApp

La interfaz para las familias es exclusivamente WhatsApp. Este despliegue de Render ejecuta `whatsapp-backend/src/server.mjs`, sin chatbot abierto y sin aplicación web para clientes.

**Por defecto CERCA_SEND_MODE=disabled: no envía mensajes externos.** El registro, el envío real y los costos requieren Supabase separado, credenciales Meta Cloud API, plantillas aprobadas y autorización de activación.

Código, SQL, test y documentación en [whatsapp-backend/](./whatsapp-backend/). Las funciones web preliminares conservadas en esta rama son legado no ejecutado. No usar las tablas de TeHiceEsto o Cómplices.

Comandos: `npm run build`, `npm start`, `curl http://localhost:3000/healthz`.
