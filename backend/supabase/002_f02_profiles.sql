-- Migration 002 : F02 — extension profiles + certifications + pro_about_qa
-- À exécuter dans Supabase → SQL Editor

-- Extension de la table profiles avec les champs pro et géolocalisation
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS title               TEXT,
  ADD COLUMN IF NOT EXISTS company_name        TEXT,
  ADD COLUMN IF NOT EXISTS company_address     TEXT,
  ADD COLUMN IF NOT EXISTS company_email       TEXT,
  ADD COLUMN IF NOT EXISTS siret_ice           TEXT,
  ADD COLUMN IF NOT EXISTS company_description TEXT,
  ADD COLUMN IF NOT EXISTS activity_types      TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS activity_photos     TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS working_hours       JSONB,
  ADD COLUMN IF NOT EXISTS payment_configured  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lat                 DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng                 DOUBLE PRECISION;

-- Index géographique pour la recherche par proximité (F03)
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Index rôle pro pour filtrer les pros dans l'explorer
CREATE INDEX IF NOT EXISTS idx_profiles_pro ON profiles(role)
  WHERE role IN ('professional', 'both');

-- -----------------------------------------------------------------------
-- Certifications / Diplômes des professionnels
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  doc_url          TEXT,         -- URL Cloudinary du document scanné
  issued_date      DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certifications_professional ON certifications(professional_id);

-- -----------------------------------------------------------------------
-- Q&A "À propos" des professionnels (max 5 entrées par pro)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pro_about_qa (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question         TEXT NOT NULL,
  answer           TEXT NOT NULL,
  order_index      INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pro_about_qa_professional ON pro_about_qa(professional_id);

-- -----------------------------------------------------------------------
-- RLS — Le backend bypasse via service_role_key,
-- mais on l'active pour bloquer tout accès direct non autorisé.
-- -----------------------------------------------------------------------
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_about_qa   ENABLE ROW LEVEL SECURITY;

-- Certifications : lecture publique, modification par le propriétaire uniquement
CREATE POLICY "Lecture certifications publique" ON certifications
  FOR SELECT USING (true);

CREATE POLICY "Gestion certifications propres" ON certifications
  FOR ALL USING (auth.uid() = professional_id);

-- Q&A : lecture publique, modification par le propriétaire uniquement
CREATE POLICY "Lecture Q&A publique" ON pro_about_qa
  FOR SELECT USING (true);

CREATE POLICY "Gestion Q&A propres" ON pro_about_qa
  FOR ALL USING (auth.uid() = professional_id);
