import { Router } from 'express'
import { optionalAuth } from '../middleware/auth.js'
import { contentController } from '../controllers/contentController.js'
import { portfolioController } from '../controllers/portfolioController.js'
import { virtualDesignController } from '../controllers/virtualDesignController.js'
import { serviceController } from '../controllers/serviceController.js'
import { aboutController } from '../controllers/aboutController.js'
import { heroMediaController } from '../controllers/heroMediaController.js'
import { consultationController } from '../controllers/consultationController.js'
import { uploadFields } from '../middleware/upload.js'
import { authenticate } from '../middleware/auth.js'
import { cacheHeaders } from '../middleware/cacheHeaders.js'

const router = Router()

router.get('/homepage', cacheHeaders(5, 30), contentController.homepage)
router.post('/newsletter', contentController.newsletter)
router.get('/services', optionalAuth, cacheHeaders(10, 60), serviceController.list)
router.get('/services/:id', optionalAuth, cacheHeaders(10, 60), serviceController.get)
router.get('/about', optionalAuth, cacheHeaders(10, 120), aboutController.get)
router.get('/about/team', optionalAuth, cacheHeaders(10, 120), aboutController.get)
router.get('/hero-media', optionalAuth, cacheHeaders(5, 30), heroMediaController.list)
router.get('/hero-media/:id', optionalAuth, cacheHeaders(5, 30), heroMediaController.get)
router.post('/consultations', consultationController.publicCreate)
router.get('/consultations', optionalAuth, cacheHeaders(5, 30), consultationController.list)

export const portfolioRoutes = Router()
portfolioRoutes.get('/', cacheHeaders(5, 30), portfolioController.list)
portfolioRoutes.get('/:id', cacheHeaders(10, 60), portfolioController.get)
portfolioRoutes.post('/', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), portfolioController.create)
portfolioRoutes.patch('/:id', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), portfolioController.update)
portfolioRoutes.delete('/:id', authenticate, portfolioController.delete)

export const virtualDesignRoutes = Router()
virtualDesignRoutes.get('/', cacheHeaders(5, 30), virtualDesignController.list)
virtualDesignRoutes.get('/:id', cacheHeaders(10, 60), virtualDesignController.get)
virtualDesignRoutes.post('/', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), virtualDesignController.create)
virtualDesignRoutes.patch('/:id', authenticate, uploadFields([{ name: 'media', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]), virtualDesignController.update)
virtualDesignRoutes.delete('/:id', authenticate, virtualDesignController.delete)

export default router
