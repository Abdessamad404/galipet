import { z } from 'zod'

const PET_SIZES   = ['small', 'medium', 'large'] as const
const COAT_TYPES  = ['short', 'medium', 'long', 'hairless'] as const

export const createPetSchema = z.object({
  name:      z.string().min(1, 'Nom requis').max(50),
  species:   z.string().min(1, 'Espèce requise').max(50),
  breed:     z.string().max(100).optional().nullable(),
  age:       z.number().int().min(0).max(50).optional().nullable(),
  weight:    z.number().min(0).max(500).optional().nullable(),
  size:      z.enum(PET_SIZES).optional().nullable(),
  coat_type: z.enum(COAT_TYPES).optional().nullable(),

  allergies:    z.string().max(500).optional().nullable(),
  vaccinations: z.array(z.string()).optional(),

  has_lof:  z.boolean().optional(),
  lof_info: z.string().max(200).optional().nullable(),

  personality_social_desc:       z.string().max(500).optional().nullable(),
  personality_social_tags:       z.array(z.string()).optional(),
  personality_sociability_desc:  z.string().max(500).optional().nullable(),
  personality_sociability_tags:  z.array(z.string()).optional(),
  personality_learning_desc:     z.string().max(500).optional().nullable(),
  personality_learning_tags:     z.array(z.string()).optional(),

  personal_note: z.string().max(500).optional().nullable(),
  pro_note:      z.string().max(500).optional().nullable(),
})

export const updatePetSchema = createPetSchema.partial()

export type CreatePetInput = z.infer<typeof createPetSchema>
export type UpdatePetInput = z.infer<typeof updatePetSchema>
