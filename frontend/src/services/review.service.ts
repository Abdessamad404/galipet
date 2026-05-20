import { api } from '../lib/axios'

export interface Review {
  id:         string
  booking_id: string
  owner_id:   string
  pro_id:     string
  rating:     number
  comment:    string | null
  created_at: string
  owner?: {
    id:         string
    first_name: string
    last_name:  string
    avatar_url: string | null
  }
}

export interface ProRating {
  average_rating: number | null
  review_count:   number
}

export const reviewService = {

  async create(bookingId: string, rating: number, comment?: string): Promise<Review> {
    const { data } = await api.post(`/reviews/booking/${bookingId}`, { rating, comment })
    return data.review
  },

  async update(reviewId: string, rating?: number, comment?: string): Promise<Review> {
    const { data } = await api.patch(`/reviews/${reviewId}`, { rating, comment })
    return data.review
  },

  async getProReviews(proId: string): Promise<Review[]> {
    const { data } = await api.get(`/reviews/pro/${proId}`)
    return data.reviews
  },

  async getProRating(proId: string): Promise<ProRating> {
    const { data } = await api.get(`/reviews/pro/${proId}/rating`)
    return data
  },

  async getByBooking(bookingId: string): Promise<Review | null> {
    const { data } = await api.get(`/reviews/booking/${bookingId}`)
    return data.review
  },
}
