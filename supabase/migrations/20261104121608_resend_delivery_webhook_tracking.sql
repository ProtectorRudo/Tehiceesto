-- Delivery telemetry only. No recipients, message content, subjects or gift links.
-- Resend webhooks must pass timestamped Svix signature validation before inserts.
create table if not exists public.thi_resend_delivery_events (
  event_id text primary key check (length(event_id) between 8 and 160),
  email_id text not null check (length(email_id) between 8 and 160),
  event_type text not null check (
    event_type in (
      'email.sent','email.delivered','email.delivery_delayed',
      'email.bounced','email.failed','email.suppressed','email.complained'
    )
  ),
  event_at timestamptz not null,
  received_at timestamptz not null default now()
);

create index if not exists thi_resend_delivery_events_received_idx
  on public.thi_resend_delivery_events (received_at desc);

alter table public.thi_resend_delivery_events enable row level security;
revoke all on public.thi_resend_delivery_events from public, anon, authenticated;
grant select, insert on public.thi_resend_delivery_events to service_role;

-- The key is stored separately in Supabase Vault after Resend creates it.
-- Only the service-role backend can retrieve it. Never publish it to clients.
create or replace function public.tehiceesto_private_resend_webhook_secret()
returns text language sql security definer
set search_path to 'pg_catalog','vault'
as $fn$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'thi_resend_delivery_webhook_signing_secret'
  limit 1;
$fn$;

revoke all on function public.tehiceesto_private_resend_webhook_secret()
  from public, anon, authenticated;
grant execute on function public.tehiceesto_private_resend_webhook_secret()
  to service_role;
