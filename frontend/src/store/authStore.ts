import { create } from 'zustand'
import { storage } from '../lib/storage'
import { authService } from '../services/auth.service'
import { LoginPayload, Profile, RegisterPayload } from '../types'

// Zustand = store global léger.
// On y stocke : le profil connecté, le statut de chargement, les erreurs.
// Tous les écrans qui ont besoin de savoir "qui est connecté" lisent ce store.

// Extrait le message d'erreur lisible depuis une erreur Axios.
// Le backend renvoie { error: string, détails?: [{champ, message}] }
// Axios wrappe ça dans error.response.data — on doit aller le chercher manuellement.
function extractErrorMessage(error: unknown): string {
  const axiosError = error as any
  const data = axiosError?.response?.data
  if (data?.détails?.length) {
    // Erreurs de validation Zod — on joint tous les messages champ par champ
    return (data.détails as { champ: string; message: string }[])
      .map((d) => d.message)
      .join('\n')
  }
  if (data?.error) return data.error
  return (error as Error).message
}

interface AuthState {
  profile: Profile | null
  token: string | null
  isLoading: boolean
  isInitialized: boolean  // true une fois qu'on a vérifié le token en SecureStore au démarrage
  error: string | null

  // Actions
  register: (payload: RegisterPayload) => Promise<void>
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  initialize: () => Promise<void>    // Appelé au démarrage de l'app
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  token: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  // Vérifie au démarrage si un token existe en SecureStore.
  // Si oui → appelle /api/auth/me pour rafraîchir le profil.
  // C'est ce qui permet la session persistante après fermeture de l'app.
  initialize: async () => {
    try {
      const token = await storage.get('auth_token')
      if (token) {
        const profile = await authService.getMe()
        set({ token, profile, isInitialized: true })
      } else {
        set({ isInitialized: true })
      }
    } catch {
      // Token expiré ou invalide → on nettoie
      await storage.delete('auth_token')
      set({ token: null, profile: null, isInitialized: true })
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const { token, profile } = await authService.register(payload)
      await storage.set('auth_token', token)
      set({ token, profile, isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error) })
      throw error
    }
  },

  login: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const { token, profile } = await authService.login(payload)
      await storage.set('auth_token', token)
      set({ token, profile, isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error) })
      throw error
    }
  },

  logout: async () => {
    await storage.delete('auth_token')
    set({ token: null, profile: null, error: null })
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null })
    try {
      await authService.forgotPassword(email)
      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: extractErrorMessage(error) })
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))
