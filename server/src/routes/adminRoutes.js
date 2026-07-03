import { Router } from 'express'
import { auth, authorize } from '../middleware/auth.js'
import { dashboardOverview, sendAdminTestEmail, listUsers, listAllOrders, updateOrderStatus, listNewsletter } from '../controllers/adminController.js'
import { listMessages } from '../controllers/messageController.js'

const router = Router()

router.get('/overview', auth, authorize('admin'), dashboardOverview)
router.get('/messages', auth, authorize('admin'), listMessages)
router.post('/test-email', auth, authorize('admin'), sendAdminTestEmail)
router.post('/send-email', auth, authorize('admin'), sendAdminTestEmail)
router.get('/users', auth, authorize('admin'), listUsers)
router.get('/newsletter', auth, authorize('admin'), listNewsletter)
router.get('/orders', auth, authorize('admin'), listAllOrders)
router.patch('/orders/:id/status', auth, authorize('admin'), updateOrderStatus)

export default router
