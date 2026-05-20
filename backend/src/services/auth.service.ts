import jwt from 'jsonwebtoken'
import { supabase } from '../lib/supabaseClient'
import { RegisterInput, LoginInput } from '../schemas/auth.schemas'
import { JwtPayload, Profile } from '../types'

// Le service contient TOUTE la logique métier.
// Le controller l'appelle, mais ne connaît pas Supabase directement.
// Avantage : si on change de DB demain, seul le service change.

function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET non défini')
  // Le token expire dans 7 jours — assez long pour une app mobile
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

// --- Inscription ---
export async function register(input: RegisterInput): Promise<{ token: string; profile: Profile }> {
  // 1. Créer l'utilisateur dans Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true, // On confirme directement en dev ; en prod, activer la vérification email
  })

  if (authError || !authData.user) {
    // Supabase renvoie "User already registered" si l'email existe déjà
    if (authError?.message.includes('already')) {
      throw new Error('Un compte avec cet email existe déjà')
    }
    throw new Error(authError?.message || 'Erreur lors de la création du compte')
  }

  // 2. Créer le profil dans la table `profiles`
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      role: input.role,
      is_verified: false,
    })
    .select()
    .single()

  if (profileError || !profile) {
    // Rollback : on supprime l'utilisateur Auth si le profil échoue
    await supabase.auth.admin.deleteUser(authData.user.id)
    throw new Error('Erreur lors de la création du profil')
  }

  // 3. Générer le JWT
  const token = signToken({
    sub: profile.id,
    email: profile.email,
    role: profile.role,
  })

  return { token, profile }
}

// --- Connexion ---
export async function login(input: LoginInput): Promise<{ token: string; profile: Profile }> {
  // 1. Vérifier les credentials avec Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })

  if (authError || !authData.user) {
    // Message générique volontaire : ne pas indiquer si c'est l'email ou le mdp qui est faux
    throw new Error('Email ou mot de passe incorrect')
  }

  // 2. Récupérer le profil complet
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Profil introuvable')
  }

  // 3. Générer le JWT
  const token = signToken({
    sub: profile.id,
    email: profile.email,
    role: profile.role,
  })

  return { token, profile }
}

// --- Mot de passe oublié ---
export async function forgotPassword(email: string): Promise<void> {
  // On ne vérifie pas si l'email existe — réponse toujours identique pour éviter l'énumération d'emails
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
  })

  if (error) {
    // Log interne uniquement, pas d'erreur exposée au client
    console.error('[forgotPassword]', error.message)
  }
}

// --- Profil courant ---
export async function getMe(userId: string): Promise<Profile> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    throw new Error('Profil introuvable')
  }

  return profile
}
