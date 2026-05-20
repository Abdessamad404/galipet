import { supabase } from '../lib/supabaseClient'

interface NearbyParams {
  lat: number
  lng: number
  radius: number // km
  limit: number
}

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
  async getNearby({ lat, lng, radius, limit }: NearbyParams): Promise<ProfessionalNearby[]> {
    const { data, error } = await supabase.rpc('professionals_nearby', {
      p_lat:    lat,
      p_lng:    lng,
      p_radius: radius,
      p_limit:  limit,
    })

    if (error) throw new Error(error.message)
    return data as ProfessionalNearby[]
  },
}
