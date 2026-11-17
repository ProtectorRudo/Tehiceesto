-- CERCA WhatsApp: separate private schema within Te Hice Esto's shared Supabase project.
-- Never touches public.*, comp_private.*, auth.*, storage.* or existing code.
-- The app uses a dedicated PostgreSQL login and queries only cerca.* over TLS.
-- This migration intentionally creates the app role as NOLOGIN: enabling LOGIN and
-- setting its password are separate secret-management steps, never checked into Git.
create schema if not exists cerca;
do $$ begin
  if not exists(select 1 from pg_roles where rolname='cerca_worker') then
    create role cerca_worker nologin noinherit;
  end if;
end $$;
revoke all on schema cerca from public, anon, authenticated;
grant usage on schema cerca to cerca_worker;

create table cerca.families (
 id uuid primary key default gen_random_uuid(),
 wa_id text not null unique check (wa_id ~ '^[0-9]{7,16}$'),
 revision integer not null default 1,
 state jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create table cerca.events (
 event_id text primary key,
 family_id uuid not null references cerca.families(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table cerca.outbox (
 job_key text primary key,
 family_id uuid not null references cerca.families(id) on delete cascade,
 wa_id text not null,
 payload jsonb not null,
 channel text not null check(channel in ('service','marketing')),
 status text not null default 'pending' check(status in ('pending','sent','cancelled')),
 attempts integer not null default 0,
 expires_at timestamptz,
 sent_at timestamptz,
 provider_message_id text,
 delivery_status text check(delivery_status in ('sent','delivered','read','failed')),
 created_at timestamptz not null default now()
);
create index outbox_pending_idx on cerca.outbox(status,created_at) where status='pending';
create index outbox_monthly_idx on cerca.outbox(sent_at) where status='sent';
create index events_created_idx on cerca.events(created_at);
create unique index outbox_provider_id_idx on cerca.outbox(provider_message_id) where provider_message_id is not null;

alter table cerca.families enable row level security;
alter table cerca.events enable row level security;
alter table cerca.outbox enable row level security;
-- The worker is a SERVER-SIDE application identity, not an end user. Family isolation
-- is enforced in the signed WhatsApp webhook/flow; the worker alone sees CERCA rows.
create policy worker_families on cerca.families for all to cerca_worker using (true) with check (true);
create policy worker_events on cerca.events for all to cerca_worker using (true) with check (true);
create policy worker_outbox on cerca.outbox for all to cerca_worker using (true) with check (true);
revoke all on all tables in schema cerca from public,anon,authenticated;
grant select,insert,update,delete on cerca.families,cerca.events,cerca.outbox to cerca_worker;

-- Atomic state commit; function is SECURITY INVOKER (not definer) and accessible
-- only to the private database role. No cross-schema privileges or exposure.
create function cerca.apply_event(
 p_wa_id text, p_expected_revision integer, p_event_id text,
 p_state jsonb, p_outbox jsonb
) returns jsonb language plpgsql security invoker
 set search_path = pg_catalog, cerca, pg_temp as $$
declare f record; j jsonb; v_family_id uuid; current_revision integer;
begin
 if p_wa_id !~ '^[0-9]{7,16}$' or length(p_event_id)<8 or length(p_event_id)>180
    or jsonb_typeof(p_state) <> 'object' or jsonb_typeof(p_outbox) <> 'array'
    or jsonb_array_length(p_outbox)>15 then
   raise exception 'invalid_cerca_commit';
 end if;
 perform pg_advisory_xact_lock(hashtext(p_wa_id));
 select id,revision into f from cerca.families where wa_id=p_wa_id for update;
 if f.id is null then
   if p_expected_revision<>0 then raise exception 'cerca_conflict'; end if;
   insert into cerca.families(wa_id,state) values(p_wa_id,p_state)
    returning id,revision into v_family_id,current_revision;
 else
   v_family_id:=f.id;current_revision:=f.revision;
   if exists(select 1 from cerca.events where event_id=p_event_id) then
     return jsonb_build_object('status','duplicate','revision',current_revision);
   end if;
   if current_revision<>p_expected_revision then raise exception 'cerca_conflict'; end if;
   update cerca.families set state=p_state,revision=revision+1,updated_at=now()
    where id=v_family_id returning revision into current_revision;
 end if;
 if p_state->>'deleted'='true' then
   delete from cerca.outbox where family_id=v_family_id;
   delete from cerca.events where family_id=v_family_id;
 elsif p_state->>'status'='stopped' then
   update cerca.outbox set status='cancelled'
    where family_id=v_family_id and status='pending';
 end if;
 insert into cerca.events(event_id,family_id) values(p_event_id,v_family_id) on conflict do nothing;
 if not found then return jsonb_build_object('status','duplicate','revision',current_revision); end if;
 for j in select value from jsonb_array_elements(p_outbox) loop
   if length(coalesce(j->>'key',''))<8 or length(coalesce(j->>'key',''))>180
     or (j->>'channel') not in ('service','marketing') then
       raise exception 'invalid_cerca_job';
   end if;
   insert into cerca.outbox(job_key,family_id,wa_id,payload,channel,expires_at)
    values(j->>'key',v_family_id,p_wa_id,j->'payload',j->>'channel',nullif(j->>'expires_at','')::timestamptz)
    on conflict do nothing;
 end loop;
 return jsonb_build_object('status','applied','revision',current_revision);
end $$;
revoke all on function cerca.apply_event(text,integer,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function cerca.apply_event(text,integer,text,jsonb,jsonb) to cerca_worker;
comment on schema cerca is 'CERCA WhatsApp tenant; not exposed through the Data API, no access to Te Hice Esto or Complices.';