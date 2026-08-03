import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { uploadFields } from '../middleware/upload.js'
import { blogController } from '../controllers/blogController.js'
import { validateZod } from '../middleware/validateZod.js'
import { blogSchemas } from '../validations/schemas.js'

const router = Router()

router.get('/', authenticate, blogController.getAll)
router.get('/stats', authenticate, blogController.stats)
router.get('/slug/:slug', blogController.getBySlug)
router.get('/:id', authenticate, blogController.get)
router.get('/:id/related', blogController.related)
router.post(
  '/',
  authenticate,
  uploadFields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'contentImages', maxCount: 10 },
  ]),
  validateZod(blogSchemas.create),
  blogController.create,
)
router.patch(
  '/:id',
  authenticate,
  uploadFields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'contentImages', maxCount: 10 },
  ]),
  validateZod(blogSchemas.update),
  blogController.update,
)
router.delete('/:id', authenticate, blogController.delete)

export default router
