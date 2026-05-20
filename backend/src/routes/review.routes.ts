import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import {
  createReview,
  updateReview,
  getProReviews,
  getProRating,
  getBookingReview,
} from '../controllers/review.controller'

const router = Router()

// Publiques
router.get('/pro/:proId',              getProReviews)
router.get('/pro/:proId/rating',       getProRating)

// Authentifiées
router.get('/booking/:bookingId',      authenticate, getBookingReview)
router.post('/booking/:bookingId',     authenticate, createReview)
router.patch('/:id',                   authenticate, updateReview)

export default router
