import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { heroMediaController } from '../controllers/heroMediaController.js'
import { uploadFields } from '../middleware/upload.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'

const router = Router()

router.get('/', optionalAuth, cacheHeaders(60, 30), heroMediaController.list)
router.get('/:id', optionalAuth, cacheHeaders(60, 30), heroMediaController.get)
router.post('/', authenticate, uploadFields([{ name: 'media', maxCount: 10 }]), heroMediaController.create)
router.patch('/:id', authenticate, uploadFields([{ name: 'media', maxCount: 10 }]), heroMediaController.update)
router.delete('/:id', authenticate, heroMediaController.delete)

export default router
