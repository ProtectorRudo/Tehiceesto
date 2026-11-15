# Cómplices — piloto privado

Aplicación independiente que reutiliza el Supabase de TeHiceEsto y se publica en proyecto Vercel aparte. Código en rama `piloto-complices-20261115` del repositorio `ProtectorRudo/Tehiceesto`, carpeta `complices-piloto`. No modificar rutas ni checkout de TeHiceEsto.

Funciones: cuentas individuales; crear espacio, invitación por código, límite dos; misiones diarias y semanales; corazones; preguntas y mensajes; preferencias privadas y sugerencias autorizadas; chat cómplice guiado; opción de IA generativa con `OPENAI_API_KEY` exclusivamente en backend.

Variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y opcional `OPENAI_API_KEY` (solo servidor). Supabase: tablas `cp_*`, funciones `cp_join_by_invite` y `cp_partner_surprise`; RLS activada.

**Estado**: piloto; sin facturación, sin push en segundo plano y sin WhatsApp; notificaciones del navegador solo con la web abierta, si se autoriza. Configurar SMTP y retorno Auth si se ofrece acceso general. No almacenar secretos en Git. No incluir datos íntimos ni información de terceros en el código.
