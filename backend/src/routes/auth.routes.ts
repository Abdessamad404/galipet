import { Router } from 'express'
import { validate } from '../middlewares/validate'
import { authenticate } from '../middlewares/authenticate'
import { registerSchema, loginSchema, forgotPasswordSchema } from '../schemas/auth.schemas'
import * as authController from '../controllers/auth.controller'

// Flux de chaque requête :
// Route → validate(ZodSchema) → authenticate? → Controller → Service

const router = Router()

// POST /api/auth/register — Inscription
router.post('/register', validate(registerSchema), authController.register)

// POST /api/auth/login — Connexion
router.post('/login', validate(loginSchema), authController.login)

// POST /api/auth/forgot-password — Réinitialisation mot de passe
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword)

// GET /api/profiles/me — Profil de l'utilisateur connecté
// Protégée — nécessite un token valide
router.get('/me', authenticate, authController.getMe)

export default router
