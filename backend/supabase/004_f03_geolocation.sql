-- ============================================================
-- F03 — Géolocalisation
-- Fonction Haversine RPC + index géo sur profiles
-- ============================================================

CREATE OR REPLACE FUNCTION professionals_nearby(
  p_lat    FLOAT,
  p_lng    FLOAT,
  p_radius FLOAT DEFAULT 10,  -- rayon en km
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
      -- Formule de Haversine
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
      -- Filtre boîte englobante d'abord (évite le full-scan)
      AND p.lat BETWEEN p_lat - (p_radius / 111.0)
                    AND p_lat + (p_radius / 111.0)
      AND p.lng BETWEEN p_lng - (p_radius / (111.0 * cos(radians(p_lat))))
                    AND p_lng + (p_radius / (111.0 * cos(radians(p_lat))))
  ) sub
  WHERE sub.distance_km <= p_radius
  ORDER BY sub.distance_km ASC
  LIMIT p_limit;
$$;

-- Index composite lat/lng pour accélérer le filtre de boîte englobante
CREATE INDEX IF NOT EXISTS idx_profiles_lat_lng
  ON profiles (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;
