import { Router } from 'express'
import { orderController } from '../controllers/orderController.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = Router()

router.post('/', orderController.create)
router.get('/me', authenticate, orderController.listMine)
router.get('/:id', authenticate, orderController.get)
router.get('/', authenticate, authorize('ADMIN'), orderController.listAll)
router.patch('/:id/status', authenticate, authorize('ADMIN'), orderController.updateStatus)

export default router
