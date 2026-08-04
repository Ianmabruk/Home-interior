import { Router } from 'express'
import { optionalAuth } from '../middleware/auth.js'
import { socialController } from '../controllers/socialController.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'

const router = Router()

router.get('/', optionalAuth, cacheHeaders(60, 30), socialController.get)

export default router
