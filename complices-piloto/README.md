# Cómplices — piloto privado

Aplicación independiente que reutiliza el Supabase de TeHiceEsto y se publica en proyecto Vercel aparte. Código en rama `piloto-complices-20261115` del repositorio `ProtectorRudo/Tehiceesto`, carpeta `complices-piloto`. No modificar rutas ni checkout de TeHiceEsto.

Funciones: cuentas individuales; crear espacio, invitación por código, límite dos; misiones diarias y semanales; corazones; preguntas y mensajes; preferencias privadas y sugerencias autorizadas; chat cómplice guiado; opción de IA generativa con `OPENAI_API_KEY` exclusivamente en backend.

Variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y opcional `OPENAI_API_KEY` (solo servidor). Supabase: tablas `cp_*`, funciones `cp_join_by_invite` y `cp_partner_surprise`; RLS activada.

**Estado**: piloto; sin facturación, sin push en segundo plano y sin WhatsApp; notificaciones del navegador solo con la web abierta, si se autoriza. Configurar SMTP y retorno Auth si se ofrece acceso general. No almacenar secretos en Git. No incluir datos íntimos ni información de terceros en el código.


## Datos personales en el piloto
Cada integrante puede exportar su información mediante `cp_export_my_personal_data()`, o borrar memoria y preferencias de IA mediante `cp_reset_my_ai_profile()`, con doble confirmación desde la web. Estas operaciones afectan exclusivamente datos del integrante autenticado en Cómplices y nunca eliminan cuentas Supabase Auth ni contenidos de TeHiceEsto. La eliminación completa de una cuenta está pendiente.
