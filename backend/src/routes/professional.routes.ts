import { Router } from 'express'
import { getNearbyProfessionals } from '../controllers/professional.controller'

const router = Router()

// Public — pas besoin d'être connecté pour chercher des pros
router.get('/nearby', getNearbyProfessionals)

export default router
