import { Request, Response } from 'express'
import { bookingService } from '../services/booking.service'
import {
  createBookingSchema,
  rejectBookingSchema,
  cancelBookingSchema,
} from '../schemas/booking.schemas'

// ── Créer une réservation ──
export async function createBooking(req: Request, res: Response) {
  const parsed = createBookingSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Données invalides', détails: parsed.error.issues })
  }
  try {
    const booking = await bookingService.create(req.user!.sub, parsed.data)
    res.status(201).json({ booking })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ── Réservations de l'owner connecté ──
export async function getMyBookingsAsOwner(req: Request, res: Response) {
  try {
    const bookings = await bookingService.getOwnerBookings(req.user!.sub)
    res.json({ bookings })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ── Demandes reçues par le pro connecté ──
export async function getMyBookingsAsPro(req: Request, res: Response) {
  try {
    const bookings = await bookingService.getProBookings(req.user!.sub)
    res.json({ bookings })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ── Détail d'une réservation ──
export async function getBooking(req: Request, res: Response) {
  try {
    const booking = await bookingService.getById(req.params.id)
    // Vérifier que l'utilisateur est owner ou pro de cette réservation
    if (booking.owner_id !== req.user!.sub && booking.pro_id !== req.user!.sub) {
      return res.status(403).json({ error: 'Accès refusé' })
    }
    res.json({ booking })
  } catch (err: any) {
    res.status(404).json({ error: err.message })
  }
}

// ── Pro accepte ──
export async function acceptBooking(req: Request, res: Response) {
  try {
    const booking = await bookingService.accept(req.params.id, req.user!.sub)
    res.json({ booking })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

// ── Pro refuse ──
export async function rejectBooking(req: Request, res: Response) {
  const parsed = rejectBookingSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Données invalides' })
  }
  try {
    const booking = await bookingService.reject(req.params.id, req.user!.sub, parsed.data)
    res.json({ booking })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

// ── Annuler ──
export async function cancelBooking(req: Request, res: Response) {
  const parsed = cancelBookingSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Données invalides' })
  }
  try {
    const booking = await bookingService.cancel(req.params.id, req.user!.sub, parsed.data)
    res.json({ booking })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

// ── Pro marque terminée ──
export async function completeBooking(req: Request, res: Response) {
  try {
    const booking = await bookingService.complete(req.params.id, req.user!.sub, req.body.pro_note)
    res.json({ booking })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

// ── Pro démarre la prestation ──
export async function startBooking(req: Request, res: Response) {
  try {
    const booking = await bookingService.startProgress(req.params.id, req.user!.sub)
    res.json({ booking })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

// ── Pro marque absent ──
export async function noShowBooking(req: Request, res: Response) {
  try {
    const booking = await bookingService.noShow(req.params.id, req.user!.sub)
    res.json({ booking })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

// ── Pro crée un créneau bloqué ──
export async function createBlock(req: Request, res: Response) {
  const { scheduled_at, duration_min, note } = req.body
  if (!scheduled_at || !duration_min) {
    return res.status(400).json({ error: 'scheduled_at et duration_min sont requis' })
  }
  try {
    const booking = await bookingService.createBlock(req.user!.sub, scheduled_at, duration_min, note)
    res.status(201).json({ booking })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ── Pro supprime un créneau bloqué ──
export async function deleteBlock(req: Request, res: Response) {
  try {
    await bookingService.deleteBlock(req.params.id, req.user!.sub)
    res.json({ success: true })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}
