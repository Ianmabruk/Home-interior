import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { socialController } from '../controllers/socialController.js'
import { uploadFields } from '../middleware/upload.js'
import { validateCsrfToken } from '../middleware/csrf.js'

const router = Router()

router.use(authenticate, authorize('ADMIN'), validateCsrfToken)

router.get('/', socialController.get)
router.post('/', uploadFields([{ name: 'image', maxCount: 1 }, { name: 'homepageCircularImage', maxCount: 1 }]), socialController.create)
router.patch('/:id', uploadFields([{ name: 'image', maxCount: 1 }, { name: 'homepageCircularImage', maxCount: 1 }]), socialController.update)
router.delete('/:id', socialController.delete)
router.patch('/reorder', socialController.reorder)

export default router
