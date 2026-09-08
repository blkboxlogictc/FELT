-- Migration: fix the actual root cause of the group-creation failure
--
-- Confirmed via the debug_whoami() diagnostic that auth.uid() correctly
-- matched the inserted created_by the whole time — the INSERT policy was
-- never the problem. The real cause: `.insert({...}).select().single()`
-- requires the new row to also be visible under the table's SELECT
-- policy to return it (Postgres's RLS semantics for INSERT ... RETURNING),
-- and createGroup creates the group BEFORE adding the creator's
-- group_members row, so "groups: read as member" (is_group_member(id))
-- doesn't yet see them as a member at that exact moment. Postgres reports
-- this with the same generic "violates row-level security policy" text,
-- making it indistinguishable from an actual INSERT check failure.
--
-- Fix: a group's creator can always see it, independent of membership —
-- correct on its own merits, and resolves the RETURNING visibility gap.

DROP POLICY IF EXISTS "groups: read as member" ON public.groups;
CREATE POLICY "groups: read as member or creator" ON public.groups
  FOR SELECT USING (is_group_member(id) OR created_by = auth.uid());

-- Clean up the temporary diagnostic from 0006, no longer needed.
DROP FUNCTION IF EXISTS public.debug_whoami();
