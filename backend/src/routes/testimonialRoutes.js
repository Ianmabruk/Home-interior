import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { testimonialController } from '../controllers/testimonialController.js'
import { uploadSingle } from '../middleware/upload.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'

const router = Router()

router.get('/', optionalAuth, cacheHeaders(120, 60), testimonialController.list)
router.get('/:id', optionalAuth, cacheHeaders(120, 60), testimonialController.get)
router.post('/', uploadSingle('photo', ['image/jpeg', 'image/png', 'image/webp']), testimonialController.create)
router.patch('/:id', uploadSingle('photo', ['image/jpeg', 'image/png', 'image/webp']), testimonialController.update)
router.delete('/:id', testimonialController.delete)

export default router
