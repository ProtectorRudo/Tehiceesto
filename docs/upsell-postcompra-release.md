# TeHiceEsto — Upsell poscompra (Carta sorpresa extra)

## Estado de lanzamiento
- [x] Backend de datos aislado `public.gift_upsells`, con RLS y acceso exclusivo `service_role`
- [x] API principal `upsell-api` activa y protegida por `TEHICEESTO_UPSELL_CHARGE_ENABLED`
- [x] Pantalla `/pedido/[code]` que faltaba para las `success_url` de Mercado Pago
- [x] Pantalla de oferta de $10.000, dos opciones claras, consentimiento de cargo adicional
- [x] Editor en «Mis regalos» y entrega de carta extra mediante `/sorpresa/[code]` sólo tras pago confirmado/publicación
- [x] Motor preparado para segundo Checkout Pro con idempotencia y conciliación de orden
- [x] Tests Playwright: pagada, no pagada, rechazo, móvil y escritorio
- [ ] **Bloqueo de infraestructura**: Supabase `viralio` (ref `bwsgxpttnrctklrcjmjs`) está INACTIVE. Al ejecutar restore, Supabase rechazó por límite de **2 proyectos gratuitos activos**; no se alteró ningún otro proyecto
- [ ] No se pudo desplegar `supabase/functions/tehiceesto-upsell/index.ts` al proyecto inactivo
- [ ] Realizar pruebas de proveedor en entorno sandbox con una cuenta/carta de prueba; verificar status aprobado/rechazado/pendiente/reembolso y webhook o conciliación al abrir la página
- [ ] Sólo después activar `TEHICEESTO_UPSELL_CHARGE_ENABLED=true` en el proyecto Supabase TeHiceEsto (nunca activar antes de recuperar el proveedor)
- [ ] Publicar main en Vercel y verificar alias, pantalla móvil y enlace final

## Seguridad y reglas
- La compra original debe estar `approved`, no reembolsada, y con `paid_at` para presentar oferta.
- Si el proveedor está inactivo la oferta **no aparece**; no puede generarse ningún cargo adicional.
- La oferta extra corresponde a un producto real, carta personalizada, precio **10.000 ARS**; precio e identidad fijados en servidor y DB, no por el navegador.
- Cada regalo/producto tiene una única fila; el checkout adicional tiene clave de idempotencia estable y `external_reference` único. El estado sólo se marca `approved` tras consultar la orden correspondiente con Mercado Pago y verificar monto + referencia.
- El enlace de carta del destinatario sólo aparece después de acreditar el adicional. El texto no se revela antes de publicación.
- El botón «No, gracias» sigue adelante sin cargo.
- **Nunca prometer One-Click Card-on-File** con el Checkout Pro actual. El proveedor puede recordar la tarjeta en su propio flujo, pero es un **segundo pago confirmado**. Para un auténtico cargo sin volver a pasar por Mercado Pago hay que introducir Card-on-File con tokenización, autorización específica de futuros cargos y evaluación de cumplimiento antifraude/3DS.

## Siguiente acción operativa autorizada
La persona responsable de la cuenta Supabase deberá liberar un lugar para el proyecto inactivo o elevar el límite del plan. No pausar proyectos ajenos ni contratar un plan por iniciativa del agente. Luego desplegar la función de proveedor, probar cargos de sandbox y habilitar el feature flag, nunca antes.

## Precaución
No usar parámetros de respuesta como `?extra=exitoso` para marcar un pago aprobado; las URL de retorno no son prueba de acreditación.
