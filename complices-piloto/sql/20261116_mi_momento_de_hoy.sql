-- Cómplices / Mi momento de hoy. Exclusivo del piloto.
-- Los estados emocionales son privados. La pareja recibe únicamente una necesidad
-- previamente autorizada (código cerrado), sin ánimo, notas ni respuestas personales.

create table public.cp_today_moods (
  user_id uuid primary key references auth.users(id) on delete cascade,
  space_id uuid not null references public.cp_spaces(id) on delete cascade,
  day date not null,
  mood text not null check (mood in ('feliz','calma','cansancio','preocupacion','tristeza','angustia','estres','carino')),
  care_need text check (care_need in ('abrazo','escucha','descanso','detalle','espacio')),
  share_care_hint boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint cp_today_moods_share_requires_need check (not share_care_hint or care_need is not null)
);
comment on table public.cp_today_moods is 'Registro propio y privado del momento del día; ningún otro integrante puede leer las emociones.';
alter table public.cp_today_moods enable row level security;
revoke all on public.cp_today_moods from public, anon, authenticated;
grant select, insert, update, delete on public.cp_today_moods to authenticated;
create policy cp_today_moods_owner_read on public.cp_today_moods for select to authenticated
  using ((select auth.uid()) = user_id);
create policy cp_today_moods_owner_insert on public.cp_today_moods for insert to authenticated
  with check ((select auth.uid()) = user_id and exists (
    select 1 from public.cp_members m where m.user_id=(select auth.uid()) and m.space_id=cp_today_moods.space_id
  ));
create policy cp_today_moods_owner_update on public.cp_today_moods for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and exists (
    select 1 from public.cp_members m where m.user_id=(select auth.uid()) and m.space_id=cp_today_moods.space_id
  ));
create policy cp_today_moods_owner_delete on public.cp_today_moods for delete to authenticated
  using ((select auth.uid()) = user_id);

create table public.cp_partner_care_hints (
  user_id uuid primary key references auth.users(id) on delete cascade,
  space_id uuid not null references public.cp_spaces(id) on delete cascade,
  day date not null,
  care_need text not null check (care_need in ('abrazo','escucha','descanso','detalle','espacio')),
  updated_at timestamptz not null default now()
);
comment on table public.cp_partner_care_hints is 'Solo necesidad autorizada para hoy; nunca contiene el estado emocional.';
create index cp_partner_care_hints_space_day_idx on public.cp_partner_care_hints(space_id,day);
alter table public.cp_partner_care_hints enable row level security;
revoke all on public.cp_partner_care_hints from public, anon, authenticated;
grant select on public.cp_partner_care_hints to authenticated;
create policy cp_partner_care_hints_read on public.cp_partner_care_hints for select to authenticated
  using (
    user_id <> (select auth.uid())
    and day = (now() at time zone 'America/Argentina/Buenos_Aires')::date
    and exists (
      select 1 from public.cp_members m
      where m.user_id = (select auth.uid()) and m.space_id = cp_partner_care_hints.space_id
    )
  );

-- El espejo está controlado por trigger y no admite escrituras del cliente.
create function comp_private.cp_sync_today_care_hint()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.cp_partner_care_hints where user_id = old.user_id;
    return old;
  end if;

  delete from public.cp_partner_care_hints where user_id = new.user_id;

  if new.share_care_hint and new.care_need is not null
     and new.day = (now() at time zone 'America/Argentina/Buenos_Aires')::date then
    insert into public.cp_partner_care_hints (user_id,space_id,day,care_need,updated_at)
    values (new.user_id,new.space_id,new.day,new.care_need,now());
  end if;
  return new;
end;
$$;
revoke all on function comp_private.cp_sync_today_care_hint() from public, anon, authenticated;
create trigger cp_sync_today_care_hint
after insert or update or delete on public.cp_today_moods
for each row execute function comp_private.cp_sync_today_care_hint();
