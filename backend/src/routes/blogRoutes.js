import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { uploadFields } from '../middleware/upload.js'
import { blogController } from '../controllers/blogController.js'

const router = Router()

router.get('/', authenticate, blogController.getAll)
router.get('/published', blogController.list)
router.get('/:id', authenticate, blogController.get)
router.post('/', authenticate, uploadFields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), blogController.create)
router.patch('/:id', authenticate, uploadFields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), blogController.update)
router.delete('/:id', authenticate, blogController.delete)

export default router