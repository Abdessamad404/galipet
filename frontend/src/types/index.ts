// Types partagés dans tout le frontend — miroir des types backend

export type UserRole = 'owner' | 'professional' | 'both'

export interface DaySchedule {
  open: string    // "09:00"
  close: string   // "18:00"
}

export type WorkingHours = {
  lun?: DaySchedule | 'closed'
  mar?: DaySchedule | 'closed'
  mer?: DaySchedule | 'closed'
  jeu?: DaySchedule | 'closed'
  ven?: DaySchedule | 'closed'
  sam?: DaySchedule | 'closed'
  dim?: DaySchedule | 'closed'
}

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
  updated_at: string
  // Champs pro (F02)
  title: string | null
  company_name: string | null
  company_address: string | null
  company_email: string | null
  siret_ice: string | null
  company_description: string | null
  activity_types: string[]
  activity_photos: string[]
  working_hours: WorkingHours | null
  payment_configured: boolean
  lat: number | null
  lng: number | null
}

export interface Certification {
  id: string
  professional_id: string
  title: string
  description: string | null
  doc_url: string | null
  issued_date: string | null
  created_at: string
}

export interface ProAboutQA {
  id: string
  professional_id: string
  question: string
  answer: string
  order_index: number
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
