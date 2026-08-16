import { Router } from 'express'
import { orderController } from '../controllers/orderController.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validateCsrfToken } from '../middleware/csrf.js'

const router = Router()

router.post('/', validateCsrfToken, orderController.create)
router.get('/me', authenticate, orderController.listMine)
router.get('/:id', orderController.get)
router.post('/track', orderController.track)  // POST for order tracking
router.get('/', authenticate, authorize('ADMIN'), orderController.listAll)
router.patch('/:id/status', authenticate, authorize('ADMIN'), validateCsrfToken, orderController.updateStatus)

export default router
