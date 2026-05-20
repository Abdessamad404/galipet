-- ============================================================
-- Migration 007 — F08 Avis & Notes
-- ============================================================

CREATE TABLE reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  owner_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pro_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un seul avis par réservation
  CONSTRAINT reviews_booking_unique UNIQUE (booking_id)
);

CREATE INDEX idx_reviews_pro_id   ON reviews(pro_id);
CREATE INDEX idx_reviews_owner_id ON reviews(owner_id);

-- Vue matérialisée pour la note moyenne par pro
-- Utilisée dans la fiche pro et l'Explorer
CREATE OR REPLACE VIEW pro_ratings AS
  SELECT
    pro_id,
    ROUND(AVG(rating)::numeric, 1) AS average_rating,
    COUNT(*) AS review_count
  FROM reviews
  GROUP BY pro_id;

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Lecture publique des avis
CREATE POLICY "Lecture avis publique" ON reviews
  FOR SELECT USING (true);

-- Owner peut créer un avis
CREATE POLICY "Owner peut laisser un avis" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owner peut modifier son propre avis
CREATE POLICY "Owner peut modifier son avis" ON reviews
  FOR UPDATE USING (auth.uid() = owner_id);
