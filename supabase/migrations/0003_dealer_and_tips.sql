-- Migration: dealer designation + tip tracking
-- Run this once in the Supabase SQL Editor. Additive only.

ALTER TABLE public.games
  ADD COLUMN dealer_user_id UUID REFERENCES public.profiles(id),
  ADD COLUMN dealer_request_user_id UUID REFERENCES public.profiles(id);

-- Widen buy_in_events.type to allow 'tip'. If this DROP CONSTRAINT fails
-- because the auto-generated name differs on your project, look it up first:
--   SELECT conname FROM pg_constraint WHERE conrelid = 'public.buy_in_events'::regclass AND contype = 'c';
ALTER TABLE public.buy_in_events
  DROP CONSTRAINT buy_in_events_type_check,
  ADD CONSTRAINT buy_in_events_type_check CHECK (type IN ('buyin', 'rebuy', 'cashout', 'tip'));
