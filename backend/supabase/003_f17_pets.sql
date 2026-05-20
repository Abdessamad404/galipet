-- Migration 003 : F17 — table pets (profil enrichi des animaux)
-- À exécuter dans Supabase → SQL Editor

CREATE TYPE pet_size AS ENUM ('small', 'medium', 'large');
CREATE TYPE coat_type AS ENUM ('short', 'medium', 'long', 'hairless');

CREATE TABLE IF NOT EXISTS pets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Infos de base
  name              TEXT NOT NULL,
  species           TEXT NOT NULL,           -- "chien", "chat", "lapin"...
  breed             TEXT,
  age               INTEGER,                 -- en années
  weight            DECIMAL(5,2),            -- en kg
  size              pet_size,
  coat_type         coat_type,

  -- Photos
  main_photo_url    TEXT,
  gallery_urls      TEXT[] DEFAULT '{}',

  -- Santé & soins
  allergies         TEXT,
  vaccinations      TEXT[] DEFAULT '{}',
  health_doc_urls   TEXT[] DEFAULT '{}',

  -- Certificat LOF
  has_lof           BOOLEAN NOT NULL DEFAULT FALSE,
  lof_info          TEXT,

  -- Personnalité (3 dimensions)
  personality_social_desc       TEXT,
  personality_social_tags       TEXT[] DEFAULT '{}',
  personality_sociability_desc  TEXT,
  personality_sociability_tags  TEXT[] DEFAULT '{}',
  personality_learning_desc     TEXT,
  personality_learning_tags     TEXT[] DEFAULT '{}',

  -- Notes
  personal_note     TEXT,    -- note privée du owner
  pro_note          TEXT,    -- visible des pros lors d'une réservation

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour récupérer tous les animaux d'un owner
CREATE INDEX IF NOT EXISTS idx_pets_owner ON pets(owner_id);

-- Trigger updated_at (réutilise la fonction créée en migration 001)
CREATE TRIGGER pets_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- Un owner peut tout faire sur ses propres animaux
CREATE POLICY "Gestion animaux propres" ON pets
  FOR ALL USING (auth.uid() = owner_id);

-- Les pros peuvent lire les animaux (pour les réservations — F05)
CREATE POLICY "Lecture animaux par pros" ON pets
  FOR SELECT USING (true);
