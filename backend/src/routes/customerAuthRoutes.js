import { Router } from 'express'
import { customerAuthController } from '../controllers/customerAuthController.js'
import { validateZod } from '../middleware/validateZod.js'
import { customerAuthSchemas } from '../validations/schemas.js'

const router = Router()

router.post('/register', validateZod(customerAuthSchemas.register), customerAuthController.register)
router.post('/login', validateZod(customerAuthSchemas.login), customerAuthController.login)
router.post('/refresh', validateZod(customerAuthSchemas.refresh), customerAuthController.refresh)
router.post('/logout', validateZod(customerAuthSchemas.logout), customerAuthController.logout)
router.get('/me', customerAuthController.me)

export default router
