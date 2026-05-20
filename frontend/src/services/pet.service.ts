import { Platform } from 'react-native'
import { api } from '../lib/axios'
import { Pet } from '../types'

export const petService = {
  async getPets(): Promise<Pet[]> {
    const { data } = await api.get<{ pets: Pet[] }>('/pets')
    return data.pets
  },

  async getPet(id: string): Promise<Pet> {
    const { data } = await api.get<{ pet: Pet }>(`/pets/${id}`)
    return data.pet
  },

  async createPet(payload: Partial<Pet>): Promise<Pet> {
    const { data } = await api.post<{ pet: Pet }>('/pets', payload)
    return data.pet
  },

  async updatePet(id: string, payload: Partial<Pet>): Promise<Pet> {
    const { data } = await api.patch<{ pet: Pet }>(`/pets/${id}`, payload)
    return data.pet
  },

  async deletePet(id: string): Promise<void> {
    await api.delete(`/pets/${id}`)
  },

  async uploadMainPhoto(id: string, uri: string): Promise<Pet> {
    const formData = new FormData()
    if (Platform.OS === 'web') {
      const res = await fetch(uri)
      const blob = await res.blob()
      formData.append('photo', blob, 'photo.jpg')
    } else {
      formData.append('photo', { uri, type: 'image/jpeg', name: 'photo.jpg' } as any)
    }
    const { data } = await api.post<{ pet: Pet }>(`/pets/${id}/photo`, formData)
    return data.pet
  },

  async uploadGalleryPhoto(id: string, uri: string): Promise<Pet> {
    const formData = new FormData()
    if (Platform.OS === 'web') {
      const res = await fetch(uri)
      const blob = await res.blob()
      formData.append('photo', blob, 'photo.jpg')
    } else {
      formData.append('photo', { uri, type: 'image/jpeg', name: 'photo.jpg' } as any)
    }
    const { data } = await api.post<{ pet: Pet }>(`/pets/${id}/gallery`, formData)
    return data.pet
  },

  async deleteGalleryPhoto(id: string, index: number): Promise<Pet> {
    const { data } = await api.delete<{ pet: Pet }>(`/pets/${id}/gallery/${index}`)
    return data.pet
  },
}
