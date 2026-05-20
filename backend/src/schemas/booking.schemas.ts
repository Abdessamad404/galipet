import { z } from 'zod'

export const createBookingSchema = z.object({
  pro_id:       z.string().uuid('ID pro invalide'),
  pet_id:       z.string().uuid('ID animal invalide').optional(),
  service_type: z.string().min(1, 'Service requis'),
  scheduled_at: z.string().datetime('Date invalide'),
  duration_min: z.number().int().positive().optional(),
  message:      z.string().max(1000).optional(),
  price:        z.number().positive().optional(),
})

export const rejectBookingSchema = z.object({
  reject_reason: z.string().max(500).optional(),
})

export const cancelBookingSchema = z.object({
  cancel_reason: z.string().max(500).optional(),
})

export type CreateBookingInput  = z.infer<typeof createBookingSchema>
export type RejectBookingInput  = z.infer<typeof rejectBookingSchema>
export type CancelBookingInput  = z.infer<typeof cancelBookingSchema>
