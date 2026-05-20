import { api } from '../lib/axios'
import { AuthResponse, LoginPayload, Profile, RegisterPayload } from '../types'

// Le service ne contient que des appels HTTP.
// Il ne sait rien de l'UI, ni de Zustand, ni de la navigation.
// Il retourne des données typées ou lance une Error.

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload)
    return data
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload)
    return data
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email })
    return data
  },

  async getMe(): Promise<Profile> {
    const { data } = await api.get<{ profile: Profile }>('/auth/me')
    return data.profile
  },
}
