import { Router } from 'express'
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js'
import { messageController } from '../controllers/messageController.js'
import { validateZod } from '../middleware/validateZod.js'
import { validateCsrfToken } from '../middleware/csrf.js'
import { messageSchemas } from '../validations/schemas.js'

const router = Router()

router.get('/', authenticate, authorize('ADMIN'), messageController.list)
router.get('/:id', authenticate, authorize('ADMIN'), messageController.get)
router.post('/', validateZod(messageSchemas.create), messageController.publicCreate)
router.patch('/:id/reply', authenticate, authorize('ADMIN'), validateCsrfToken, validateZod(messageSchemas.reply), messageController.reply)
router.patch('/:id/read', authenticate, authorize('ADMIN'), validateCsrfToken, messageController.markRead)
router.delete('/:id', authenticate, authorize('ADMIN'), validateCsrfToken, messageController.delete)

export default router
