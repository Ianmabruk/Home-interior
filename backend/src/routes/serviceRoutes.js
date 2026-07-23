import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { serviceController } from '../controllers/serviceController.js'
import { uploadSingle } from '../middleware/upload.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'

const router = Router()

router.get('/', optionalAuth, cacheHeaders(120, 60), serviceController.list)
router.get('/:id', optionalAuth, cacheHeaders(120, 60), serviceController.get)
router.post('/', uploadSingle('media', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']), serviceController.create)
router.patch('/:id', uploadSingle('media', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']), serviceController.update)
router.patch('/reorder', serviceController.reorder)
router.delete('/:id', serviceController.delete)

export default router
