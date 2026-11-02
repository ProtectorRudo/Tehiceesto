-- Route failed purchase-access-email retries through TeHiceEsto's own native
-- checkout adapter. Preserve the existing pg_cron schedule, retry window,
-- idempotency guard, and email transport logic unchanged.
-- Safe to reapply; fail closed if the installed routine differs from baseline.
DO $cutover$
DECLARE
  before_ddl text;
  from_gateway constant text := 'https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/tehiceesto-checkout-v2';
  to_gateway constant text := 'https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/tehiceesto-checkout-native';
BEGIN
  before_ddl := pg_get_functiondef('public.retry_tehiceesto_purchase_emails()'::regprocedure);
  IF position(to_gateway in before_ddl) > 0 AND position(from_gateway in before_ddl) = 0 THEN
    RETURN;
  END IF;
  IF position(from_gateway in before_ddl) = 0 THEN
    RAISE EXCEPTION 'Purchase email retry gateway differs from audited baseline';
  END IF;
  EXECUTE replace(before_ddl, from_gateway, to_gateway);
END;
$cutover$;
