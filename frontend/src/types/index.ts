// Types partagés dans tout le frontend — miroir des types backend

export type UserRole = 'owner' | 'professional' | 'both'

export interface Profile {
  id: string
  first_name: string
  last_name: string
  birth_date: string | null
  email: string
  phone: string | null
  address: string | null
  city: string | null
  avatar_url: string | null
  role: UserRole
  is_verified: boolean
  created_at: string
}

export interface AuthResponse {
  message: string
  token: string
  profile: Profile
}

export interface RegisterPayload {
  first_name: string
  last_name: string
  email: string
  password: string
  role: 'owner' | 'professional' | 'both'
}

export interface LoginPayload {
  email: string
  password: string
}
