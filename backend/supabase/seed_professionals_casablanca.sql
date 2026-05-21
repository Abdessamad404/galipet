-- ─────────────────────────────────────────────────────────────────────────────
-- Seed — Professionnels fictifs autour de Casablanca
-- Exécuter dans Supabase → SQL Editor (service_role bypass RLS)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Créer les utilisateurs dans auth.users ─────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES
  -- 1. Vétérinaire — Centre-ville
  (
    'a1000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'karim.bennani@seed.galipet', '$2a$10$dummyhashnotusableforlogin000001',
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}'
  ),
  -- 2. Toiletteuse — Maarif
  (
    'a1000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'sara.idrissi@seed.galipet', '$2a$10$dummyhashnotusableforlogin000002',
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}'
  ),
  -- 3. Éducateur — Hay Hassani
  (
    'a1000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'youssef.lahlou@seed.galipet', '$2a$10$dummyhashnotusableforlogin000003',
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}'
  ),
  -- 4. Pet-sitter — Ain Chock
  (
    'a1000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'nadia.alami@seed.galipet', '$2a$10$dummyhashnotusableforlogin000004',
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}'
  ),
  -- 5. Multi-services — Sidi Maarouf
  (
    'a1000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'hamid.tazi@seed.galipet', '$2a$10$dummyhashnotusableforlogin000005',
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}'
  ),
  -- 6. Vétérinaire — Anfa
  (
    'a1000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'fatima.cherkaoui@seed.galipet', '$2a$10$dummyhashnotusableforlogin000006',
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}'
  ),
  -- 7. Toiletteur — Bourgogne
  (
    'a1000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'mehdi.ouhbi@seed.galipet', '$2a$10$dummyhashnotusableforlogin000007',
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}'
  ),
  -- 8. Éducatrice + pet-sitting — Belvedere
  (
    'a1000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'zineb.moussaoui@seed.galipet', '$2a$10$dummyhashnotusableforlogin000008',
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}', '{}'
  )
ON CONFLICT (id) DO NOTHING;

