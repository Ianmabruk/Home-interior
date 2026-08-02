import { Router } from 'express'
import { optionalAuth } from '../middleware/auth.js'
import { socialsController } from '../controllers/socialsController.js'
import { authenticate } from '../middleware/auth.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'

const router = Router()

router.get('/', optionalAuth, cacheHeaders(60, 30), socialsController.get)
router.post('/', authenticate, socialsController.update)

export default router