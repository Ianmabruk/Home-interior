import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { messageController } from '../controllers/messageController.js'
import { validateZod } from '../middleware/validateZod.js'
import { messageSchemas } from '../validations/schemas.js'

const router = Router()

router.get('/', optionalAuth, messageController.list)
router.get('/:id', optionalAuth, messageController.get)
router.post('/', validateZod(messageSchemas.create), messageController.publicCreate)
router.patch('/:id/reply', authenticate, validateZod(messageSchemas.reply), messageController.reply)
router.patch('/:id/read', authenticate, messageController.markRead)
router.delete('/:id', authenticate, messageController.delete)

export default router
