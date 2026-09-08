-- Migration: repair/reassert every RLS policy, and force PostgREST to
-- reload its schema/permissions cache.
--
-- Given the grants gap found in 0004, this project's schema may have been
-- applied inconsistently from the start (e.g. an interrupted initial run).
-- Rather than chase one missing policy at a time, this drops and recreates
-- every policy exactly as defined in schema.sql, so the live database is
-- guaranteed to match — regardless of whatever partial state exists now.
-- Purely declarative and safe to run any number of times.

-- PROFILES
DROP POLICY IF EXISTS "profiles: read all" ON public.profiles;
DROP POLICY IF EXISTS "profiles: insert own" ON public.profiles;
DROP POLICY IF EXISTS "profiles: update own" ON public.profiles;
CREATE POLICY "profiles: read all" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles: insert own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles: update own" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- GROUPS
DROP POLICY IF EXISTS "groups: read as member" ON public.groups;
DROP POLICY IF EXISTS "groups: create" ON public.groups;
DROP POLICY IF EXISTS "groups: update as owner" ON public.groups;
CREATE POLICY "groups: read as member" ON public.groups
  FOR SELECT USING (is_group_member(id));
CREATE POLICY "groups: create" ON public.groups
  FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "groups: update as owner" ON public.groups
  FOR UPDATE USING (created_by = auth.uid());

-- GROUP_MEMBERS
DROP POLICY IF EXISTS "group_members: read as member" ON public.group_members;
DROP POLICY IF EXISTS "group_members: join self" ON public.group_members;
DROP POLICY IF EXISTS "group_members: leave self" ON public.group_members;
CREATE POLICY "group_members: read as member" ON public.group_members
  FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "group_members: join self" ON public.group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "group_members: leave self" ON public.group_members
  FOR DELETE USING (user_id = auth.uid());

-- GAMES
DROP POLICY IF EXISTS "games: read as group member" ON public.games;
DROP POLICY IF EXISTS "games: create as group member" ON public.games;
DROP POLICY IF EXISTS "games: update as group member" ON public.games;
DROP POLICY IF EXISTS "games: read as member or owner" ON public.games;
DROP POLICY IF EXISTS "games: create as member or solo" ON public.games;
DROP POLICY IF EXISTS "games: update as member or owner" ON public.games;
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

-- GAME_PARTICIPANTS
DROP POLICY IF EXISTS "game_participants: read as group member" ON public.game_participants;
DROP POLICY IF EXISTS "game_participants: join self" ON public.game_participants;
DROP POLICY IF EXISTS "game_participants: update own cashout" ON public.game_participants;
DROP POLICY IF EXISTS "game_participants: leave self" ON public.game_participants;
CREATE POLICY "game_participants: read as group member" ON public.game_participants
  FOR SELECT USING (is_game_group_member(game_id));
CREATE POLICY "game_participants: join self" ON public.game_participants
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_game_group_member(game_id));
CREATE POLICY "game_participants: update own cashout" ON public.game_participants
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "game_participants: leave self" ON public.game_participants
  FOR DELETE USING (user_id = auth.uid());

-- BUY_IN_EVENTS
DROP POLICY IF EXISTS "buy_in_events: read as group member" ON public.buy_in_events;
DROP POLICY IF EXISTS "buy_in_events: insert own" ON public.buy_in_events;
DROP POLICY IF EXISTS "buy_in_events: edit own" ON public.buy_in_events;
DROP POLICY IF EXISTS "buy_in_events: delete own" ON public.buy_in_events;
CREATE POLICY "buy_in_events: read as group member" ON public.buy_in_events
  FOR SELECT USING (is_game_group_member(game_id));
CREATE POLICY "buy_in_events: insert own" ON public.buy_in_events
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_game_participant(game_id));
CREATE POLICY "buy_in_events: edit own" ON public.buy_in_events
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "buy_in_events: delete own" ON public.buy_in_events
  FOR DELETE USING (user_id = auth.uid());

-- ENTRY_FLAGS
DROP POLICY IF EXISTS "entry_flags: read as group member" ON public.entry_flags;
DROP POLICY IF EXISTS "entry_flags: flag as fellow participant" ON public.entry_flags;
DROP POLICY IF EXISTS "entry_flags: retract own flag" ON public.entry_flags;
CREATE POLICY "entry_flags: read as group member" ON public.entry_flags
  FOR SELECT USING (is_game_group_member(game_id));
CREATE POLICY "entry_flags: flag as fellow participant" ON public.entry_flags
  FOR INSERT WITH CHECK (
    flagged_by_user_id = auth.uid()
    AND is_game_participant(game_id)
  );
CREATE POLICY "entry_flags: retract own flag" ON public.entry_flags
  FOR DELETE USING (flagged_by_user_id = auth.uid());

-- Re-grant, in case the reason 0004 didn't fully take was a naming/scope
-- mismatch rather than never having run.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Force PostgREST to drop any cached (and now stale) schema/permissions
-- info, so grant and policy changes take effect immediately rather than
-- waiting for its next automatic refresh.
NOTIFY pgrst, 'reload schema';
