-- Te Hice Esto — production schema blueprint
-- Apply to a dedicated Supabase project for this product.
-- Tables are intentionally private to browser clients: the Next.js server
-- reads/writes them with the server-only secret key.

create extension if not exists pgcrypto;

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique,
  status text not null default 'draft'
    check (status in ('draft','awaiting_payment','paid','published','archived')),
  experience_slug text not null,
  giver_name text not null,
  recipient_name text not null,
  occasion text,
  feeling text,
  opening_text text,
  letter_text text,
  closing_text text,
  music_url text,
  scene_recipe jsonb not null default '[]'::jsonb,
  story_data jsonb not null default '{}'::jsonb,
  theme_data jsonb not null default '{}'::jsonb,
  reactions_enabled boolean not null default true,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gift_media (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts(id) on delete cascade,
  kind text not null check (kind in ('image','video','audio')),
  storage_path text not null,
  caption text,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.gift_reactions (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts(id) on delete cascade,
  emoji text,
  message text,
  audio_storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null unique references public.gifts(id) on delete cascade,
  provider text not null default 'mercadopago',
  provider_reference text,
  amount_minor integer,
  currency text not null default 'ARS',
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','refunded','cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gifts_public_code_idx on public.gifts(public_code);
create index if not exists gifts_status_idx on public.gifts(status);
create index if not exists gift_media_gift_sort_idx on public.gift_media(gift_id, sort_order);
create index if not exists gift_reactions_gift_idx on public.gift_reactions(gift_id);
create index if not exists orders_provider_reference_idx on public.orders(provider_reference);

alter table public.gifts enable row level security;
alter table public.gift_media enable row level security;
alter table public.gift_reactions enable row level security;
alter table public.orders enable row level security;

-- Browser roles intentionally receive no table privileges.
revoke all on table public.gifts from anon, authenticated;
revoke all on table public.gift_media from anon, authenticated;
revoke all on table public.gift_reactions from anon, authenticated;
revoke all on table public.orders from anon, authenticated;

-- Required for projects where new tables are no longer auto-exposed.
grant select, insert, update, delete on table public.gifts to service_role;
grant select, insert, update, delete on table public.gift_media to service_role;
grant select, insert, update, delete on table public.gift_reactions to service_role;
grant select, insert, update, delete on table public.orders to service_role;

-- Private media bucket. Delivery should use short-lived signed URLs from the server.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gift-media',
  'gift-media',
  false,
  52428800,
  array[
    'image/jpeg','image/png','image/webp','image/heic',
    'audio/mpeg','audio/mp4','audio/webm','audio/wav',
    'video/mp4','video/webm','video/quicktime'
  ]
)
on conflict (id) do nothing;

-- No storage.objects policies on purpose. All upload/sign/delete operations are
-- performed by our trusted server using the server-only secret key.
