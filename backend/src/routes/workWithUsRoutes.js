import { Router } from 'express'
import { workWithUsController } from '../controllers/workWithUsController.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validateCsrfToken } from '../middleware/csrf.js'
import { validateZod } from '../middleware/validateZod.js'
import { workWithUsSchemas } from '../validations/schemas.js'
import { uploadSingle } from '../middleware/upload.js'

const router = Router()

router.get('/', workWithUsController.list)
router.get('/:id', workWithUsController.get)
router.get('/content', workWithUsController.listContent)
router.post('/', validateZod(workWithUsSchemas.publicCreate), workWithUsController.create)

router.post('/content', authenticate, authorize('ADMIN'), validateCsrfToken, uploadSingle('image'), validateZod(workWithUsSchemas.contentCreate), workWithUsController.createContent)
router.patch('/content/:id', authenticate, authorize('ADMIN'), validateCsrfToken, uploadSingle('image'), validateZod(workWithUsSchemas.contentUpdate), workWithUsController.updateContent)
router.delete('/content/:id', authenticate, authorize('ADMIN'), validateCsrfToken, workWithUsController.deleteContent)
router.patch('/:id/status', authenticate, authorize('ADMIN'), validateCsrfToken, validateZod(workWithUsSchemas.updateStatus), workWithUsController.updateStatus)
router.delete('/:id', authenticate, authorize('ADMIN'), validateCsrfToken, workWithUsController.delete)

export default router
