import { Router } from 'express'
import { optionalAuth } from '../middleware/auth.js'
import { contactController } from '../controllers/contactController.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'

const router = Router()

router.get('/', optionalAuth, cacheHeaders(60, 30), contactController.get)

export default router