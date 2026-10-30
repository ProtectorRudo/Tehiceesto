-- Idempotent operational notice, separate from buyer access email.
-- These fields are server-only behind existing orders RLS policies.
alter table public.orders
  add column if not exists ops_notice_sent_at timestamptz,
  add column if not exists ops_notice_last_attempt_at timestamptz,
  add column if not exists ops_notice_error text;
