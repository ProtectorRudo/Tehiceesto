-- CERCA — esquema exclusivamente para un proyecto Supabase NUEVO e independiente.
-- No ejecutar en la base de TeHiceEsto, Cómplices ni Cotironda.
create extension if not exists pgcrypto;
create table public.cerca_families(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null unique references auth.users(id) on delete cascade,
 timezone text not null default 'America/Argentina/Buenos_Aires',
 created_at timestamptz not null default now()
);
create table public.cerca_children(
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.cerca_families(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 55),
 age_years integer not null check(age_years between 0 and 18),
 interests text[] not null default '{}',
 goals text[] not null default '{}',
 notes text not null default '' check(char_length(notes)<=700),
 created_at timestamptz not null default now()
);
create index cerca_children_family on public.cerca_children(family_id);
create table public.cerca_moods(
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.cerca_families(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null,
 mood text not null check(mood in ('bien','normal','cansado','dificil')),
 detail text not null default '' check(char_length(detail)<=400),
 created_at timestamptz not null default now(),
 unique(user_id,day)
);
create table public.cerca_missions(
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.cerca_families(id) on delete cascade,
 child_id uuid references public.cerca_children(id) on delete cascade,
 day date not null,
 kind text not null check(kind in ('conectar','comprender','sembrar','familiar')),
 title text not null,
 how text not null,
 why text not null,
 minutes integer not null check(minutes between 2 and 45),
 origin text not null check(origin in ('ia','editorial')),
 created_at timestamptz not null default now(),
 constraint cerca_family_kind check((kind='familiar' and child_id is null) or (kind<>'familiar' and child_id is not null)),
 constraint cerca_mission_unique unique nulls not distinct(family_id,child_id,day,kind)
);
create index cerca_missions_family_day on public.cerca_missions(family_id,day desc);
create table public.cerca_entries(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 mission_id uuid not null references public.cerca_missions(id) on delete cascade,
 status text not null check(status in ('hecha','omitida')),
 reflection text not null default '' check(char_length(reflection)<=800),
 updated_at timestamptz not null default now(),
 unique(user_id,mission_id)
);
create table public.cerca_guide_usage(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null,
 created_at timestamptz not null default now()
);
create index cerca_guide_usage_user_day on public.cerca_guide_usage(user_id,day);
alter table public.cerca_families enable row level security;
alter table public.cerca_children enable row level security;
alter table public.cerca_moods enable row level security;
alter table public.cerca_missions enable row level security;
alter table public.cerca_entries enable row level security;
alter table public.cerca_guide_usage enable row level security;

create policy cerca_family_owner on public.cerca_families for all to authenticated
 using (owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));

create policy cerca_child_owner on public.cerca_children for all to authenticated
 using (exists(select 1 from public.cerca_families f where f.id=family_id and f.owner_id=(select auth.uid())))
 with check (exists(select 1 from public.cerca_families f where f.id=family_id and f.owner_id=(select auth.uid())));

create policy cerca_mood_owner on public.cerca_moods for all to authenticated
 using(user_id=(select auth.uid()) and exists(select 1 from public.cerca_families f where f.id=family_id and f.owner_id=(select auth.uid())))
 with check(user_id=(select auth.uid()) and exists(select 1 from public.cerca_families f where f.id=family_id and f.owner_id=(select auth.uid())));

create policy cerca_mission_owner on public.cerca_missions for all to authenticated
 using(exists(select 1 from public.cerca_families f where f.id=family_id and f.owner_id=(select auth.uid())))
 with check(exists(select 1 from public.cerca_families f where f.id=family_id and f.owner_id=(select auth.uid())) and
  (child_id is null or exists(select 1 from public.cerca_children c where c.id=child_id and c.family_id=family_id)));

create policy cerca_entries_owner on public.cerca_entries for all to authenticated
 using(user_id=(select auth.uid()) and exists(select 1 from public.cerca_missions m join public.cerca_families f on f.id=m.family_id where m.id=mission_id and f.owner_id=(select auth.uid())))
 with check(user_id=(select auth.uid()) and exists(select 1 from public.cerca_missions m join public.cerca_families f on f.id=m.family_id where m.id=mission_id and f.owner_id=(select auth.uid())));

create policy cerca_guide_usage_owner on public.cerca_guide_usage for all to authenticated
 using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

grant usage on schema public to authenticated;
grant select,insert,update,delete on public.cerca_families,public.cerca_children,public.cerca_moods,public.cerca_missions,public.cerca_entries,public.cerca_guide_usage to authenticated;
revoke all on public.cerca_families,public.cerca_children,public.cerca_moods,public.cerca_missions,public.cerca_entries,public.cerca_guide_usage from anon;
