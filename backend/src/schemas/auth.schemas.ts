import { z } from 'zod'

// --- Register ---
export const registerSchema = z.object({
  first_name: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  last_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  role: z.enum(['owner', 'professional', 'both'], {
    errorMap: () => ({ message: 'Le rôle doit être owner, professional ou both' }),
  }),
})

export type RegisterInput = z.infer<typeof registerSchema>

// --- Login ---
export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
})

export type LoginInput = z.infer<typeof loginSchema>

// --- Forgot password ---
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
