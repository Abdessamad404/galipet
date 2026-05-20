-- Migration 001 : création de la table profiles
-- À exécuter dans Supabase → SQL Editor

-- Type enum pour les rôles
CREATE TYPE user_role AS ENUM ('owner', 'professional', 'both');

-- Table profiles — liée à auth.users de Supabase
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  birth_date  DATE,
  email       TEXT NOT NULL UNIQUE,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  avatar_url  TEXT,
  role        user_role NOT NULL DEFAULT 'owner',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index sur l'email pour les lookups de connexion
CREATE INDEX idx_profiles_email ON profiles(email);

-- Index sur le rôle pour filtrer owners vs pros
CREATE INDEX idx_profiles_role ON profiles(role);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS)
-- Le backend utilise la service_role_key donc bypass RLS,
-- mais on l'active pour bloquer tout accès direct non autorisé.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Un utilisateur peut lire et modifier uniquement son propre profil
CREATE POLICY "Lecture profil propre" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Modification profil propre" ON profiles
  FOR UPDATE USING (auth.uid() = id);
