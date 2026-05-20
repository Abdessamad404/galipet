import { Platform } from 'react-native'
import { api } from '../lib/axios'
import { Profile, Certification, ProAboutQA } from '../types'

// ─────────────────────────────────────────────
// PROFIL
// ─────────────────────────────────────────────

export const profileService = {
  async getMe(): Promise<Profile> {
    const { data } = await api.get<{ profile: Profile }>('/profiles/me')
    return data.profile
  },

  async getPublicProfile(id: string): Promise<Profile & { certifications: Certification[]; about_qa: ProAboutQA[] }> {
    const { data } = await api.get(`/profiles/${id}`)
    return data.profile
  },

  async updateMe(payload: Partial<Profile>): Promise<Profile> {
    const { data } = await api.patch<{ profile: Profile }>('/profiles/me', payload)
    return data.profile
  },

  /**
   * Upload avatar — gère web (blob) et mobile (file URI) différemment.
   * Sur web : on fetch le blob depuis l'URI data: ou blob: puis on l'envoie.
   * Sur mobile : on passe directement l'URI avec le type et le nom.
   */
  async uploadAvatar(uri: string): Promise<Profile> {
    const formData = new FormData()

    if (Platform.OS === 'web') {
      const response = await fetch(uri)
      const blob = await response.blob()
      formData.append('avatar', blob, 'avatar.jpg')
    } else {
      formData.append('avatar', { uri, type: 'image/jpeg', name: 'avatar.jpg' } as any)
    }

    const { data } = await api.post<{ profile: Profile }>('/profiles/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.profile
  },

  async uploadActivityPhoto(uri: string): Promise<string[]> {
    const formData = new FormData()

    if (Platform.OS === 'web') {
      const response = await fetch(uri)
      const blob = await response.blob()
      formData.append('photo', blob, 'photo.jpg')
    } else {
      formData.append('photo', { uri, type: 'image/jpeg', name: 'photo.jpg' } as any)
    }

    const { data } = await api.post<{ photos: string[] }>('/profiles/me/activity-photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.photos
  },

  async deleteActivityPhoto(index: number): Promise<string[]> {
    const { data } = await api.delete<{ photos: string[] }>(`/profiles/me/activity-photos/${index}`)
    return data.photos
  },

  // ─────────────────────────────────────────────
  // CERTIFICATIONS
  // ─────────────────────────────────────────────

  async getCertifications(): Promise<Certification[]> {
    const { data } = await api.get<{ certifications: Certification[] }>('/profiles/certifications')
    return data.certifications
  },

  async createCertification(payload: {
    title: string
    description?: string
    issued_date?: string
  }): Promise<Certification> {
    const { data } = await api.post<{ certification: Certification }>('/profiles/certifications', payload)
    return data.certification
  },

  async updateCertification(id: string, payload: Partial<{ title: string; description: string; issued_date: string }>): Promise<Certification> {
    const { data } = await api.patch<{ certification: Certification }>(`/profiles/certifications/${id}`, payload)
    return data.certification
  },

  async deleteCertification(id: string): Promise<void> {
    await api.delete(`/profiles/certifications/${id}`)
  },

  // ─────────────────────────────────────────────
  // Q&A "À propos"
  // ─────────────────────────────────────────────

  async getAboutQA(): Promise<ProAboutQA[]> {
    const { data } = await api.get<{ qa: ProAboutQA[] }>('/profiles/about')
    return data.qa
  },

  async createQA(payload: { question: string; answer: string; order_index?: number }): Promise<ProAboutQA> {
    const { data } = await api.post<{ qa: ProAboutQA }>('/profiles/about', payload)
    return data.qa
  },

  async updateQA(id: string, payload: Partial<{ question: string; answer: string; order_index: number }>): Promise<ProAboutQA> {
    const { data } = await api.patch<{ qa: ProAboutQA }>(`/profiles/about/${id}`, payload)
    return data.qa
  },

  async deleteQA(id: string): Promise<void> {
    await api.delete(`/profiles/about/${id}`)
  },
}
