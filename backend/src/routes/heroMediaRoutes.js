import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { heroMediaController } from '../controllers/heroMediaController.js'
import { uploadFields } from '../middleware/upload.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'
import { validateZod } from '../middleware/validateZod.js'
import { heroMediaSchemas } from '../validations/schemas.js'

const router = Router()

router.get('/', optionalAuth, cacheHeaders(5, 30), heroMediaController.list)
router.get('/:id', optionalAuth, cacheHeaders(5, 30), heroMediaController.get)
router.post('/', authenticate, uploadFields([{ name: 'media', maxCount: 10 }]), validateZod(heroMediaSchemas.create), heroMediaController.create)
router.patch('/:id', authenticate, uploadFields([{ name: 'media', maxCount: 10 }]), validateZod(heroMediaSchemas.update), heroMediaController.update)
router.delete('/:id', authenticate, heroMediaController.delete)

export default router
