import { z } from 'zod'

// Schéma pour une plage horaire (un jour)
const dayScheduleSchema = z.union([
  z.literal('closed'),
  z.object({
    open:  z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
    close: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  }),
])

// Horaires de travail complets (7 jours)
const workingHoursSchema = z.object({
  lun: dayScheduleSchema.optional(),
  mar: dayScheduleSchema.optional(),
  mer: dayScheduleSchema.optional(),
  jeu: dayScheduleSchema.optional(),
  ven: dayScheduleSchema.optional(),
  sam: dayScheduleSchema.optional(),
  dim: dayScheduleSchema.optional(),
})

// Types d'activité autorisés (cohérents avec la nomenclature du site)
const ACTIVITY_TYPES = ['sante', 'toilettage', 'pet-sitting', 'education'] as const

// --- Mise à jour du profil ---
// Tous les champs sont optionnels — PATCH partiel
export const updateProfileSchema = z.object({
  // Champs communs owner + pro
  first_name:  z.string().min(2).max(50).optional(),
  last_name:   z.string().min(2).max(50).optional(),
  birth_date:  z.string().nullable().optional(),
  phone:       z.string().max(20).nullable().optional(),
  address:     z.string().max(200).nullable().optional(),
  city:        z.string().max(100).nullable().optional(),

  // Champs pro uniquement
  title:               z.string().max(100).nullable().optional(),
  company_name:        z.string().max(100).nullable().optional(),
  company_address:     z.string().max(200).nullable().optional(),
  company_email:       z.string().email('Email professionnel invalide').nullable().optional(),
  siret_ice:           z.string().max(50).nullable().optional(),
  company_description: z.string().max(500).nullable().optional(),
  activity_types:      z.array(z.enum(ACTIVITY_TYPES)).max(4).optional(),
  working_hours:       workingHoursSchema.nullable().optional(),

  // Géolocalisation (mise à jour quand le pro renseigne son adresse)
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),

  // Paiement — le pro confirme avoir configuré ses moyens de paiement
  payment_configured: z.boolean().optional(),
})

// --- Certifications ---
export const createCertificationSchema = z.object({
  title:       z.string().min(2, 'Titre requis').max(100),
  description: z.string().max(500).optional(),
  issued_date: z.string().optional(),   // format ISO "YYYY-MM-DD"
})

export const updateCertificationSchema = createCertificationSchema.partial()

// --- Q&A "À propos" ---
export const createQASchema = z.object({
  question:    z.string().min(5, 'Question trop courte').max(200),
  answer:      z.string().min(5, 'Réponse trop courte').max(1000),
  order_index: z.number().int().min(0).max(4).optional(),
})

export const updateQASchema = createQASchema.partial()

// Types inférés depuis les schémas Zod — utilisés dans les services et controllers
export type UpdateProfileInput     = z.infer<typeof updateProfileSchema>
export type CreateCertificationInput = z.infer<typeof createCertificationSchema>
export type UpdateCertificationInput = z.infer<typeof updateCertificationSchema>
export type CreateQAInput           = z.infer<typeof createQASchema>
export type UpdateQAInput           = z.infer<typeof updateQASchema>
