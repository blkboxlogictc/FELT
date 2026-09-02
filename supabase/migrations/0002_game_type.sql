-- Migration: cash vs. tournament game type
-- Run this once in the Supabase SQL Editor. Additive only — existing games
-- all default to 'cash', nothing is dropped or recreated.

ALTER TABLE public.games
  ADD COLUMN game_type TEXT NOT NULL DEFAULT 'cash'
    CHECK (game_type IN ('cash', 'tournament'));

CREATE INDEX IF NOT EXISTS idx_games_type ON public.games(game_type);
