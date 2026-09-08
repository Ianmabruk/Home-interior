import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import { heroMediaController } from '../controllers/heroMediaController.js'
import { uploadFields } from '../middleware/upload.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'
import { validateZod } from '../middleware/validateZod.js'
import { validateCsrfToken } from '../middleware/csrf.js'
import { heroMediaSchemas } from '../validations/schemas.js'

const router = Router()

// Cache hero media for a longer TTL — these are static assets referenced
// by the public site and change infrequently.
router.get('/', optionalAuth, cacheHeaders(300, 60), heroMediaController.list)
router.get('/:id', optionalAuth, cacheHeaders(300, 60), heroMediaController.get)
router.post('/', authenticate, validateCsrfToken, uploadFields([{ name: 'media', maxCount: 10 }]), validateZod(heroMediaSchemas.create), heroMediaController.create)
router.patch('/:id', authenticate, validateCsrfToken, uploadFields([{ name: 'media', maxCount: 10 }]), validateZod(heroMediaSchemas.update), heroMediaController.update)
router.delete('/:id', authenticate, validateCsrfToken, heroMediaController.delete)

export default router
