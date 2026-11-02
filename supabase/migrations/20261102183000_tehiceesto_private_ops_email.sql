-- Configure the operator-notification destination via an encrypted Supabase
-- Vault secret named 'tehiceesto_ops_email'. NEVER hard-code the destination
-- in migrations or application source.
-- The Edge payment bridge accesses this private RPC only with its service key.
CREATE OR REPLACE FUNCTION public.tehiceesto_private_ops_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, vault
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = 'tehiceesto_ops_email'
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.tehiceesto_private_ops_email() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.tehiceesto_private_ops_email() FROM anon;
REVOKE ALL ON FUNCTION public.tehiceesto_private_ops_email() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.tehiceesto_private_ops_email() TO service_role;

COMMENT ON FUNCTION public.tehiceesto_private_ops_email()
IS 'Service-role-only internal recipient for purchase alerts. Stored encrypted in Vault; never share with clients.';
