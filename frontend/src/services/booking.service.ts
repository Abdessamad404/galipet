import { api } from '../lib/axios'

export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'

export interface Booking {
  id:            string
  owner_id:      string
  pro_id:        string
  pet_id:        string | null
  service_type:  string
  scheduled_at:  string
  duration_min:  number | null
  message:       string | null
  price:         number | null
  status:        BookingStatus
  reject_reason: string | null
  cancel_reason: string | null
  pro_note:      string | null
  created_at:    string
  updated_at:    string
  owner?:        { first_name: string; last_name: string; avatar_url: string | null }
  pro?:          { first_name: string; last_name: string; avatar_url: string | null; company_name: string | null }
  pet?:          { name: string; species: string; main_photo_url: string | null } | null
}

export interface CreateBookingPayload {
  pro_id:       string
  pet_id?:      string
  service_type: string
  scheduled_at: string
  duration_min?: number
  message?:     string
  price?:       number
}

export const bookingService = {
  async create(payload: CreateBookingPayload): Promise<Booking> {
    const { data } = await api.post<{ booking: Booking }>('/bookings', payload)
    return data.booking
  },

  async getOwnerBookings(): Promise<Booking[]> {
    const { data } = await api.get<{ bookings: Booking[] }>('/bookings/owner')
    return data.bookings
  },

  async getProBookings(): Promise<Booking[]> {
    const { data } = await api.get<{ bookings: Booking[] }>('/bookings/pro')
    return data.bookings
  },

  async accept(id: string): Promise<Booking> {
    const { data } = await api.patch<{ booking: Booking }>(`/bookings/${id}/accept`)
    return data.booking
  },

  async reject(id: string, reason?: string): Promise<Booking> {
    const { data } = await api.patch<{ booking: Booking }>(`/bookings/${id}/reject`, { reject_reason: reason })
    return data.booking
  },

  async cancel(id: string, reason?: string): Promise<Booking> {
    const { data } = await api.patch<{ booking: Booking }>(`/bookings/${id}/cancel`, { cancel_reason: reason })
    return data.booking
  },

  async complete(id: string, proNote?: string): Promise<Booking> {
    const { data } = await api.patch<{ booking: Booking }>(`/bookings/${id}/complete`, { pro_note: proNote })
    return data.booking
  },
}
