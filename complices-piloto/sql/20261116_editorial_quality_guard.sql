-- Cómplices piloto: presupuesto técnico separado para la edición inteligente.
-- Dos generaciones editoriales como máximo por persona y por día local.
-- No agrega información personal ni cambia ningún otro servicio.
create table if not exists comp_private.cp_editorial_calls (
 user_id uuid not null references auth.users(id) on delete cascade,
 day_bucket date not null,
 requests integer not null default 0 check (requests between 0 and 2),
 primary key(user_id,day_bucket)
);
alter table comp_private.cp_editorial_calls enable row level security;
revoke all on comp_private.cp_editorial_calls from public,anon,authenticated;

create or replace function public.cp_claim_editorial_slot()
returns boolean language plpgsql security definer set search_path=''
as $$
declare
 uid uuid:=auth.uid();
 local_day date:=(now() at time zone 'America/Argentina/Buenos_Aires')::date;
 granted integer;
begin
 if uid is null or not exists(select 1 from public.cp_members m where m.user_id=uid) then
  return false;
 end if;
 insert into comp_private.cp_editorial_calls(user_id,day_bucket,requests)
 values(uid,local_day,1)
 on conflict(user_id,day_bucket) do update
  set requests=comp_private.cp_editorial_calls.requests+1
  where comp_private.cp_editorial_calls.requests < 2
 returning requests into granted;
 return granted is not null;
end;
$$;
revoke all on function public.cp_claim_editorial_slot() from public,anon;
grant execute on function public.cp_claim_editorial_slot() to authenticated;
