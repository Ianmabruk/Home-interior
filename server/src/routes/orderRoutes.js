import { Router } from 'express'
import { createOrder, getMyOrders, listOrders } from '../controllers/orderController.js'
import { auth, authorize } from '../middleware/auth.js'

const router = Router()

router.post('/', auth, createOrder)
router.get('/me', auth, getMyOrders)
router.get('/', auth, authorize('admin'), listOrders)

export default router
