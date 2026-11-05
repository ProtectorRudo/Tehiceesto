-- Opt-in, server-owned cutover switch for NEW gift purchases only.
-- Existing orders/gifts, payments, editors and saved experiences are untouched.
-- The default is deliberately false until both the Edge functions and
-- public Next.js copy are live and the controlled checkout test is prepared.
ALTER TABLE public.commerce_settings
  ADD COLUMN IF NOT EXISTS assisted_purchases_enabled boolean NOT NULL DEFAULT false;

-- commerce_settings already has RLS and a deny-all policy for anon/authenticated.
-- Only privileged operational code may enable this flag at the launch cutover.
COMMENT ON COLUMN public.commerce_settings.assisted_purchases_enabled IS
  'When true, ONLY newly created personalized gifts use team-managed-v1; games remain self-service. Does not mutate historical gifts.';
