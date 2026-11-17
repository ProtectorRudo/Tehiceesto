-- CERCA WhatsApp: run ONLY in a new, dedicated Supabase project. Never in shared Supabase.
-- Dedicated service-role backend; no direct user/browser Data API permissions.
create extension if not exists pgcrypto;
create table public.cerca_families (
 id uuid primary key default gen_random_uuid(),
 wa_id text not null unique check (wa_id ~ '^[0-9]{7,16}$'),
 revision integer not null default 1,
 state jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create table public.cerca_events (
 event_id text primary key,
 family_id uuid not null references public.cerca_families(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table public.cerca_outbox (
 job_key text primary key,
 family_id uuid not null references public.cerca_families(id) on delete cascade,
 wa_id text not null,
 payload jsonb not null,
 channel text not null check (channel in ('service','marketing')),
 status text not null default 'pending' check(status in ('pending','sent','cancelled')),
 attempts integer not null default 0,
 expires_at timestamptz,
 sent_at timestamptz,
 provider_message_id text,
 delivery_status text check (delivery_status in ('sent','delivered','read','failed')),
 created_at timestamptz not null default now()
);
create index cerca_outbox_pending on public.cerca_outbox(status,created_at) where status='pending';
create unique index cerca_outbox_provider_id on public.cerca_outbox(provider_message_id) where provider_message_id is not null;
create index cerca_outbox_monthly on public.cerca_outbox(sent_at) where status='sent';
create index cerca_events_created on public.cerca_events(created_at);
alter table public.cerca_families enable row level security;
alter table public.cerca_events enable row level security;
alter table public.cerca_outbox enable row level security;
revoke all on public.cerca_families,public.cerca_events,public.cerca_outbox from anon, authenticated;

-- Single atomic CAS commit for inbound/scheduling, durable outbox and webhook deduplication.
-- Only the backend service_role may execute this function. Do not expose a publishable key.
create or replace function public.cerca_commit(
 p_wa_id text, p_expected_revision integer, p_event_id text,
 p_state jsonb, p_outbox jsonb
) returns jsonb language plpgsql security definer
 set search_path = public, pg_temp as $$
declare f record; j jsonb; v_family_id uuid; current_revision integer;
begin
 if p_wa_id !~ '^[0-9]{7,16}$' or length(p_event_id)<8 or length(p_event_id)>180
    or jsonb_typeof(p_state) <> 'object' or jsonb_typeof(p_outbox) <> 'array'
    or jsonb_array_length(p_outbox)>15 then
   raise exception 'invalid_cerca_commit';
 end if;
 perform pg_advisory_xact_lock(hashtext(p_wa_id));
 select id,revision into f from public.cerca_families where wa_id=p_wa_id for update;
 if f.id is null then
   if p_expected_revision<>0 then raise exception 'cerca_conflict'; end if;
   insert into public.cerca_families(wa_id,state) values(p_wa_id,p_state)
    returning id,revision into v_family_id,current_revision;
 else
   v_family_id:=f.id;current_revision:=f.revision;
   if exists(select 1 from public.cerca_events where event_id=p_event_id) then
     return jsonb_build_object('status','duplicate','revision',current_revision);
   end if;
   if current_revision<>p_expected_revision then raise exception 'cerca_conflict'; end if;
   update public.cerca_families set state=p_state,revision=revision+1,updated_at=now()
    where id=v_family_id returning revision into current_revision;
 end if;
 if p_state->>'deleted'='true' then
   delete from public.cerca_outbox where family_id=v_family_id;
   delete from public.cerca_events where family_id=v_family_id;
 elsif p_state->>'status'='stopped' then
   update public.cerca_outbox set status='cancelled'
    where family_id=v_family_id and status='pending';
 end if;
 insert into public.cerca_events(event_id,family_id) values(p_event_id,v_family_id) on conflict do nothing;
 if not found then return jsonb_build_object('status','duplicate','revision',current_revision); end if;
 for j in select value from jsonb_array_elements(p_outbox) loop
   if length(coalesce(j->>'key',''))<8 or length(coalesce(j->>'key',''))>180
     or (j->>'channel') not in ('service','marketing') then
       raise exception 'invalid_cerca_job';
   end if;
   insert into public.cerca_outbox(job_key,family_id,wa_id,payload,channel,expires_at)
    values(j->>'key',v_family_id,p_wa_id,j->'payload',j->>'channel',nullif(j->>'expires_at','')::timestamptz)
    on conflict do nothing;
 end loop;
 return jsonb_build_object('status','applied','revision',current_revision);
end $$;
revoke all on function public.cerca_commit(text,integer,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.cerca_commit(text,integer,text,jsonb,jsonb) to service_role;
-- Optional 30-day event cleanup, 90-day sent-job cleanup should be scheduled by operator.