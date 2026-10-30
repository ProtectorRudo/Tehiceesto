# Mercado Pago: independizar TeHiceEsto de Viralio

**Revisado: 30 de octubre de 2026.** Proyecto activo: `efvvadfxuyieswdqnsjg` (Te Hice Esto). Proyecto pausado: `bwsgxpttnrctklrcjmjs` (Viralio).

## Diagnóstico verificable
- Checkout principal: la Edge Function productiva `order-create` versión 29 llama a `tehiceesto-checkout-v2` alojada en **Viralio**.
- Reconciliación al volver a un pedido: `order-status` versión 9 también consulta esa función de Viralio.
- Conciliación de 5 minutos: la función SQL `reconcile_tehiceesto_payments()` ejecuta HTTP POST al dominio de Viralio. La tarea `tehiceesto-payment-reconciliation` sigue activa.
- El backend `payment-bridge` que guarda las operaciones está en **TeHiceEsto** y verifica firma HMAC y monto.
- Las credenciales Mercado Pago del checkout actual se obtenían por `get_tehiceesto_mp_config()` en la base de datos del proyecto Viralio. No existe esa función en TeHiceEsto y no hay secretos de Mercado Pago configurados en su Vault.
- Registro comprobado: 22 pedidos históricos en TeHiceEsto, 20 aprobados, 0 pendientes al momento de la auditoría. No se editó ningún pedido.

## Código instalado en TeHiceEsto (SIN ACTIVAR COBROS)
- Edge `tehiceesto-checkout-native` v1 ACTIVE. Código: `supabase/functions/tehiceesto-checkout-native/index.ts`. Usa `TEHICEESTO_MP_ACCESS_TOKEN` en secretos del proyecto TeHiceEsto. No llama a Viralio; sigue usando `payment-bridge` de TeHiceEsto. Mantiene misma clave de idempotencia y firma que checkout-v2.
- Edge `tehiceesto-mp-webhook` v1 ACTIVE. Código `supabase/functions/tehiceesto-mp-webhook/index.ts`. Verifica `x-signature`, timestamp y consulta la orden directamente a Mercado Pago; solo sincroniza compras cuyo `external_reference` sea `thi_<token>`, y verifica referencia y monto.
- `order-create` y `order-status` están preparados en el repositorio con `TEHICEESTO_NATIVE_MP_ENABLED` como selector de proveedor. **No se desplegaron estos cambios en producción.** El selector sigue desactivado por defecto, conservando el comportamiento anterior.
- `upsell-api` queda con su propio bloqueo de cargos `TEHICEESTO_UPSELL_CHARGE_ENABLED` desactivado. No debe habilitarse junto con el checkout principal automáticamente.

## Pendiente imprescindible: credenciales y prueba segura
1. En **Mercado Pago Developers**, obtener de la cuenta comerciante el **Access Token de producción** y configurar el secreto de notificaciones para la integración de TeHiceEsto. No enviar secretos por chat, no subirlos a GitHub ni a variables `NEXT_PUBLIC_*`.
2. Guardarlos **directamente en Supabase > Te Hice Esto > Edge Functions > Secrets** como `TEHICEESTO_MP_ACCESS_TOKEN` y `TEHICEESTO_MP_WEBHOOK_SECRET`. La herramienta Supabase disponible en este chat **no tiene acción para escribir secretos**.
3. Probar `GET /functions/v1/tehiceesto-checkout-native?status=1`: `configured:true` y `tokenValid:true`, sin devolver el valor de los secretos.
4. Probar creación de checkout en entorno controlado, consultar orden por proveedor, confirmar `pending`, `approved`, `rejected` y reembolso; probar doble clic e idempotencia.
5. Configurar webhook de **órdenes** a `https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/tehiceesto-mp-webhook` desde MP Developers y probar una notificación real firmada. No confiar en URLs de retorno para acreditar.
6. Desplegar `order-create` y `order-status` preparados, con `TEHICEESTO_NATIVE_MP_ENABLED=true` solo después del paso 3-5.
7. Como parte de la misma activación, cambiar la función SQL `reconcile_tehiceesto_payments()` para que su URL sea el endpoint nativo de TeHiceEsto, sin crear otro cron. **Este SQL está guardado más abajo, NO se ha ejecutado.**
8. Verificar `/comprar/pareja`, `/pedido/[code]`, `/mis-regalos` con compra de prueba; comprobar producción, correo y registro de pago. Solo entonces eliminar definitivamente rutas/credenciales de Viralio.
9. Mantener el upsell de cobro de un clic desactivado hasta tener autorización Card-on-File y validación propia. El checkout nativo no concede la capacidad de cobrar sin otra confirmación por sí solo.

## SQL de corte (pendiente; ejecutar solo tras prueba y activación)
```sql
create or replace function public.reconcile_tehiceesto_payments()
returns integer language plpgsql security definer
set search_path to pg_catalog, public, net
as $$
declare
  purchase record;
  queued integer := 0;
  action_name text;
begin
  for purchase in
    select o.id,o.payment_token,o.provider_reference
    from public.orders o
    left join public.tehiceesto_checkout_recovery_attempts a on a.order_id=o.id
    where o.status='pending'
      and o.payment_token is not null
      and o.created_at > now() - interval '7 days'
      and (
        o.provider_reference is not null
        or (
          o.checkout_url is null
          and o.created_at > now() - interval '4 hours'
          and o.created_at < now() - interval '90 seconds'
          and (a.last_attempt_at is null or a.last_attempt_at < now() - interval '10 minutes')
          and coalesce(a.attempt_count,0)<12
          and exists (select 1 from public.commerce_settings
                      where id='default' and auto_checkout_enabled=true)
        )
      )
    order by o.created_at desc
    limit 100
  loop
    action_name := case when purchase.provider_reference is null then 'create' else 'sync-status' end;

    if action_name='create' then
      insert into public.tehiceesto_checkout_recovery_attempts(order_id,last_attempt_at,attempt_count)
      values (purchase.id,now(),1)
      on conflict (order_id) do update
        set last_attempt_at=excluded.last_attempt_at,
            attempt_count=public.tehiceesto_checkout_recovery_attempts.attempt_count+1;
    end if;

    perform net.http_post(
      url := 'https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/tehiceesto-checkout-native',
      body := jsonb_build_object('action',action_name,'token',purchase.payment_token),
      headers := '{"content-type":"application/json"}'::jsonb,
      timeout_milliseconds := 15000
    );
    queued := queued+1;
  end loop;
  return queued;
end;
$$;
revoke all on function public.reconcile_tehiceesto_payments() from public, anon, authenticated;
-- Reschedule (upsert by job name), never create a second cron task.
select cron.schedule('tehiceesto-payment-reconciliation','*/5 * * * *',
                    'select public.reconcile_tehiceesto_payments();');

```

**Seguridad:** nunca iniciar un cobro real de prueba sin aprobación explícita y no reactivar/parar otros proyectos Supabase para solucionar la cuota.
