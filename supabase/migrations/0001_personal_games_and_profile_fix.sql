-- Migration: personal (group-less) games + profile self-heal
-- Run this once in the Supabase SQL Editor against a project that already
-- has supabase/schema.sql applied. It only adds/alters — nothing is dropped
-- or recreated destructively, so existing groups/games/history are untouched.

-- 1. Allow games with no group (a personal/solo session, e.g. a casino night)
ALTER TABLE public.games ALTER COLUMN group_id DROP NOT NULL;

-- 2. Broaden the game-access check: a personal game (group_id IS NULL) is
--    visible only to its creator. Same function name/signature, so every
--    policy on game_participants / buy_in_events / entry_flags that already
--    calls is_game_group_member(...) picks this up with no further changes.
CREATE OR REPLACE FUNCTION public.is_game_group_member(p_game_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = p_game_id
      AND (
        (g.group_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.group_members gm
          WHERE gm.group_id = g.group_id AND gm.user_id = auth.uid()
        ))
        OR (g.group_id IS NULL AND g.created_by = auth.uid())
      )
  );
$$;

-- 3. Replace the games read/create/update policies so personal games work
DROP POLICY IF EXISTS "games: read as group member" ON public.games;
DROP POLICY IF EXISTS "games: create as group member" ON public.games;
DROP POLICY IF EXISTS "games: update as group member" ON public.games;

CREATE POLICY "games: read as member or owner" ON public.games
  FOR SELECT USING (
    (group_id IS NOT NULL AND is_group_member(group_id))
    OR (group_id IS NULL AND created_by = auth.uid())
  );
CREATE POLICY "games: create as member or solo" ON public.games
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND (group_id IS NULL OR is_group_member(group_id))
  );
CREATE POLICY "games: update as member or owner" ON public.games
  FOR UPDATE USING (
    (group_id IS NOT NULL AND is_group_member(group_id))
    OR (group_id IS NULL AND created_by = auth.uid())
  );

-- 4. Let a signed-in user create their own profiles row if one is missing —
--    needed for any account created before the on-signup trigger existed,
--    so the app can self-heal a blank display name instead of showing "there".
CREATE POLICY "profiles: insert own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());
