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

-- Individual complimentary grants are operational support records and MUST NOT
-- be seeded by schema migrations. Grant/revoke them explicitly and auditably
-- for an authenticated buyer in the intended environment only.
