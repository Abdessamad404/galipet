import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { authService } from '../services/auth.service'
import { LoginPayload, Profile, RegisterPayload } from '../types'

// Zustand = store global léger.
// On y stocke : le profil connecté, le statut de chargement, les erreurs.
// Tous les écrans qui ont besoin de savoir "qui est connecté" lisent ce store.

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
      const token = await SecureStore.getItemAsync('auth_token')
      if (token) {
        const profile = await authService.getMe()
        set({ token, profile, isInitialized: true })
      } else {
        set({ isInitialized: true })
      }
    } catch {
      // Token expiré ou invalide → on nettoie
      await SecureStore.deleteItemAsync('auth_token')
      set({ token: null, profile: null, isInitialized: true })
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const { token, profile } = await authService.register(payload)
      await SecureStore.setItemAsync('auth_token', token)
      set({ token, profile, isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message })
      throw error
    }
  },

  login: async (payload) => {
    set({ isLoading: true, error: null })
    try {
      const { token, profile } = await authService.login(payload)
      await SecureStore.setItemAsync('auth_token', token)
      set({ token, profile, isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message })
      throw error
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token')
    set({ token: null, profile: null, error: null })
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null })
    try {
      await authService.forgotPassword(email)
      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message })
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))
