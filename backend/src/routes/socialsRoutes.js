import { Router } from 'express'
import { optionalAuth } from '../middleware/auth.js'
import { socialsController } from '../controllers/socialsController.js'

const router = Router()

router.get('/', optionalAuth, socialsController.get)

export default router