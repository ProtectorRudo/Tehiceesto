-- Manual, revocable product rights for explicitly authorized refunded test purchases.
-- Never reinterpret the Mercado Pago order or upsell payment status.
create table if not exists public.complimentary_access_grants (
  order_id uuid not null references public.orders(id) on delete cascade,
  gift_id uuid not null references public.gifts(id) on delete cascade,
  product_code text not null check (product_code in ('dragon-ball-pareja','pack_juegos_v1')),
  reason text not null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  primary key (order_id, product_code),
  constraint complimentary_access_expiry check (expires_at is null or expires_at > granted_at)
);
create index if not exists complimentary_access_grants_gift_idx on public.complimentary_access_grants (gift_id);
alter table public.complimentary_access_grants enable row level security;
revoke all privileges on public.complimentary_access_grants from public, anon, authenticated;
grant select, insert, update, delete on public.complimentary_access_grants to service_role;
comment on table public.complimentary_access_grants is 'Manual support licenses, never proof of a paid Mercado Pago order; query with verified buyer identity and order ownership.';

-- A one-off, explicit owner authorization for the precise test purchase.
-- Preserve all existing photo/media references and the refunded provider ledger.
insert into public.complimentary_access_grants(order_id,gift_id,product_code,reason)
select o.id,o.gift_id,g.product_code,
  'Excepción de prueba autorizada expresamente por el propietario el 2026-11-02: compra reembolsada; acceso de cortesía al regalo y a los cuatro juegos'
from public.orders o
cross join (values ('dragon-ball-pareja'),('pack_juegos_v1')) as g(product_code)
join public.gifts gift on gift.id=o.gift_id
where o.id='bd35b2a3-97bd-4acb-bd27-ba6915067ca8'::uuid
  and o.status='refunded'
  and o.refunded_amount_minor=o.amount_minor
  and o.amount_minor=3500000
  and gift.experience_slug='dragon-ball-pareja'
  and gift.story_data #>> '{creator,mode}'='selfserve'
  and (gift.story_data #>> '{checkout,addonCode}')='pack_juegos_v1'
  and exists (select 1 from public.gift_upsells x where x.order_id=o.id and x.gift_id=o.gift_id and x.product_code='pack_juegos_v1' and x.status='refunded')
on conflict (order_id,product_code) do nothing;
