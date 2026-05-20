-- ============================================================
-- Migration 006 — F04 Réservations
-- ============================================================

-- Statuts possibles d'une réservation
CREATE TYPE booking_status AS ENUM (
  'pending',    -- En attente de réponse du pro
  'accepted',   -- Acceptée par le pro
  'rejected',   -- Refusée par le pro
  'cancelled',  -- Annulée par l'owner ou le pro
  'completed'   -- Prestation effectuée
);

-- Table principale
CREATE TABLE bookings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pro_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pet_id         UUID REFERENCES pets(id) ON DELETE SET NULL,

  -- Détails de la prestation
  service_type   TEXT NOT NULL,           -- 'grooming', 'sitting', etc.
  scheduled_at   TIMESTAMPTZ NOT NULL,    -- Date & heure souhaitée
  duration_min   INT,                     -- Durée estimée en minutes
  message        TEXT,                    -- Message de l'owner au pro
  price          DECIMAL(10, 2),          -- Prix convenu (optionnel à la création)

  -- Statut & suivi
  status         booking_status NOT NULL DEFAULT 'pending',
  reject_reason  TEXT,                    -- Raison du refus (optionnel)
  cancel_reason  TEXT,                    -- Raison de l'annulation (optionnel)
  pro_note       TEXT,                    -- Note du pro après la prestation

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes pour les requêtes fréquentes
CREATE INDEX idx_bookings_owner_id ON bookings(owner_id);
CREATE INDEX idx_bookings_pro_id   ON bookings(pro_id);
CREATE INDEX idx_bookings_status   ON bookings(status);
CREATE INDEX idx_bookings_scheduled_at ON bookings(scheduled_at);

-- Trigger updated_at
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Owner voit ses propres réservations
CREATE POLICY "Owner voit ses réservations" ON bookings
  FOR SELECT USING (auth.uid() = owner_id);

-- Pro voit les réservations qui lui sont adressées
CREATE POLICY "Pro voit ses demandes" ON bookings
  FOR SELECT USING (auth.uid() = pro_id);

-- Owner peut créer une réservation
CREATE POLICY "Owner peut réserver" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owner et pro peuvent mettre à jour (pour cancel/accept/reject)
CREATE POLICY "Owner et pro peuvent modifier" ON bookings
  FOR UPDATE USING (auth.uid() = owner_id OR auth.uid() = pro_id);
