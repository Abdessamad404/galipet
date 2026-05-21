-- Migration 010 — Remove 'both' role from user_role enum
-- Simplify to owner | professional only.
--
-- IMPORTANT: Run statements one by one in Supabase SQL editor.
-- Supabase does not wrap multi-statement scripts in a single transaction.
-- The partial index and the professionals_nearby function must be dropped
-- before the column type cast, otherwise Postgres raises an operator conflict.

-- 1. Drop the professionals_nearby function (its WHERE clause references 'both')
DROP FUNCTION IF EXISTS professionals_nearby(float, float, float, int);

-- 2. Migrate any existing 'both' users to 'professional'
UPDATE profiles SET role = 'professional' WHERE role = 'both';

-- 3. Drop column default (holds a reference to the old type)
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- 4. Rename old type
ALTER TYPE user_role RENAME TO user_role_old;

-- 5. Create clean enum
CREATE TYPE user_role AS ENUM ('owner', 'professional');

-- 6. Drop partial index (its WHERE clause blocks the column type cast)
DROP INDEX IF EXISTS idx_profiles_pro;

-- 7. Cast column to new type
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::text::user_role;

-- 8. Drop old type
DROP TYPE user_role_old;

-- 9. Restore default
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'owner'::user_role;

-- 10. Recreate partial index
CREATE INDEX idx_profiles_pro ON profiles(role) WHERE role = 'professional';

-- 11. Recreate professionals_nearby with 'both' removed from WHERE clause
CREATE OR REPLACE FUNCTION professionals_nearby(
  p_lat    FLOAT,
  p_lng    FLOAT,
  p_radius FLOAT DEFAULT 10,
  p_limit  INT   DEFAULT 20
)
RETURNS TABLE (
  id             UUID,
  first_name     TEXT,
  last_name      TEXT,
  title          TEXT,
  company_name   TEXT,
  activity_types TEXT[],
  avatar_url     TEXT,
  lat            FLOAT,
  lng            FLOAT,
  city           TEXT,
  distance_km    FLOAT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT *
  FROM (
    SELECT
      p.id,
      p.first_name,
      p.last_name,
      p.title,
      p.company_name,
      p.activity_types,
      p.avatar_url,
      p.lat,
      p.lng,
      p.city,
      (6371 * acos(
        LEAST(1.0,
          cos(radians(p_lat)) * cos(radians(p.lat))
          * cos(radians(p.lng) - radians(p_lng))
          + sin(radians(p_lat)) * sin(radians(p.lat))
        )
      )) AS distance_km
    FROM profiles p
    WHERE
      p.role = 'professional'
      AND p.lat IS NOT NULL
      AND p.lng IS NOT NULL
      AND p.lat BETWEEN p_lat - (p_radius / 111.0)
                    AND p_lat + (p_radius / 111.0)
      AND p.lng BETWEEN p_lng - (p_radius / (111.0 * cos(radians(p_lat))))
                    AND p_lng + (p_radius / (111.0 * cos(radians(p_lat))))
  ) sub
  WHERE sub.distance_km <= p_radius
  ORDER BY sub.distance_km ASC
  LIMIT p_limit;
$$;
