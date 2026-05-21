import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { getDashboard } from '../controllers/dashboard.controller'

const router = Router()

router.use(authenticate)
router.get('/', getDashboard)  // GET /api/dashboard?period=week

export default router
