-- Temporary diagnostic function — safe no-op until called, and safe to
-- drop once we've root-caused the group-creation RLS failure.
-- Returns exactly what Postgres sees for the calling request: if `uid` is
-- NULL or doesn't match the app's logged-in user id, the problem is the
-- auth session not reaching PostgREST correctly, not the schema.
CREATE OR REPLACE FUNCTION public.debug_whoami()
RETURNS TABLE(uid uuid, role text)
LANGUAGE SQL AS $$
  SELECT auth.uid(), auth.role();
$$;

GRANT EXECUTE ON FUNCTION public.debug_whoami() TO authenticated;
