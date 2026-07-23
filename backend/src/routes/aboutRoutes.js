import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { aboutController } from '../controllers/aboutController.js'
import { uploadSingle } from '../middleware/upload.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'

const router = Router()

router.get('/', optionalAuth, cacheHeaders(300, 120), aboutController.get)
router.post('/', uploadSingle('media', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']), aboutController.update)
router.put('/', uploadSingle('media', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']), aboutController.update)

export default router
