import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import {
  createBooking,
  getMyBookingsAsOwner,
  getMyBookingsAsPro,
  getBooking,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
  startBooking,
  noShowBooking,
  createBlock,
  deleteBlock,
} from '../controllers/booking.controller'

const router = Router()

// Toutes les routes nécessitent d'être connecté
router.use(authenticate)

router.post('/',              createBooking)          // Owner crée une réservation
router.post('/block',         createBlock)            // Pro bloque un créneau personnel
router.get('/owner',          getMyBookingsAsOwner)   // Owner voit ses réservations
router.get('/pro',            getMyBookingsAsPro)     // Pro voit ses demandes
router.get('/:id',            getBooking)             // Détail
router.patch('/:id/accept',   acceptBooking)          // Pro accepte
router.patch('/:id/reject',   rejectBooking)          // Pro refuse
router.patch('/:id/cancel',   cancelBooking)          // Owner ou pro annule
router.patch('/:id/start',    startBooking)           // Pro démarre la prestation
router.patch('/:id/complete', completeBooking)        // Pro termine
router.patch('/:id/no-show',  noShowBooking)          // Pro marque absent
router.delete('/:id/block',   deleteBlock)            // Pro supprime un créneau bloqué

export default router
