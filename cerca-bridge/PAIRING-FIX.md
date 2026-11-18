# CERCA — corrección de vinculación WhatsApp (Windows, piloto)

Problema reproducido: `Evolution API v2.3.7` genera un QR y el teléfono responde que no puede vincularse; la sesión permanece `close`.

Fuente del parche: [Evolution PR 2759](https://github.com/evolution-foundation/evolution-api/pull/2759), commit `d0198733da3cb133bd0c64d24fc4d1e7720696b1`, Git blob `fe1884e6251a879a181e8f74705a6d68d3794297`. Cambios upstream: Baileys rc14 + `companion_reg_refresh` y guard en `link_code_companion_reg`.

Este cambio NO se aplica solo al subir el commit: la imagen es local en Windows y debe ser construida allá. El instalador local debe cambiar solamente el servicio `evolution`, conservar volúmenes, respaldar `compose.local.yaml` y verificar la integridad antes del build. `.dockerignore` evita copiar `.env.local` al contexto Docker.

IMPORTANTE: solución comunitaria pendiente de fusionar upstream, no garantiza éxito en todos los números. No afecta la base Supabase, backend Render, OFI, Cómplices ni Cotironda. No iniciar mensajes hasta vincular el número de prueba y autorizar el modo de prueba.
