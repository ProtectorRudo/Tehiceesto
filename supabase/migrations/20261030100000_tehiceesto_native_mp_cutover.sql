-- Atomic, reversible switch of the existing 5-minute reconciliation task.
-- Assumes TeHiceEsto native checkout has passed provider and webhook verification.
-- Do NOT schedule a second cron job; this updates the function called by existing job.
DO $cutover$
DECLARE
  before_ddl text;
  from_gateway constant text := 'https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/tehiceesto-checkout-v2';
  to_gateway constant text := 'https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/tehiceesto-checkout-native';
BEGIN
  before_ddl := pg_get_functiondef('public.reconcile_tehiceesto_payments()'::regprocedure);
  IF position(to_gateway in before_ddl)>0 AND position(from_gateway in before_ddl)=0 THEN
    RETURN; -- safe repeat
  END IF;
  IF position(from_gateway in before_ddl)=0 THEN
    RAISE EXCEPTION 'Payment reconciliation gateway differs from audited baseline';
  END IF;
  EXECUTE replace(before_ddl,from_gateway,to_gateway);
END;
$cutover$;