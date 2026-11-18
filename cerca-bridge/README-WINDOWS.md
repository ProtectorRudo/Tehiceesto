# CERCA Bridge — prototipo gratuito en tu PC Windows

**No contrates DonWeb ni Hostinger para esta fase.** Esta es una variante local del instalador VPS; funciona únicamente mientras tu computadora, Docker y el túnel estén encendidos. Usa un número de WhatsApp exclusivo y de prueba. La conexión mediante WhatsApp Web no es oficial y puede ocasionar restricciones al número.

## Requisitos

- Windows 10/11 de 64 bits, WSL2 y Docker Desktop (Linux containers). Docker indica **8 GB de RAM de sistema** para su instalación; CERCA puede necesitar más cuando la PC hace otras tareas. Comprobá además ~15–20 GB libres para imágenes y volúmenes.
- Conexión a Internet estable. No necesitás IP fija, abrir puertos del router, registrar dominio ni pagar una VPS.
- Un teléfono dedicado a CERCA y otro teléfono para probar el diálogo. Las familias solo usan WhatsApp; esta carpeta es exclusiva del administrador.
- El backend actual de CERCA permanece en Render. Su conexión PostgreSQL sigue pendiente; un puente local **no resuelve por sí solo ese bloqueo**.

## Primer inicio

1. Instalá [Docker Desktop para Windows](https://docs.docker.com/desktop/setup/install/windows-install/) y abrilo. Habilitá WSL2 y contenedores Linux.
2. Descomprimí el paquete CERCA Bridge y abrí **PowerShell** en la carpeta `cerca-bridge` (Explorador → barra de dirección → `powershell`).
3. Ejecutá en esa ventana:

   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\start-local.ps1
   ```

   Crea cuatro secretos distintos en `.env.local` y arranca PostgreSQL, Redis, Evolution API, Caddy y un Quick Tunnel de Cloudflare. Nunca se escriben secretos en la consola. La descarga de las imágenes requiere Internet.
4. El script mostrará una URL temporal `https://...trycloudflare.com/`. Esa URL usa HTTPS público pero **es solo de prueba**, cambia al reiniciar el túnel y no dispone de garantías de disponibilidad. Caddy solamente deja pasar las operaciones de vinculación y envío, protegidas por la API key de Evolution; el administrador y la base no quedan públicos.
5. En [Render — CERCA](https://dashboard.render.com/web/srv-dbtpen95efls73clbpvg), con los env vars creados **directamente en Render** (no por chat), configurar `CERCA_PROVIDER=evolution`, `EVOLUTION_API_URL=<URL TEMPORAL>/`, `EVOLUTION_INSTANCE=cerca-piloto`, `EVOLUTION_API_KEY=<...>`, `CERCA_BRIDGE_WEBHOOK_SECRET=<...>`, `CERCA_OPERATOR_PASSWORD=<contraseña independiente >=32 caracteres>`. Mantener `CERCA_SEND_MODE=disabled` y `CERCA_EVOLUTION_SCHEDULED_ALLOWED=false`.
6. Después de completar la conexión limitada de CERCA con PostgreSQL, habilitar únicamente `CERCA_SEND_MODE=test` con `CERCA_TEST_WA_IDS` restringido a números de prueba. Desde `https://cerca-piloto.onrender.com/internal/bridge`, entrar con `cerca-admin` y la contraseña de operador para vincular el número dedicado mediante QR o código. No compartir capturas de QR ni claves.
7. Probar: "Hola", consentimiento, perfil, respuestas, BAJA, y verificar que el backend guardó los datos. Las misiones proactivas seguirán **desactivadas** hasta una decisión posterior.

## Detener sin perder la sesión

```powershell
.\stop-local.ps1
```

No usar `docker compose down -v` porque elimina los datos. Conservá `.env.local` y hacé una copia cifrada cuando el piloto contenga información real.

## Migrar después a un VPS

El código y los flujos siguen siendo los mismos. En el futuro se puede instalar `compose.yaml` y `Caddyfile` en un VPS con dominio estable, actualizar `EVOLUTION_API_URL` en Render y vincular nuevamente el número. **La información familiar permanece en Supabase**, así que no hay que migrar esa base desde tu PC. Los datos locales de sesión de WhatsApp no se migran por defecto: preferimos relink seguro y eliminar la sesión antigua.

## Qué no se ha probado todavía

La validación automática del instalador solo verifica estructura y scripts. Aún hay que ejecutar los contenedores en una PC Windows con Docker, obtener el túnel, vincular WhatsApp y resolver el inicio de sesión `cerca_worker` contra Supabase. Nunca confundir esas pruebas con un piloto real de extremo a extremo.