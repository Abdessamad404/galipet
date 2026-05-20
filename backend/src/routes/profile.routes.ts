import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { validate } from '../middlewares/validate'
import { upload, uploadDocument } from '../middlewares/upload'
import {
  updateProfileSchema,
  createCertificationSchema,
  updateCertificationSchema,
  createQASchema,
  updateQASchema,
} from '../schemas/profile.schemas'
import * as profileController from '../controllers/profile.controller'

// Flux des requêtes :
// Route → authenticate → upload? → validate? → Controller → Service

const router = Router()

// Toutes les routes /api/profiles nécessitent un token JWT valide
router.use(authenticate)

// ─────────────────────────────────────────────
// Profil personnel
// IMPORTANT : ces routes doivent être déclarées AVANT /:id
// pour qu'Express ne confonde pas "me" avec un UUID.
// ─────────────────────────────────────────────
router.get('/me', profileController.getMe)
router.patch('/me', validate(updateProfileSchema), profileController.updateMe)
router.post('/me/avatar', upload.single('avatar'), profileController.uploadAvatar)
router.post('/me/activity-photos', upload.single('photo'), profileController.uploadActivityPhoto)
router.delete('/me/activity-photos/:index', profileController.deleteActivityPhoto)

// ─────────────────────────────────────────────
// Certifications — AVANT /:id également
// ─────────────────────────────────────────────
router.get('/certifications', profileController.getCertifications)
router.post(
  '/certifications',
  uploadDocument.single('document'),  // optionnel — le scan du diplôme
  validate(createCertificationSchema),
  profileController.createCertification
)
router.patch('/certifications/:id', validate(updateCertificationSchema), profileController.updateCertification)
router.delete('/certifications/:id', profileController.deleteCertification)

// ─────────────────────────────────────────────
// Q&A "À propos" — AVANT /:id
// ─────────────────────────────────────────────
router.get('/about', profileController.getAboutQA)
router.post('/about', validate(createQASchema), profileController.createQA)
router.patch('/about/:id', validate(updateQASchema), profileController.updateQA)
router.delete('/about/:id', profileController.deleteQA)

// ─────────────────────────────────────────────
// Profil public — paramétré en DERNIER pour éviter les conflits
// GET /api/profiles/:id → accessible sans token (lecture publique d'un pro)
// ─────────────────────────────────────────────
router.get('/:id', profileController.getPublicProfile)

export default router
