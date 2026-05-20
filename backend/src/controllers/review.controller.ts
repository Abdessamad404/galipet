import { Request, Response } from 'express'
import { reviewService } from '../services/review.service'
import { z } from 'zod'

const createReviewSchema = z.object({
  rating:  z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

const updateReviewSchema = z.object({
  rating:  z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
})

// ── Créer un avis ──
export async function createReview(req: Request, res: Response) {
  const parsed = createReviewSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Données invalides', détails: parsed.error.issues })
  }
  try {
    const review = await reviewService.create(req.params.bookingId, req.user!.sub, parsed.data)
    res.status(201).json({ review })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

// ── Modifier un avis ──
export async function updateReview(req: Request, res: Response) {
  const parsed = updateReviewSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Données invalides' })
  }
  try {
    const review = await reviewService.update(req.params.id, req.user!.sub, parsed.data)
    res.json({ review })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

// ── Avis d'un pro ──
export async function getProReviews(req: Request, res: Response) {
  try {
    const reviews = await reviewService.getProReviews(req.params.proId)
    res.json({ reviews })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ── Note moyenne d'un pro ──
export async function getProRating(req: Request, res: Response) {
  try {
    const rating = await reviewService.getProRating(req.params.proId)
    res.json(rating)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ── Avis par booking ──
export async function getBookingReview(req: Request, res: Response) {
  try {
    const review = await reviewService.getByBooking(req.params.bookingId)
    res.json({ review })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
