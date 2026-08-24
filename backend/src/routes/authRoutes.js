import { Router } from 'express'
import { authController } from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'
import { validateZod } from '../middleware/validateZod.js'
import { authSchemas, customerAuthSchemas } from '../validations/schemas.js'
import { createRateLimiter } from '../middleware/redisRateLimiter.js'

const router = Router()

const loginRateLimiter = createRateLimiter({ windowMs: 60000, limit: 10, keyPrefix: 'auth-login' })
const registerRateLimiter = createRateLimiter({ windowMs: 60000, limit: 5, keyPrefix: 'auth-register' })
const refreshRateLimiter = createRateLimiter({ windowMs: 60000, limit: 20, keyPrefix: 'auth-refresh' })

router.post('/login', loginRateLimiter, validateZod(authSchemas.login), authController.login)
router.post('/register', registerRateLimiter, validateZod(customerAuthSchemas.register), authController.register)
router.post('/refresh', refreshRateLimiter, authController.refresh)
router.post('/logout', authController.logout)
router.get('/me', authenticate, authController.me)
router.patch('/me', authenticate, validateZod(authSchemas.updateProfile), authController.updateProfile)
router.post('/csrf', authenticate, authController.getCsrfToken)

export default router
