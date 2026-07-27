import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { messageController } from '../controllers/messageController.js'

const router = Router()

router.get('/', optionalAuth, messageController.list)
router.get('/:id', optionalAuth, messageController.get)
router.post('/', messageController.publicCreate)
router.patch('/:id/reply', authenticate, messageController.reply)
router.patch('/:id/read', authenticate, messageController.markRead)
router.delete('/:id', authenticate, messageController.delete)

export default router