# Frasco 365 — protocolo de lanzamiento

Estado a 29 de octubre de 2026: **desarrollo + CI visual listo; venta y deploy bloqueados**.

## Producto aprobado
- «Un año de cosas lindas» / slug `frasco365`; modelo visual fijo (cristal, notas pastel, papel desplegado, microanimaciones y recuerdos abiertos).
- 365 mensajes redactados en `data/jar365-notes.ts`; auditoría comprobó 365 textos/posiciones únicos.
- La persona que compra puede cambiar todos los textos y sus 10 categorías en `/mis-regalos`; también hay editor administrativo.
- La experiencia del destinatario vive en `/r/[code]`, con solo un cupo al iniciar y otro por cada **24 horas desde la primera apertura**. Los cupos no utilizados se acumulan. Las aperturas no se pueden adelantar cambiando el reloj del teléfono.
- Los mensajes por abrir nunca salen en el endpoint público; se almacenan en `public.jar365_notes` (RLS habilitada, sin acceso anon/authenticated) y el progreso en `public.jar365_collections` / `jar365_openings`.
- La apertura atómica utiliza `public.jar365_open_note(uuid)` restringida a `service_role`.

## Evidencia de auditoría
- GitHub Actions Build pasó (run 304).
- Playwright auditó móvil 320px, móvil 390px y desktop; 3/3 pasaron sin errores JS ni overflow; apertura, cierre e historial funcionaron. Run 40977477932; capturas en artefacto `jar365-visual-report`.
- Luego se agregó el cambio para liberar el nuevo cupo sin recargar, y la ruta administrativa `/admin/api/jar365`; compilar y repetir la auditoría para ese HEAD.
- Demo independiente: sin header global ni WhatsApp encima del CTA.

## Impedimentos de lanzamiento
1. **Backend de pedidos no reconoce todavía `frasco365`.** Proyecto Supabase TeHiceEsto `efvvadfxuyieswdqnsjg`, función `order-create` versión 27. Falta agregar al objeto `recipes`:
   `"frasco365":["jar365"],`
   y en `versionForNewGift`: `slug==="frasco365"?"jar365-v1":...`.
   Se intentó desplegar esta modificación, pero el conector bloqueó la operación. `creator-api` sí quedó actualizada en v31 con `frasco365` y su receta.
   **No fusionar ni activar ventas mientras order-create rechace este slug.** Jamás usar la categoría de otro producto para cobrar la nueva experiencia.
2. **Vercel cuota diaria.** Checks de Vercel para la PR fallan por `api-deployments-free-per-day`; no hay deployment verificado ni publicación en tehiceesto.com.

## Pruebas pendientes antes de vender
- Probar un pedido controlado sin cobro real y verificar `experience_slug=frasco365`, `scene_recipe=["jar365"]`, `template_version=jar365-v1` y precio $25.000 ARS vigente.
- Verificar que solo un pago aprobado permita editor comprador; guardar 365 textos; abrir regalo publicado; confirmar papelito editado en lugar del modelo.
- Verificar una primera apertura autorizada, segunda bloqueada (HTTP 409), siguiente cupo a las 24h y acumulación tras varios días, también con dos aperturas simultáneas.
- Comprobar cuenta comprador, admin, enlace privado, 320px/390px/desktop y reducción de movimiento.
- Confirmar que otros modelos y compras de TeHiceEsto no cambian.
- Con CI y backend verificados, fusionar PR #4, publicar última `main`, validar SHA y dominio final.

No declarar producto publicado o comercialmente operativo hasta completar esto.
