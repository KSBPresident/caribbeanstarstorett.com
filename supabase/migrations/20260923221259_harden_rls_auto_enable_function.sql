-- This event-trigger helper is supplied by some Supabase environments. It is not
-- part of the application schema, so harden it only when it is present.
DO $migration$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC';
  END IF;
END;
$migration$;