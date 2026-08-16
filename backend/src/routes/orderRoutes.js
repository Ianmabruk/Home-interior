import { Router } from 'express'
import { orderController } from '../controllers/orderController.js'
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js'
import { validateCsrfToken } from '../middleware/csrf.js'
import { validateZod } from '../middleware/validateZod.js'
import { z } from 'zod'

const router = Router()

const trackSchema = z.object({
  trackingNumber: z.string().min(1, 'Tracking number is required'),
  contact: z.string().min(1, 'Contact is required'),
})

router.post('/', optionalAuth, orderController.create)
router.post('/track', validateZod(trackSchema), orderController.trackOrder)
router.get('/me', authenticate, orderController.listMine)
router.get('/:id', orderController.get)
router.get('/', authenticate, authorize('ADMIN'), orderController.listAll)
router.patch('/:id/status', authenticate, authorize('ADMIN'), validateCsrfToken, orderController.updateStatus)

export default router
