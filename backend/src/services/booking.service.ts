import { supabase } from '../lib/supabaseClient'
import { CreateBookingInput, RejectBookingInput, CancelBookingInput } from '../schemas/booking.schemas'

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
  status:        'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'in_progress' | 'no_show' | 'rescheduled' | 'blocked' | 'awaiting_payment'
  reject_reason: string | null
  cancel_reason: string | null
  pro_note:      string | null
  created_at:    string
  updated_at:    string
  // Jointures
  owner?:        { first_name: string; last_name: string; avatar_url: string | null }
  pro?:          { first_name: string; last_name: string; avatar_url: string | null; company_name: string | null }
  pet?:          { name: string; species: string; main_photo_url: string | null } | null
}

const SELECT_WITH_RELATIONS = `
  *,
  owner:profiles!bookings_owner_id_fkey(first_name, last_name, avatar_url),
  pro:profiles!bookings_pro_id_fkey(first_name, last_name, avatar_url, company_name),
  pet:pets(name, species, main_photo_url)
`

export const bookingService = {

  // ── Créer une réservation (owner) ──
  async create(ownerId: string, input: CreateBookingInput): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert({ ...input, owner_id: ownerId, status: 'pending' })
      .select(SELECT_WITH_RELATIONS)
      .single()
    if (error || !data) throw new Error(error?.message || 'Impossible de créer la réservation')
    return data as Booking
  },

  // ── Réservations de l'owner ──
  async getOwnerBookings(ownerId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(SELECT_WITH_RELATIONS)
      .eq('owner_id', ownerId)
      .order('scheduled_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []) as Booking[]
  },

  // ── Demandes reçues par le pro ──
  async getProBookings(proId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(SELECT_WITH_RELATIONS)
      .eq('pro_id', proId)
      .order('scheduled_at', { ascending: true })
    if (error) throw new Error(error.message)
    return (data || []) as Booking[]
  },

  // ── Détail d'une réservation ──
  async getById(id: string): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .select(SELECT_WITH_RELATIONS)
      .eq('id', id)
      .single()
    if (error || !data) throw new Error('Réservation introuvable')
    return data as Booking
  },

  // ── Pro accepte ──
  async accept(id: string, proId: string): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'accepted' })
      .eq('id', id)
      .eq('pro_id', proId)
      .eq('status', 'pending')
      .select(SELECT_WITH_RELATIONS)
      .single()
    if (error || !data) throw new Error('Impossible d\'accepter cette réservation')
    return data as Booking
  },

  // ── Pro refuse ──
  async reject(id: string, proId: string, input: RejectBookingInput): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'rejected', reject_reason: input.reject_reason || null })
      .eq('id', id)
      .eq('pro_id', proId)
      .eq('status', 'pending')
      .select(SELECT_WITH_RELATIONS)
      .single()
    if (error || !data) throw new Error('Impossible de refuser cette réservation')
    return data as Booking
  },

  // ── Owner ou pro annule ──
  async cancel(id: string, userId: string, input: CancelBookingInput): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancel_reason: input.cancel_reason || null })
      .eq('id', id)
      .or(`owner_id.eq.${userId},pro_id.eq.${userId}`)
      .in('status', ['pending', 'accepted'])
      .select(SELECT_WITH_RELATIONS)
      .single()
    if (error || !data) throw new Error('Impossible d\'annuler cette réservation')
    return data as Booking
  },

  // ── Pro marque comme terminée ──
  async complete(id: string, proId: string, proNote?: string): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'completed', pro_note: proNote || null })
      .eq('id', id)
      .eq('pro_id', proId)
      .in('status', ['accepted', 'in_progress'])
      .select(SELECT_WITH_RELATIONS)
      .single()
    if (error || !data) throw new Error('Impossible de terminer cette réservation')
    return data as Booking
  },

  // ── Pro démarre la prestation ──
  async startProgress(id: string, proId: string): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'in_progress' })
      .eq('id', id)
      .eq('pro_id', proId)
      .eq('status', 'accepted')
      .select(SELECT_WITH_RELATIONS)
      .single()
    if (error || !data) throw new Error('Impossible de démarrer cette prestation')
    return data as Booking
  },

  // ── Pro marque absent ──
  async noShow(id: string, proId: string): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'no_show' })
      .eq('id', id)
      .eq('pro_id', proId)
      .in('status', ['accepted', 'in_progress'])
      .select(SELECT_WITH_RELATIONS)
      .single()
    if (error || !data) throw new Error('Impossible de marquer absent')
    return data as Booking
  },

  // ── Pro crée un créneau bloqué (usage personnel) ──
  async createBlock(proId: string, scheduledAt: string, durationMin: number, note?: string): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        owner_id:     proId,
        pro_id:       proId,
        service_type: 'blocked',
        scheduled_at: scheduledAt,
        duration_min: durationMin,
        message:      note || null,
        status:       'blocked',
      })
      .select(SELECT_WITH_RELATIONS)
      .single()
    if (error || !data) throw new Error('Impossible de créer le créneau bloqué')
    return data as Booking
  },

  // ── Supprimer un créneau bloqué ──
  async deleteBlock(id: string, proId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
      .eq('pro_id', proId)
      .eq('status', 'blocked')
    if (error) throw new Error('Impossible de supprimer ce créneau')
  },
}
