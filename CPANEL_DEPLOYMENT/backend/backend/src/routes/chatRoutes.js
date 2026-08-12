import { Router } from 'express'
import { optionalAuth } from '../middleware/auth.js'
import { chatController } from '../controllers/chatController.js'

const router = Router()

router.get('/', optionalAuth, chatController.get)
router.post('/', chatController.post)

export default router