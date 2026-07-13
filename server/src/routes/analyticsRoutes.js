import { Router } from 'express'
import { auth, authorize } from '../middleware/auth.js'
import { overview, orders, products, revenue, customers } from '../controllers/analyticsController.js'

const router = Router()

// Every analytics endpoint computes live data from the database and is
// admin-only (the dashboard never exposes it to the public).
router.get('/overview', auth, authorize('admin'), overview)
router.get('/orders', auth, authorize('admin'), orders)
router.get('/products', auth, authorize('admin'), products)
router.get('/revenue', auth, authorize('admin'), revenue)
router.get('/customers', auth, authorize('admin'), customers)

export default router
