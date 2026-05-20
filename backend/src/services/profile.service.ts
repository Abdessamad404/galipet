import { supabase } from '../lib/supabaseClient'
import { uploadToCloudinary } from '../lib/cloudinary'
import {
  UpdateProfileInput,
  CreateCertificationInput,
  UpdateCertificationInput,
  CreateQAInput,
  UpdateQAInput,
} from '../schemas/profile.schemas'
import { Profile, Certification, ProAboutQA } from '../types'

// ─────────────────────────────────────────────
// PROFIL
// ─────────────────────────────────────────────

/** Récupère le profil complet d'un utilisateur (privé) */
export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error || !data) throw new Error('Profil introuvable')
  return data
}

/**
 * Profil public d'un pro — inclut ses certifications et Q&A.
 * C'est ce qu'un owner voit dans l'Explorer (ProProfileCard).
 */
export async function getPublicProfile(profileId: string): Promise<
  Profile & { certifications: Certification[]; about_qa: ProAboutQA[] }
> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()
  if (error || !profile) throw new Error('Profil introuvable')

  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')
    .eq('professional_id', profileId)
    .order('issued_date', { ascending: false })

  const { data: about_qa } = await supabase
    .from('pro_about_qa')
    .select('*')
    .eq('professional_id', profileId)
    .order('order_index', { ascending: true })

  return {
    ...profile,
    certifications: certifications || [],
    about_qa: about_qa || [],
  }
}

/** Mise à jour partielle du profil (PATCH) */
export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(input)
    .eq('id', userId)
    .select()
    .single()
  if (error || !data) throw new Error('Erreur lors de la mise à jour du profil')
  return data
}

/**
 * Upload avatar → Cloudinary → met à jour avatar_url en DB.
 * Le public_id inclut l'userId pour garantir l'unicité et permettre l'écrasement
 * (on veut un seul avatar par utilisateur, pas un nouveau fichier à chaque upload).
 */
export async function uploadAvatar(userId: string, buffer: Buffer): Promise<Profile> {
  const url = await uploadToCloudinary(buffer, 'avatars', `avatar_${userId}`)

  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', userId)
    .select()
    .single()
  if (error || !data) throw new Error("Erreur lors de la mise à jour de l'avatar")
  return data
}

/**
 * Ajoute une photo d'activité (max 4).
 * On stocke les URLs dans le tableau activity_photos du profil.
 */
export async function uploadActivityPhoto(userId: string, buffer: Buffer): Promise<string[]> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('activity_photos')
    .eq('id', userId)
    .single()

  const currentPhotos: string[] = profile?.activity_photos || []
  if (currentPhotos.length >= 4) throw new Error('Maximum 4 photos autorisées')

  const photoId = `activity_${userId}_${Date.now()}`
  const url = await uploadToCloudinary(buffer, 'activity-photos', photoId)
  const updatedPhotos = [...currentPhotos, url]

  await supabase
    .from('profiles')
    .update({ activity_photos: updatedPhotos })
    .eq('id', userId)

  return updatedPhotos
}

/** Supprime une photo d'activité par son index dans le tableau */
export async function deleteActivityPhoto(userId: string, photoIndex: number): Promise<string[]> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('activity_photos')
    .eq('id', userId)
    .single()

  const currentPhotos: string[] = profile?.activity_photos || []
  if (photoIndex < 0 || photoIndex >= currentPhotos.length) {
    throw new Error('Index de photo invalide')
  }

  const updatedPhotos = currentPhotos.filter((_, i) => i !== photoIndex)

  await supabase
    .from('profiles')
    .update({ activity_photos: updatedPhotos })
    .eq('id', userId)

  return updatedPhotos
}

// ─────────────────────────────────────────────
// CERTIFICATIONS
// ─────────────────────────────────────────────

export async function getCertifications(userId: string): Promise<Certification[]> {
  const { data, error } = await supabase
    .from('certifications')
    .select('*')
    .eq('professional_id', userId)
    .order('issued_date', { ascending: false })
  if (error) throw new Error('Erreur lors de la récupération des certifications')
  return data || []
}

export async function createCertification(
  userId: string,
  input: CreateCertificationInput,
  docBuffer?: Buffer
): Promise<Certification> {
  let doc_url: string | undefined

  // Si un document est joint, on l'upload vers Cloudinary
  if (docBuffer) {
    doc_url = await uploadToCloudinary(
      docBuffer,
      'certifications',
      `cert_${userId}_${Date.now()}`
    )
  }

  const { data, error } = await supabase
    .from('certifications')
    .insert({ ...input, professional_id: userId, doc_url })
    .select()
    .single()
  if (error || !data) throw new Error('Erreur lors de la création de la certification')
  return data
}

export async function updateCertification(
  userId: string,
  certId: string,
  input: UpdateCertificationInput
): Promise<Certification> {
  // Le filtre .eq('professional_id', userId) garantit qu'on ne peut modifier
  // que ses propres certifications — sécurité côté service, pas juste côté route.
  const { data, error } = await supabase
    .from('certifications')
    .update(input)
    .eq('id', certId)
    .eq('professional_id', userId)
    .select()
    .single()
  if (error || !data) throw new Error('Certification introuvable ou accès refusé')
  return data
}

export async function deleteCertification(userId: string, certId: string): Promise<void> {
  const { error } = await supabase
    .from('certifications')
    .delete()
    .eq('id', certId)
    .eq('professional_id', userId)
  if (error) throw new Error('Erreur lors de la suppression de la certification')
}

// ─────────────────────────────────────────────
// Q&A "À propos"
// ─────────────────────────────────────────────

export async function getAboutQA(userId: string): Promise<ProAboutQA[]> {
  const { data, error } = await supabase
    .from('pro_about_qa')
    .select('*')
    .eq('professional_id', userId)
    .order('order_index', { ascending: true })
  if (error) throw new Error('Erreur lors de la récupération des Q&A')
  return data || []
}

export async function createQA(userId: string, input: CreateQAInput): Promise<ProAboutQA> {
  // On vérifie la limite de 5 Q&A par pro
  const { count } = await supabase
    .from('pro_about_qa')
    .select('*', { count: 'exact', head: true })
    .eq('professional_id', userId)

  if ((count || 0) >= 5) throw new Error('Maximum 5 questions autorisées')

  const { data, error } = await supabase
    .from('pro_about_qa')
    .insert({ ...input, professional_id: userId })
    .select()
    .single()
  if (error || !data) throw new Error('Erreur lors de la création de la Q&A')
  return data
}

export async function updateQA(
  userId: string,
  qaId: string,
  input: UpdateQAInput
): Promise<ProAboutQA> {
  const { data, error } = await supabase
    .from('pro_about_qa')
    .update(input)
    .eq('id', qaId)
    .eq('professional_id', userId)
    .select()
    .single()
  if (error || !data) throw new Error('Q&A introuvable ou accès refusé')
  return data
}

export async function deleteQA(userId: string, qaId: string): Promise<void> {
  const { error } = await supabase
    .from('pro_about_qa')
    .delete()
    .eq('id', qaId)
    .eq('professional_id', userId)
  if (error) throw new Error('Erreur lors de la suppression de la Q&A')
}
