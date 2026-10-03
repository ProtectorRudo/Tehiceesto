-- Te Hice Esto — production schema
-- Dedicated Supabase project.
-- Browser roles are denied direct table access. Trusted server code uses
-- a server-only Supabase secret key. Media stays in a private bucket.

create extension if not exists pgcrypto;

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique default encode(gen_random_bytes(9), 'hex'),
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

create index if not exists gifts_status_idx on public.gifts(status);
create index if not exists gift_media_gift_sort_idx on public.gift_media(gift_id, sort_order);
create index if not exists gift_reactions_gift_idx on public.gift_reactions(gift_id);

create unique index if not exists orders_provider_reference_unique_idx
  on public.orders(provider, provider_reference)
  where provider_reference is not null;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists gifts_touch_updated_at on public.gifts;
create trigger gifts_touch_updated_at
before update on public.gifts
for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
before update on public.orders
for each row execute function public.touch_updated_at();

alter table public.gifts enable row level security;
alter table public.gift_media enable row level security;
alter table public.gift_reactions enable row level security;
alter table public.orders enable row level security;

revoke all on table public.gifts from anon, authenticated;
revoke all on table public.gift_media from anon, authenticated;
revoke all on table public.gift_reactions from anon, authenticated;
revoke all on table public.orders from anon, authenticated;

grant select, insert, update, delete on table public.gifts to service_role;
grant select, insert, update, delete on table public.gift_media to service_role;
grant select, insert, update, delete on table public.gift_reactions to service_role;
grant select, insert, update, delete on table public.orders to service_role;

drop policy if exists "deny browser access to gifts" on public.gifts;
create policy "deny browser access to gifts"
on public.gifts
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny browser access to gift_media" on public.gift_media;
create policy "deny browser access to gift_media"
on public.gift_media
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny browser access to gift_reactions" on public.gift_reactions;
create policy "deny browser access to gift_reactions"
on public.gift_reactions
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny browser access to orders" on public.orders;
create policy "deny browser access to orders"
on public.orders
for all
to anon, authenticated
using (false)
with check (false);

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

-- No storage.objects policies by design. Storage is accessed only by trusted
-- server code with the server-only secret key and files are delivered through
-- short-lived signed URLs.


-- Internal operations authentication
create table if not exists public.admin_access (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  secret_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.admin_access enable row level security;
alter table public.admin_sessions enable row level security;

revoke all on table public.admin_access from anon, authenticated;
revoke all on table public.admin_sessions from anon, authenticated;

grant select, insert, update, delete on table public.admin_access to service_role;
grant select, insert, update, delete on table public.admin_sessions to service_role;

drop policy if exists "deny browser access to admin_access" on public.admin_access;
create policy "deny browser access to admin_access"
on public.admin_access
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny browser access to admin_sessions" on public.admin_sessions;
create policy "deny browser access to admin_sessions"
on public.admin_sessions
for all
to anon, authenticated
using (false)
with check (false);

create index if not exists admin_sessions_expires_idx
  on public.admin_sessions(expires_at);
