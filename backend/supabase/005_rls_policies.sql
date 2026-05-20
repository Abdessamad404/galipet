-- ============================================================
-- Migration 005 — Politiques RLS complètes
-- ============================================================

-- Profiles : lecture des profils pro publics (pour l'Explorer)
CREATE POLICY "Lecture profils pro publics" ON profiles
  FOR SELECT USING (role IN ('professional', 'both'));

-- Pets : lecture de ses propres animaux uniquement
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture ses propres animaux" ON pets
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Modification ses propres animaux" ON pets
  FOR ALL USING (auth.uid() = owner_id);

-- Certifications : lecture publique des certifs pro
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture certifications pro" ON certifications
  FOR SELECT USING (true);

CREATE POLICY "Gestion ses propres certifications" ON certifications
  FOR ALL USING (auth.uid() = professional_id);

-- Q&A : lecture publique
ALTER TABLE pro_about_qa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture QA pro" ON pro_about_qa
  FOR SELECT USING (true);

CREATE POLICY "Gestion ses propres QA" ON pro_about_qa
  FOR ALL USING (auth.uid() = professional_id);
