import { supabase } from '../lib/supabaseClient'

export interface CreateReviewInput {
  rating: number
  comment?: string
}

const SELECT_WITH_OWNER = `
  id,
  booking_id,
  owner_id,
  pro_id,
  rating,
  comment,
  created_at,
  owner:profiles!reviews_owner_id_fkey (
    id, first_name, last_name, avatar_url
  )
`

export const reviewService = {

  // ── Créer un avis (owner uniquement, réservation terminée) ──
  async create(bookingId: string, ownerId: string, input: CreateReviewInput) {
    // Vérifier que la réservation existe, appartient à l'owner, et est terminée
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('id, owner_id, pro_id, status')
      .eq('id', bookingId)
      .single()

    if (bErr || !booking) throw new Error('Réservation introuvable')
    if (booking.owner_id !== ownerId) throw new Error('Vous n\'êtes pas l\'owner de cette réservation')
    if (booking.status !== 'completed') throw new Error('Vous ne pouvez laisser un avis que pour une réservation terminée')

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        booking_id: bookingId,
        owner_id:   ownerId,
        pro_id:     booking.pro_id,
        rating:     input.rating,
        comment:    input.comment ?? null,
      })
      .select(SELECT_WITH_OWNER)
      .single()

    if (error) {
      if (error.code === '23505') throw new Error('Vous avez déjà laissé un avis pour cette réservation')
      throw new Error(error.message)
    }
    return data
  },

  // ── Modifier un avis (owner uniquement) ──
  async update(reviewId: string, ownerId: string, input: Partial<CreateReviewInput>) {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        ...(input.rating  !== undefined && { rating:  input.rating  }),
        ...(input.comment !== undefined && { comment: input.comment }),
      })
      .eq('id', reviewId)
      .eq('owner_id', ownerId)
      .select(SELECT_WITH_OWNER)
      .single()

    if (error) throw new Error(error.message)
    if (!data)  throw new Error('Avis introuvable ou accès refusé')
    return data
  },

  // ── Avis d'un pro (lecture publique) ──
  async getProReviews(proId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select(SELECT_WITH_OWNER)
      .eq('pro_id', proId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data ?? []
  },

  // ── Note moyenne d'un pro via la vue ──
  async getProRating(proId: string) {
    const { data, error } = await supabase
      .from('pro_ratings')
      .select('average_rating, review_count')
      .eq('pro_id', proId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data ?? { average_rating: null, review_count: 0 }
  },

  // ── Avis par booking_id (pour savoir si owner a déjà laissé un avis) ──
  async getByBooking(bookingId: string) {
    const { data } = await supabase
      .from('reviews')
      .select('id, rating, comment')
      .eq('booking_id', bookingId)
      .maybeSingle()

    return data ?? null
  },
}
