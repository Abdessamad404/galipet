import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import {
  listConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  getUnreadCount,
} from '../controllers/message.controller'

const router = Router()

// Toutes les routes sont authentifiées
router.use(authenticate)

router.get('/',                          listConversations)
router.get('/unread',                    getUnreadCount)
router.post('/with/:proId',             getOrCreateConversation)
router.get('/:id/messages',             getMessages)
router.post('/:id/messages',            sendMessage)

export default router
