-- HUELLA invitation registry: private, operator-managed, never open to WhatsApp
-- senders or public Data API roles. This is NOT a payment table.
-- Apply only to the existing HUELLA Supabase project, schema cerca.
BEGIN;
CREATE TABLE IF NOT EXISTS cerca.invites (
  wa_id text PRIMARY KEY CHECK (wa_id ~ '^[1-9][0-9]{7,14}$'),
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','suspended')),
  approved_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE cerca.invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON cerca.invites FROM public,anon,authenticated,cerca_worker;
GRANT SELECT ON cerca.invites TO cerca_worker;
DROP POLICY IF EXISTS worker_select_invites ON cerca.invites;
CREATE POLICY worker_select_invites ON cerca.invites FOR SELECT TO cerca_worker USING (true);
COMMENT ON TABLE cerca.invites IS 'Private operator-approved WhatsApp numbers. The HUELLA backend can SELECT but cannot invite, revoke or modify numbers.';
COMMIT;
-- Example for an administrator in Supabase (never from inbound WhatsApp):
-- INSERT INTO cerca.invites(wa_id) VALUES ('549XXXXXXXXXX')
--   ON CONFLICT(wa_id) DO UPDATE SET status='invited',approved_at=now();
-- To suspend:
-- UPDATE cerca.invites SET status='suspended' WHERE wa_id='549XXXXXXXXXX';
