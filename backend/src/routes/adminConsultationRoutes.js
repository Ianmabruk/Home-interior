import { Router } from 'express'
import { consultationController } from '../controllers/consultationController.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validateCsrfToken } from '../middleware/csrf.js'

const router = Router()

router.use(authenticate, authorize('ADMIN'), validateCsrfToken)

router.get('/', consultationController.list)
router.patch('/:id/status', consultationController.updateStatus)
router.delete('/:id', consultationController.delete)
router.get('/export', consultationController.exportCsv)

export default router
