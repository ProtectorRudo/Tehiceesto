# TeHiceEsto — Fuente de verdad del recorrido comercial

Actualizado: 30 de octubre de 2026. **Esta regla sustituye cualquier documentación anterior que diga que el equipo recibe datos y personaliza el regalo manualmente.**

## Producto
1. El comprador elige una **experiencia modelo** ya diseñada y probada.
2. Completa los datos de compra y paga mediante Mercado Pago. No se le cobra automáticamente por abrir el regalo.
3. **Solo tras confirmación auténtica del proveedor del pago**, el sistema marca el pedido como aprobado y envía automáticamente un **email con enlace privado** de acceso a `/mis-regalos`.
4. El comprador abre el enlace, inicia sesión con su correo, encuentra sus compras y **edita por sí mismo** los nombres, textos, fotos y audios previstos por el modelo.
5. El comprador previsualiza, **publica** la experiencia y comparte su enlace con la persona destinataria.

**No hay coordinación por WhatsApp, espera al equipo, montaje por una persona ni entrega manual.** WhatsApp es únicamente una vía opcional de soporte.

## Reglas de implementación
- Las escenas, su orden, transiciones, animaciones, efectos y comportamiento móvil de la experiencia modelo son **inmutables**. Solo cambian contenidos previamente editables.
- `order-create` genera `creator.mode="selfserve"` para pedidos nuevos. No dar al navegador privilegios de edición antes del pago.
- `payment-bridge` y el webhook de Mercado Pago son la fuente de verdad de la acreditación; **nunca** confirmar pago desde el redirect del navegador ni desde parámetros manipulables.
- `gift-account` solo entrega acceso para edición tras comprobar que el email autenticado corresponde a una compra aprobada. Pedidos históricos con `mode="assisted"` deben poder convertirse a `selfserve` al abrirlos con la cuenta propietaria, sin alterar pagos.
- `creator-api` requiere un token de edición válido y un pedido aprobado. `saveStudioRecipe` está deshabilitado y `publishStudio` preserva `scene_recipe`.
- El correo de compra abre `/mis-regalos`, no una coordinación humana ni un formulario de envío de recuerdos.
- Las comisiones de afiliados solo corresponden a cobros realmente aprobados; se mantienen las protecciones contra duplicados y reversos.
- No presentar un pedido pendiente ni un mensaje aceptado por Resend como pago o entrega de email ya verificados.

## Validaciones antes de lanzamiento masivo
Compra real con pago aprobado → correo recibido y enlace autenticado → compra visible → editar texto/foto/audio → publicar → URL final visible en móvil → referidos y comisión correctos.

Los cambios y pruebas se siguen en GitHub issue #19.
