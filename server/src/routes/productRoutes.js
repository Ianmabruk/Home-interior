import { Router } from 'express'
import multer from 'multer'
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct, addColorVariant, removeColorVariant } from '../controllers/productController.js'
import { auth, authorize } from '../middleware/auth.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.get('/', listProducts)
router.get('/:id', getProduct)
router.post('/', auth, authorize('admin'), upload.array('images', 8), createProduct)
router.patch('/:id', auth, authorize('admin'), upload.array('images', 8), updateProduct)
router.delete('/:id', auth, authorize('admin'), deleteProduct)
router.post('/:id/variants', auth, authorize('admin'), upload.single('image'), addColorVariant)
router.delete('/:id/variants/:colorName', auth, authorize('admin'), removeColorVariant)

export default router
