-- Migration: grant table privileges to the authenticated role
--
-- Every table so far was created via raw SQL in the SQL Editor, which does
-- NOT automatically grant the standard Supabase role privileges the way
-- creating a table through the Table Editor UI does. RLS policies were
-- correctly enforcing row-level access this whole time, but the coarser
-- Postgres GRANT layer underneath was never actually opened up for the
-- `authenticated` role on some tables — e.g. `profiles` was rejecting every
-- INSERT with "permission denied for table profiles" (Postgres error 42501)
-- before RLS was ever evaluated.
--
-- Run this once in the Supabase SQL Editor. Purely additive/permissive —
-- RLS policies remain the actual fine-grained access control.

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Covers any table created after this point via the same SQL Editor session/role.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
