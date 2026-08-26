import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { uploadSingle } from '../middleware/upload.js'
import { validateCsrfToken } from '../middleware/csrf.js'
import { circularTabController } from '../controllers/circularTabController.js'

const router = Router()

router.get('/public', circularTabController.getHomepage)

router.use(authenticate, authorize('ADMIN'))

router.get('/', circularTabController.list)
router.patch('/:key', uploadSingle('image'), validateCsrfToken, circularTabController.update)
router.delete('/:key/image', validateCsrfToken, circularTabController.removeImage)

export default router
