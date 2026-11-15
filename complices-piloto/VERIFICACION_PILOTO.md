# Cómplices — verificación del piloto (15/11/2026)

## Alcance y separación
- URL piloto: https://complices-piloto.onrender.com
- Servicio Render: `srv-dbsshiuk1f9s73a61afg`.
- GitHub: rama `piloto-complices-20261115`, directorio `complices-piloto/`.
- Supabase compartido con TeHiceEsto, **solo** objetos `cp_*`; no modificar regalos, pedidos ni pagos.
- Monetización, WhatsApp y recordatorios diarios con app cerrada: todavía no disponibles.

## Evidencias de pruebas de base (sin persistir identidades)
Se usaron identidades de prueba transitorias en transacciones SQL, revertidas con `ROLLBACK`.
- 10/10: cada pareja solo puede ver sus espacios y mensajes; preferencias y respuestas individuales inaccesibles para terceros; no se puede escribir en espacios ajenos.
- 5/5: crear espacio con RLS; segunda persona acepta invitación; acceso privado; preferencias iniciales; rechazo de una tercera cuenta.
- 5/5: preferencias y endpoints push invisibles para otros, horario de silencio efectivo, aviso habilitado fuera del silencio y sin duplicado.

**No equivalen a una prueba E2E** de navegador, correo real, notificación recibida ni IA generativa.

## Pruebas obligatorias con dos teléfonos reales
1. Revisar `https://supabase.com/dashboard/project/efvvadfxuyieswdqnsjg/auth/url-configuration`: añadir `https://complices-piloto.onrender.com/**` a **Redirect URLs** sin modificar el **Site URL** de TeHiceEsto.
2. En Android, abrir el enlace, crear cuenta y confirmar correo. Revisar que regrese a Cómplices y permita iniciar sesión.
3. Crear espacio; compartir invitación desde el teléfono A; abrirla en teléfono B; crear segunda cuenta, confirmar, unirse. Comprobar que el código no se pierda.
4. Guardar gustos en cada cuenta. Verificar sugerencia al otro solo con `allow_surprises` activado; desactivar y confirmar que vuelva a una sugerencia general.
5. Enviar pregunta, responder, marcar misión como hecha en cada cuenta, comprobar corazones. Abrir juegos en ambos móviles y verificar revelación solo cuando ambos hayan respondido.
6. Probar mensajes privados y que ninguna cuenta vea las respuestas privadas del otro al cómplice.
7. En ambos dispositivos, aceptar notificaciones desde la web instalada si corresponde; enviar mensaje mientras el otro celular tiene la app cerrada. Revisar horario de silencio y desactivar avisos.
8. Crear una clave API de OpenAI desde el panel de la API, cargarla **solo** como `OPENAI_API_KEY` en las variables secretas de Render, con presupuesto de uso; verificar el estado de `/api/status` y probar 3 preguntas personalizadas. ChatGPT Plus no provee automáticamente créditos ni clave API.

## Riesgos/bloqueos pendientes
- Sin redirección permitida en Supabase, los enlaces de confirmación pueden llevar a TeHiceEsto. No tocar el Site URL.
- La instalación PWA y recepción Web Push dependen de permisos y políticas de cada teléfono.
- Las preferencias de notificación incluyen período de silencio en horario de Argentina. Los avisos automáticos cotidianos no están implementados.
- No prometer cifrado extremo a extremo; usar RLS y TLS, no exponer información privada en notificaciones.
- Para separar aún más el piloto de uso comercial, agregar exportación y eliminación segura por usuario.
- No habilitar pagos antes del piloto de 30 días y prueba con 10 a 20 parejas adultas.

## Normas de continuidad
Verificar estado de GitHub, Supabase y Render antes de publicar. Ejecutar migraciones aditivas con RLS. No repetir tareas hechas ni exponer secretos. Distinguir compilado, publicado y probado con dos cuentas reales.
