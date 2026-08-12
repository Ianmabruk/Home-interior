import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { socialController } from '../controllers/socialController.js'
import { uploadSingle } from '../middleware/upload.js'
import { validateCsrfToken } from '../middleware/csrf.js'

const router = Router()

router.use(authenticate, authorize('ADMIN'), validateCsrfToken)

router.get('/', socialController.get)
router.post('/', uploadSingle('image'), socialController.create)
router.patch('/:id', uploadSingle('image'), socialController.update)
router.delete('/:id', socialController.delete)
router.patch('/reorder', socialController.reorder)

export default router
