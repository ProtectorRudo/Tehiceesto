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
- 5/5: crear espacio y preferencias en una sola operación atómica, obtener invitación de 24 caracteres y bloquear un segundo espacio para el mismo usuario.

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

## Mejoras publicadas en esta iteración
- Código de invitación conservado durante el alta y usado en enlace de confirmación si la URL está permitida en Supabase.
- Configuración personal de notificaciones con activación, desactivación y horario de silencio.
- Al cerrar sesión, el navegador deja de recibir notificaciones de la cuenta.
- Creación atómica de espacios por RPC `cp_create_space`; evita alta parcialmente realizada.
- Endpoint de diagnóstico no sensible `GET /api/status` con modo de IA y bandera de Push.


## Motor central incorporado en esta iteración
- Objetos nuevos: `cp_ai_memories`, `cp_ai_activities`, `cp_ai_feedback` con políticas que limitan lectura y escritura a la cuenta dueña.
- Comprobación SQL transaccional: **9/9 controles aprobados** sobre aislamiento entre integrantes de la misma pareja, escritura y lectura privadas, retroalimentación y actualización autorizada. Pruebas revertidas sin dejar datos ficticios.
- Recomendaciones guiadas de diario, semanal y juego, con persistencia, favoritos/descartes y cambio de actividades pendientes al actualizar el perfil.
- **Diferencia de estados:** código implementado ≠ publicado ≠ probado desde dos móviles. Validar logs del último despliegue antes de informar LIVE.
- La IA generativa no funciona si falta `OPENAI_API_KEY`; el motor algorítmico sí puede recomendar actividades sin llamar a la API.


## Nueva verificación: pistas cruzadas, privacidad y recomendaciones
- 8/8 pruebas SQL para que un miembro reciba solo temas autorizados, sin texto libre; sin acceso a otra pareja; revocación inmediata de permisos generales o particulares (transacciones reversibles).
- 5/5 pruebas adicionales: los datos «evitar» NO se transforman en recomendaciones positivas; solo se transmiten los temas positivos y revocables; no hay acceso directo a respuestas.
- Pruebas automáticas añadidas para que temas no autorizados/desconocidos no afecten la selección, las pistas del otro no revelen su texto y la generación siga determinista.
- Todavía faltan dos cuentas reales, correos de confirmación, push en teléfonos y OpenAI API conectada. No confundir tests SQL/build con prueba real de uso.


## Exportación y borrado privado
- 14/14 pruebas SQL (ROLLBACK) con dos cuentas: exportación no incluye mensajes, respuestas ni recuerdos escritos por el otro; borrado no afecta al otro, a los corazones previos, al chat ni a la pareja.
- Interfaz: exportar JSON local, borrar memoria IA con doble confirmación. El borrado real solo ocurre si el usuario lo solicita desde su sesión.
- No elimina cuenta Supabase Auth compartida con TeHiceEsto. La eliminación completa de cuenta y espacio requiere otro flujo.