-- ── 2. Créer les profils professionnels ───────────────────────────────────────
INSERT INTO profiles (
  id, first_name, last_name, email, role,
  title, company_name, company_description,
  activity_types, city,
  lat, lng,
  is_verified, working_hours
) VALUES
  -- 1. Karim Bennani — vétérinaire, Centre-ville (33.5922, -7.6150)
  (
    'a1000000-0000-0000-0000-000000000001',
    'Karim', 'Bennani', 'karim.bennani@seed.galipet', 'professional',
    'Vétérinaire clinicien', 'Clinique VétéCasa', 'Spécialiste en médecine interne et chirurgie pour chiens et chats. 10 ans d''expérience.',
    ARRAY['sante'], 'Casablanca',
    33.5922, -7.6150,
    TRUE,
    '{"lun":{"open":"09:00","close":"18:00"},"mar":{"open":"09:00","close":"18:00"},"mer":{"open":"09:00","close":"18:00"},"jeu":{"open":"09:00","close":"18:00"},"ven":{"open":"09:00","close":"17:00"},"sam":{"open":"09:00","close":"13:00"},"dim":"closed"}'::jsonb
  ),
  -- 2. Sara Idrissi — toiletteuse, Maarif (33.5731, -7.6318)
  (
    'a1000000-0000-0000-0000-000000000002',
    'Sara', 'Idrissi', 'sara.idrissi@seed.galipet', 'professional',
    'Toiletteuse professionnelle', 'Happy Paws Salon', 'Toilettage haut de gamme pour toutes races. Bain, coupe, soin des ongles et oreilles.',
    ARRAY['toilettage'], 'Casablanca',
    33.5731, -7.6318,
    TRUE,
    '{"lun":{"open":"10:00","close":"19:00"},"mar":{"open":"10:00","close":"19:00"},"mer":"closed","jeu":{"open":"10:00","close":"19:00"},"ven":{"open":"10:00","close":"19:00"},"sam":{"open":"09:00","close":"17:00"},"dim":"closed"}'::jsonb
  ),
  -- 3. Youssef Lahlou — éducateur, Hay Hassani (33.5500, -7.6500)
  (
    'a1000000-0000-0000-0000-000000000003',
    'Youssef', 'Lahlou', 'youssef.lahlou@seed.galipet', 'professional',
    'Éducateur canin certifié', 'K9 Maroc', 'Méthodes douces basées sur le renforcement positif. Chiots, adultes, problèmes de comportement.',
    ARRAY['education'], 'Casablanca',
    33.5500, -7.6500,
    FALSE,
    '{"lun":{"open":"08:00","close":"17:00"},"mar":{"open":"08:00","close":"17:00"},"mer":{"open":"08:00","close":"17:00"},"jeu":{"open":"08:00","close":"17:00"},"ven":"closed","sam":{"open":"08:00","close":"12:00"},"dim":"closed"}'::jsonb
  ),
  -- 4. Nadia Alami — pet-sitter, Ain Chock (33.5400, -7.5900)
  (
    'a1000000-0000-0000-0000-000000000004',
    'Nadia', 'Alami', 'nadia.alami@seed.galipet', 'professional',
    'Pet-sitter à domicile', NULL, 'Garde chez moi ou chez vous, promenades quotidiennes. Chiens et chats acceptés. Rapport photo chaque jour.',
    ARRAY['pet-sitting'], 'Casablanca',
    33.5400, -7.5900,
    TRUE,
    '{"lun":{"open":"07:00","close":"20:00"},"mar":{"open":"07:00","close":"20:00"},"mer":{"open":"07:00","close":"20:00"},"jeu":{"open":"07:00","close":"20:00"},"ven":{"open":"07:00","close":"20:00"},"sam":{"open":"07:00","close":"20:00"},"dim":{"open":"08:00","close":"18:00"}}'::jsonb
  ),
  -- 5. Hamid Tazi — multi-services, Sidi Maarouf (33.5250, -7.6400)
  (
    'a1000000-0000-0000-0000-000000000005',
    'Hamid', 'Tazi', 'hamid.tazi@seed.galipet', 'professional',
    'Auxiliaire vétérinaire', 'PetCare Sidi Maarouf', 'Soins de base, toilettage et garde. Un seul interlocuteur pour tous les besoins de votre animal.',
    ARRAY['sante','toilettage','pet-sitting'], 'Casablanca',
    33.5250, -7.6400,
    FALSE,
    '{"lun":{"open":"09:00","close":"18:00"},"mar":{"open":"09:00","close":"18:00"},"mer":{"open":"09:00","close":"18:00"},"jeu":{"open":"09:00","close":"18:00"},"ven":{"open":"09:00","close":"18:00"},"sam":{"open":"09:00","close":"15:00"},"dim":"closed"}'::jsonb
  ),
  -- 6. Fatima Cherkaoui — vétérinaire, Anfa (33.5750, -7.6450)
  (
    'a1000000-0000-0000-0000-000000000006',
    'Fatima', 'Cherkaoui', 'fatima.cherkaoui@seed.galipet', 'professional',
    'Vétérinaire', 'Clinique Anfa Animaux', 'Consultations, vaccinations, chirurgie. Urgences acceptées sur RDV.',
    ARRAY['sante'], 'Casablanca',
    33.5750, -7.6450,
    TRUE,
    '{"lun":{"open":"08:30","close":"19:00"},"mar":{"open":"08:30","close":"19:00"},"mer":{"open":"08:30","close":"19:00"},"jeu":{"open":"08:30","close":"19:00"},"ven":{"open":"08:30","close":"17:00"},"sam":{"open":"09:00","close":"13:00"},"dim":"closed"}'::jsonb
  ),
  -- 7. Mehdi Ouhbi — toiletteur, Bourgogne (33.5850, -7.6200)
  (
    'a1000000-0000-0000-0000-000000000007',
    'Mehdi', 'Ouhbi', 'mehdi.ouhbi@seed.galipet', 'professional',
    'Toiletteur canin & félin', 'Medi''s Grooming', 'Spécialiste races à poil long. Dématage, bains thérapeutiques, coloration sûre.',
    ARRAY['toilettage'], 'Casablanca',
    33.5850, -7.6200,
    TRUE,
    '{"lun":"closed","mar":{"open":"10:00","close":"19:00"},"mer":{"open":"10:00","close":"19:00"},"jeu":{"open":"10:00","close":"19:00"},"ven":{"open":"10:00","close":"19:00"},"sam":{"open":"09:00","close":"18:00"},"dim":{"open":"10:00","close":"15:00"}}'::jsonb
  ),
  -- 8. Zineb Moussaoui — éducatrice + pet-sitting, Belvédère (33.5965, -7.6000)
  (
    'a1000000-0000-0000-0000-000000000008',
    'Zineb', 'Moussaoui', 'zineb.moussaoui@seed.galipet', 'professional',
    'Éducatrice & pet-sitter', 'Zen Pet Casa', 'Éducation comportementale et garde à domicile. Approche zen, sans stress pour votre animal.',
    ARRAY['education','pet-sitting'], 'Casablanca',
    33.5965, -7.6000,
    FALSE,
    '{"lun":{"open":"08:00","close":"18:00"},"mar":{"open":"08:00","close":"18:00"},"mer":{"open":"08:00","close":"18:00"},"jeu":{"open":"08:00","close":"18:00"},"ven":"closed","sam":{"open":"09:00","close":"16:00"},"dim":{"open":"09:00","close":"14:00"}}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;
