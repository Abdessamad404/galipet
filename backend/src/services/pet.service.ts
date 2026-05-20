import { supabase } from '../lib/supabaseClient'
import { uploadToCloudinary } from '../lib/cloudinary'
import { CreatePetInput, UpdatePetInput } from '../schemas/pet.schemas'

export interface Pet {
  id: string
  owner_id: string
  name: string
  species: string
  breed: string | null
  age: number | null
  weight: number | null
  size: 'small' | 'medium' | 'large' | null
  coat_type: 'short' | 'medium' | 'long' | 'hairless' | null
  main_photo_url: string | null
  gallery_urls: string[]
  allergies: string | null
  vaccinations: string[]
  health_doc_urls: string[]
  has_lof: boolean
  lof_info: string | null
  personality_social_desc: string | null
  personality_social_tags: string[]
  personality_sociability_desc: string | null
  personality_sociability_tags: string[]
  personality_learning_desc: string | null
  personality_learning_tags: string[]
  personal_note: string | null
  pro_note: string | null
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────

export async function getPets(ownerId: string): Promise<Pet[]> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
  if (error) throw new Error('Erreur lors de la récupération des animaux')
  return data || []
}

export async function getPet(petId: string, ownerId: string): Promise<Pet> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('id', petId)
    .eq('owner_id', ownerId)
    .single()
  if (error || !data) throw new Error('Animal introuvable')
  return data
}

export async function createPet(ownerId: string, input: CreatePetInput): Promise<Pet> {
  const { data, error } = await supabase
    .from('pets')
    .insert({ ...input, owner_id: ownerId })
    .select()
    .single()
  if (error || !data) throw new Error("Erreur lors de la création de l'animal")
  return data
}

export async function updatePet(petId: string, ownerId: string, input: UpdatePetInput): Promise<Pet> {
  const { data, error } = await supabase
    .from('pets')
    .update(input)
    .eq('id', petId)
    .eq('owner_id', ownerId)
    .select()
    .single()
  if (error || !data) throw new Error("Animal introuvable ou accès refusé")
  return data
}

export async function deletePet(petId: string, ownerId: string): Promise<void> {
  const { error } = await supabase
    .from('pets')
    .delete()
    .eq('id', petId)
    .eq('owner_id', ownerId)
  if (error) throw new Error("Erreur lors de la suppression de l'animal")
}

// ─────────────────────────────────────────────
// PHOTOS
// ─────────────────────────────────────────────

export async function uploadMainPhoto(petId: string, ownerId: string, buffer: Buffer): Promise<Pet> {
  const url = await uploadToCloudinary(buffer, 'pets', `pet_main_${petId}`)
  const { data, error } = await supabase
    .from('pets')
    .update({ main_photo_url: url })
    .eq('id', petId)
    .eq('owner_id', ownerId)
    .select()
    .single()
  if (error || !data) throw new Error('Erreur lors de la mise à jour de la photo')
  return data
}

export async function uploadGalleryPhoto(petId: string, ownerId: string, buffer: Buffer): Promise<Pet> {
  const { data: pet } = await supabase
    .from('pets')
    .select('gallery_urls')
    .eq('id', petId)
    .eq('owner_id', ownerId)
    .single()

  const currentGallery: string[] = pet?.gallery_urls || []
  if (currentGallery.length >= 6) throw new Error('Maximum 6 photos dans la galerie')

  const photoId = `pet_gallery_${petId}_${Date.now()}`
  const url = await uploadToCloudinary(buffer, 'pets', photoId)
  const updatedGallery = [...currentGallery, url]

  const { data, error } = await supabase
    .from('pets')
    .update({ gallery_urls: updatedGallery })
    .eq('id', petId)
    .eq('owner_id', ownerId)
    .select()
    .single()
  if (error || !data) throw new Error('Erreur lors de la mise à jour de la galerie')
  return data
}

export async function deleteGalleryPhoto(petId: string, ownerId: string, photoIndex: number): Promise<Pet> {
  const { data: pet } = await supabase
    .from('pets')
    .select('gallery_urls')
    .eq('id', petId)
    .eq('owner_id', ownerId)
    .single()

  const currentGallery: string[] = pet?.gallery_urls || []
  if (photoIndex < 0 || photoIndex >= currentGallery.length) throw new Error('Index invalide')

  const updatedGallery = currentGallery.filter((_, i) => i !== photoIndex)

  const { data, error } = await supabase
    .from('pets')
    .update({ gallery_urls: updatedGallery })
    .eq('id', petId)
    .eq('owner_id', ownerId)
    .select()
    .single()
  if (error || !data) throw new Error('Erreur lors de la suppression de la photo')
  return data
}

export async function uploadHealthDoc(petId: string, ownerId: string, buffer: Buffer): Promise<Pet> {
  const { data: pet } = await supabase
    .from('pets')
    .select('health_doc_urls')
    .eq('id', petId)
    .eq('owner_id', ownerId)
    .single()

  const currentDocs: string[] = pet?.health_doc_urls || []
  const docId = `pet_health_${petId}_${Date.now()}`
  const url = await uploadToCloudinary(buffer, 'pet-health-docs', docId)
  const updatedDocs = [...currentDocs, url]

  const { data, error } = await supabase
    .from('pets')
    .update({ health_doc_urls: updatedDocs })
    .eq('id', petId)
    .eq('owner_id', ownerId)
    .select()
    .single()
  if (error || !data) throw new Error('Erreur lors de la mise à jour des documents')
  return data
}
