import { api } from '../lib/axios'

export interface ProfessionalNearby {
  id: string
  first_name: string
  last_name: string
  title: string | null
  company_name: string | null
  activity_types: string[]
  avatar_url: string | null
  lat: number
  lng: number
  city: string | null
  distance_km: number
}

export const professionalService = {
  async getNearby(params: {
    lat: number
    lng: number
    radius?: number
    limit?: number
  }): Promise<ProfessionalNearby[]> {
    const { data } = await api.get<{ professionals: ProfessionalNearby[] }>(
      '/professionals/nearby',
      { params }
    )
    return data.professionals
  },
}
