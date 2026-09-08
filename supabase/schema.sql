-- Felt — Supabase schema
-- Run this in the Supabase SQL Editor (Database → SQL Editor → New query).
-- See README.md for setup context.

-- =============================================
-- PROFILES (one per auth.users row, auto-created on signup)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- GROUPS
-- =============================================
CREATE TABLE public.groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(group_id, user_id)
);

-- =============================================
-- GAMES — one poker night. group_id is nullable: a NULL group_id is a
-- personal/solo game (e.g. a casino session) visible only to its creator.
-- =============================================
CREATE TABLE public.games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  game_type TEXT NOT NULL DEFAULT 'cash'
    CHECK (game_type IN ('cash', 'tournament')),
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'active', 'closed')),
  settlement_mode TEXT NOT NULL DEFAULT 'peer_to_peer'
    CHECK (settlement_mode IN ('peer_to_peer', 'central_bank')),
  dealer_user_id UUID REFERENCES public.profiles(id),
  dealer_request_user_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- GAME_PARTICIPANTS — roster + RSVP; no stored buy-in total
-- =============================================
CREATE TABLE public.game_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  cashout_amount INTEGER,  -- cents, NULL until self-cashed-out
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(game_id, user_id)
);

-- =============================================
-- BUY_IN_EVENTS — self-authored buyin/rebuy/cashout/tip log.
-- A 'tip' row owned by a game's dealer is their self-reported tip total
-- (single canonical value, edited via delete-then-insert like a cashout).
-- A 'tip' row owned by anyone else is an optional, informational "I gave
-- a tip" log — never summed into anything authoritative.
-- =============================================
CREATE TABLE public.buy_in_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL
    CHECK (type IN ('buyin', 'rebuy', 'cashout', 'tip')),
  amount INTEGER NOT NULL,  -- cents
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- ENTRY_FLAGS — peer flagging, purely informational
-- =============================================
CREATE TABLE public.entry_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES public.buy_in_events(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id) NOT NULL,
  flagged_by_user_id UUID REFERENCES public.profiles(id) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CHECK (flagged_by_user_id <> target_user_id)
);

-- =============================================
-- VIEW — computed buy-in totals (replaces a stored column + RPC)
-- security_invoker means it runs under the QUERYING user's RLS,
-- not the view owner's.
-- =============================================
CREATE VIEW public.game_participant_totals
WITH (security_invoker = true) AS
SELECT
  gp.id,
  gp.game_id,
  gp.user_id,
  gp.cashout_amount,
  gp.joined_at,
  COALESCE(SUM(be.amount) FILTER (WHERE be.type IN ('buyin', 'rebuy')), 0) AS total_buyin
FROM public.game_participants gp
LEFT JOIN public.buy_in_events be
  ON be.game_id = gp.game_id AND be.user_id = gp.user_id
GROUP BY gp.id;

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_games_group ON public.games(group_id);
CREATE INDEX idx_games_status ON public.games(status);
CREATE INDEX idx_games_type ON public.games(game_type);
CREATE INDEX idx_game_participants_game ON public.game_participants(game_id);
CREATE INDEX idx_game_participants_user ON public.game_participants(user_id);
CREATE INDEX idx_buy_in_events_game ON public.buy_in_events(game_id);
CREATE INDEX idx_buy_in_events_user ON public.buy_in_events(user_id);
CREATE INDEX idx_entry_flags_entry ON public.entry_flags(entry_id);
CREATE INDEX idx_entry_flags_game ON public.entry_flags(game_id);

-- =============================================
-- HELPER FUNCTIONS (SECURITY DEFINER, used inside RLS policies)
-- =============================================
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = auth.uid()
  );
$$;

-- True if the current user can access this game: a member of the game's
-- group, or — for a personal/solo game (group_id IS NULL) — its creator.
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

CREATE OR REPLACE FUNCTION public.is_game_participant(p_game_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_participants
    WHERE game_id = p_game_id AND user_id = auth.uid()
  );
$$;

-- Lets a non-member resolve an invite code without a broad
-- "anyone can read groups" policy.
CREATE OR REPLACE FUNCTION public.lookup_group_by_invite_code(p_code TEXT)
RETURNS TABLE(id UUID, name TEXT)
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT id, name FROM public.groups WHERE invite_code = p_code;
$$;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buy_in_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_flags ENABLE ROW LEVEL SECURITY;

-- PROFILES: display name/avatar are readable by any signed-in user
-- (simplifies roster/leaderboard/flag-attribution joins); self-only
-- insert/update. Insert exists so the app can self-heal an account whose
-- profile row predates the on-signup trigger (e.g. created before this
-- schema existed) — normal signups get their row from the trigger above.
CREATE POLICY "profiles: read all" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles: insert own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles: update own" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- GROUPS: private, group-scoped read; anyone can create one.
CREATE POLICY "groups: read as member" ON public.groups
  FOR SELECT USING (is_group_member(id));
CREATE POLICY "groups: create" ON public.groups
  FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "groups: update as owner" ON public.groups
  FOR UPDATE USING (created_by = auth.uid());

-- GROUP_MEMBERS: members see the roster; join/leave is self-only.
CREATE POLICY "group_members: read as member" ON public.group_members
  FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "group_members: join self" ON public.group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "group_members: leave self" ON public.group_members
  FOR DELETE USING (user_id = auth.uid());

-- GAMES: group-scoped read/write, plus a creator-only path for personal
-- games (group_id IS NULL — e.g. a casino session tracked solo). The "all
-- cashed out" close-game gate is enforced in the server action, not RLS.
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

-- GAME_PARTICIPANTS: group-scoped read; join/leave/cashout-edit is self-only.
CREATE POLICY "game_participants: read as group member" ON public.game_participants
  FOR SELECT USING (is_game_group_member(game_id));
CREATE POLICY "game_participants: join self" ON public.game_participants
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_game_group_member(game_id));
CREATE POLICY "game_participants: update own cashout" ON public.game_participants
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "game_participants: leave self" ON public.game_participants
  FOR DELETE USING (user_id = auth.uid());

-- BUY_IN_EVENTS: group-scoped read; insert/update/delete is self-only —
-- this is what makes "only the author can edit their own entry" real.
CREATE POLICY "buy_in_events: read as group member" ON public.buy_in_events
  FOR SELECT USING (is_game_group_member(game_id));
CREATE POLICY "buy_in_events: insert own" ON public.buy_in_events
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_game_participant(game_id));
CREATE POLICY "buy_in_events: edit own" ON public.buy_in_events
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "buy_in_events: delete own" ON public.buy_in_events
  FOR DELETE USING (user_id = auth.uid());

-- ENTRY_FLAGS: group-scoped read (visible to everyone in the game);
-- insert only by a fellow participant; retract only your own flag.
CREATE POLICY "entry_flags: read as group member" ON public.entry_flags
  FOR SELECT USING (is_game_group_member(game_id));
CREATE POLICY "entry_flags: flag as fellow participant" ON public.entry_flags
  FOR INSERT WITH CHECK (
    flagged_by_user_id = auth.uid()
    AND is_game_participant(game_id)
  );
CREATE POLICY "entry_flags: retract own flag" ON public.entry_flags
  FOR DELETE USING (flagged_by_user_id = auth.uid());

-- =============================================
-- ROLE GRANTS — required in addition to RLS. Creating tables via raw SQL
-- (as opposed to the Table Editor UI) does not automatically grant the
-- standard Supabase role privileges, so every DML statement would fail
-- with "permission denied" before RLS is ever evaluated without these.
-- RLS policies above remain the actual fine-grained access control.
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
