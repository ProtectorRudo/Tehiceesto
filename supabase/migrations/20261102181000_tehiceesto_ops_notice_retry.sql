-- Extend the existing native 30-minute purchase-email recovery job without
-- scheduling an additional cron: retry already-attempted operator notices.
-- Historic approvals with no ops attempt are explicitly excluded.
-- Fail closed if the live function differs from the audited definition.
DO $ops_retry$
DECLARE
  def text;
  old_filter text := $old$
    where status = 'approved'
      and access_email_sent_at is null
      and buyer_email is not null
      and provider_reference is not null
      and payment_token is not null
$old$;
  new_filter text := $new$
    where status = 'approved'
      and provider_reference is not null
      and payment_token is not null
      and (
        (access_email_sent_at is null and buyer_email is not null)
        or (ops_notice_sent_at is null and ops_notice_last_attempt_at is not null)
      )
$new$;
  old_attempt text := $old$
      and (
        access_email_last_attempt_at is null
        or access_email_last_attempt_at < now() - interval '30 minutes'
      )
$old$;
  new_attempt text := $new$
      and (
        (
          access_email_sent_at is null and buyer_email is not null
          and (access_email_last_attempt_at is null
            or access_email_last_attempt_at < now() - interval '30 minutes')
        )
        or (
          ops_notice_sent_at is null
          and ops_notice_last_attempt_at is not null
          and ops_notice_last_attempt_at < now() - interval '30 minutes'
        )
      )
$new$;
BEGIN
  def := pg_get_functiondef('public.retry_tehiceesto_purchase_emails()'::regprocedure);
  IF position('ops_notice_last_attempt_at' in def) > 0 THEN
    RETURN; -- already installed
  END IF;
  IF position('https://efvvadfxuyieswdqnsjg.supabase.co/functions/v1/tehiceesto-checkout-native' in def)=0
     OR position(old_filter in def)=0 OR position(old_attempt in def)=0 THEN
    RAISE EXCEPTION 'Ops retry update refused: purchase retry function differs from baseline';
  END IF;
  def := replace(replace(def,old_filter,new_filter),old_attempt,new_attempt);
  EXECUTE def;
END;
$ops_retry$;
