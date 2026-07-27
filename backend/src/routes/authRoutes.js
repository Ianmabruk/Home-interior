import { Router } from 'express'
import { authController } from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/login', authController.login)
router.post('/register', authController.register)
router.post('/refresh', authController.refresh)
router.post('/logout', authController.logout)
router.get('/me', authenticate, authController.me)
router.patch('/me', authenticate, authController.updateProfile)
router.post('/forgot-password', authController.forgotPassword)
router.post('/verify-reset-token', authController.verifyResetToken)
router.post('/reset-password', authController.resetPassword)

export default router
