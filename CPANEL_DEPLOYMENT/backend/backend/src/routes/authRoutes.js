import { Router } from 'express'
import { authController } from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'
import { validateZod } from '../middleware/validateZod.js'
import { authSchemas, customerAuthSchemas } from '../validations/schemas.js'

const router = Router()

router.post('/login', validateZod(authSchemas.login), authController.login)
router.post('/register', validateZod(customerAuthSchemas.register), authController.register)
router.post('/refresh', authController.refresh)
router.post('/logout', authController.logout)
router.get('/me', authenticate, authController.me)
router.patch('/me', authenticate, validateZod(authSchemas.updateProfile), authController.updateProfile)

export default router
