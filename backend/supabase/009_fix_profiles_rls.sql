-- Fix: allow reading ANY profile (needed for conversation participant names/avatars)
-- The previous policy "Lecture profils pro publics" only covered role IN ('professional','both').
-- Owner profiles were invisible, causing fetchProfiles to return 1 instead of 2 results.

-- Drop the restrictive policy and replace with an open read policy.
DROP POLICY IF EXISTS "Lecture profils pro publics" ON profiles;

-- Anyone (including anonymous/service role) can read any profile row.
-- This is safe: profiles only contain public display info (first_name, last_name, company_name, avatar_url, role).
CREATE POLICY "Lecture profils publics" ON profiles
  FOR SELECT
  USING (true);
