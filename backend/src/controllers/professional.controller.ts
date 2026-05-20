import { Request, Response } from 'express'
import { z } from 'zod'
import { professionalService } from '../services/professional.service'
import { getPublicProfile } from '../services/profile.service'

const nearbySchema = z.object({
  lat:    z.coerce.number().min(-90).max(90),
  lng:    z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(100).default(10), // km
  limit:  z.coerce.number().min(1).max(50).default(20),
})

export async function getNearbyProfessionals(req: Request, res: Response) {
  const parsed = nearbySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Paramètres invalides', détails: parsed.error.issues })
  }

  try {
    const pros = await professionalService.getNearby(parsed.data)
    res.json({ professionals: pros, count: pros.length })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function getProPublicProfile(req: Request, res: Response) {
  try {
    const profile = await getPublicProfile(req.params.id)
    // On vérifie que c'est bien un pro avant de retourner le profil
    if (!['professional', 'both'].includes(profile.role)) {
      return res.status(404).json({ error: 'Professionnel introuvable' })
    }
    res.json({ professional: profile })
  } catch (err: any) {
    res.status(404).json({ error: err.message })
  }
}
