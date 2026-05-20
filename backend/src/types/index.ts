// Types partagés dans tout le backend

export type UserRole = 'owner' | 'professional' | 'both'

// Horaires de travail — chaque jour peut être fermé ou avoir une plage horaire
export interface DaySchedule {
  open: string   // ex: "09:00"
  close: string  // ex: "18:00"
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

// Payload stocké dans le JWT
export interface JwtPayload {
  sub: string       // user id (uuid)
  email: string
  role: UserRole
  iat?: number
  exp?: number
}

// Extension de Express Request pour avoir req.user disponible dans les controllers
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}
