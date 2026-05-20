// Types partagés dans tout le backend

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
