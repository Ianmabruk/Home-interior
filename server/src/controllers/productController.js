import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { ApiError } from '../utils/ApiError.js'
import { mediaService } from '../services/media.service.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray, parseMaybeJson, parseListField, parseMediaSettings, parseBody } from '../utils/helpers.js'

const formBoolean = z.preprocess((value) => {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === '1' || value === 'on') return true
  if (value === 'false' || value === '0' || value === '') return false
  return value
}, z.boolean()).optional()

const VALID_CATEGORIES = ['Mirrors', 'Frames', 'Throw Pillows']

const normalizeCategory = (value) => {
  if (value === 'Throw Pillows') return 'ThrowPillows'
  if (VALID_CATEGORIES.includes(value)) return value
  return value
}

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.coerce.number().min(0),
  discountPrice: z.coerce.number().min(0).optional(),
  category: z.enum(VALID_CATEGORIES).transform(normalizeCategory),
  vendor: z.string().optional(),
  stock: z.coerce.number().int().min(0),
  sku: z.string().min(2),
  tags: z.preprocess((v) => parseListField(v, []), z.array(z.string())),
  isFeatured: formBoolean,
  isPublished: formBoolean,
})

export const listProducts = async (req, res) => {
  try {
    const { q, category, sort = '-createdAt', page = 1, limit = 12 } = req.query
    const where = { isPublished: true }

    if (q) {
      const search = String(q)
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (category) {
      where.category = normalizeCategory(String(category))
    }

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort
    const sortOrder = sort.startsWith('-') ? 'desc' : 'asc'

    const safeLimit = Math.min(Number(limit), 200)
    const safePage = Number(page)

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      prisma.product.count({ where }),
    ])

    res.json(sendSuccess({ items: withIdArray(items), total, page: safePage, pages: Math.ceil(total / safeLimit) }))
  } catch (error) {
    console.error('[PRODUCT][LIST] error:', error?.message)
    res.status(500).json({ success: false, message: 'Failed to fetch products' })
  }
}

export const listAllProducts = async (req, res) => {
  try {
    const { q, category, sort = '-createdAt', page = 1, limit = 100 } = req.query
    const where = {}

    if (q) {
      const search = String(q)
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (category) {
      where.category = normalizeCategory(String(category))
    }

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort
    const sortOrder = sort.startsWith('-') ? 'desc' : 'asc'

    const safeLimit = Math.min(Number(limit), 200)
    const safePage = Number(page)

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      prisma.product.count({ where }),
    ])

    res.json(sendSuccess({ items: withIdArray(items), total, page: safePage, pages: Math.ceil(total / safeLimit) }))
  } catch (error) {
    console.error('[PRODUCT][LISTALL] error:', error?.message)
    res.status(500).json({ success: false, message: 'Failed to fetch products' })
  }
}

export const getProduct = async (req, res) => {
  try {
    const item = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!item) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }
    res.json(sendSuccess(withId(item)))
  } catch (error) {
    console.error('[PRODUCT][GET] error:', error?.message)
    res.status(500).json({ success: false, message: 'Failed to fetch product' })
  }
}

export const createProduct = async (req, res) => {
  try {
    const data = parseBody(productSchema, req.body)
    const files = req.files || []

    const uploads = await Promise.all(
      files.map((file) => mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/products', type: 'image' })),
    )

    const colorVariantsRaw = Array.isArray(req.body.colorVariants)
      ? req.body.colorVariants
      : parseMaybeJson(req.body.colorVariants, [])
    const colorVariants = Array.isArray(colorVariantsRaw) ? colorVariantsRaw : []

    const styleVariantsRaw = Array.isArray(req.body.styleVariants)
      ? req.body.styleVariants
      : parseMaybeJson(req.body.styleVariants, [])
    const styleVariants = Array.isArray(styleVariantsRaw) ? styleVariantsRaw : []

    const tags = parseListField(req.body.tags, [])

    const product = await prisma.product.create({
      data: {
        ...data,
        isPublished: data.isPublished ?? true,
        tags: Array.isArray(tags) ? tags : [],
        images: uploads.map((item) => ({ url: item.secure_url, publicId: item.public_id })),
        colorVariants,
        styleVariants,
        mediaSettings: parseMediaSettings(req.body.mediaSettings) || undefined,
      },
    })

    res.status(201).json(sendSuccess(withId(product)))
  } catch (error) {
    console.error('[PRODUCT][CREATE] error:', error?.message)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({ success: false, message: 'Failed to create product' })
  }
}

export const updateProduct = async (req, res) => {
  try {
    const data = parseBody(productSchema.partial(), req.body)
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    const files = req.files || []
    if (files.length > 0) {
      const oldImages = Array.isArray(product.images) ? product.images : []
      const oldDeletes = oldImages.map((img) => img.publicId ? mediaService.delete(img.publicId, 'image') : Promise.resolve())
      const uploads = await Promise.all(
        files.map((file) => mediaService.upload({ buffer: file.buffer, mimeType: file.mimetype, folder: 'hok/products', type: 'image' })),
      )
      data.images = uploads.map((item) => ({ url: item.secure_url, publicId: item.public_id }))
      await Promise.all(oldDeletes)
    }

    const colorVariantsRaw = Array.isArray(req.body.colorVariants)
      ? req.body.colorVariants
      : parseMaybeJson(req.body.colorVariants, null)
    if (Array.isArray(colorVariantsRaw)) {
      data.colorVariants = colorVariantsRaw
    }

    const parsedMediaSettings = parseMediaSettings(req.body.mediaSettings)
    if (parsedMediaSettings) data.mediaSettings = parsedMediaSettings

    const styleVariantsRaw = Array.isArray(req.body.styleVariants)
      ? req.body.styleVariants
      : parseMaybeJson(req.body.styleVariants, null)
    if (Array.isArray(styleVariantsRaw)) {
      data.styleVariants = styleVariantsRaw
    }

    const updated = await prisma.product.update({ where: { id: req.params.id }, data })
    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error('[PRODUCT][UPDATE] error:', error?.message)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({ success: false, message: 'Failed to update product' })
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    const imageDeletes = (product.images || []).map((img) => img.publicId ? mediaService.delete(img.publicId, 'image') : Promise.resolve())
    const variantDeletes = (product.colorVariants || []).map((v) => v.imagePublicId ? mediaService.delete(v.imagePublicId, 'image') : Promise.resolve())
    await Promise.all([...imageDeletes, ...variantDeletes])

    await prisma.product.delete({ where: { id: req.params.id } })
    res.json(sendSuccess({ message: 'Product deleted' }))
  } catch (error) {
    console.error('[PRODUCT][DELETE] error:', error?.message)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({ success: false, message: 'Failed to delete product' })
  }
}

export const addColorVariant = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

    const { colorName, colorHex = '', stockQuantity = 0, priceOverride, sku, setAsDefault } = req.body
    if (!colorName) return res.status(400).json({ success: false, message: 'colorName is required' })
    if (!req.file) return res.status(400).json({ success: false, message: 'Image file is required' })

    const upload = await mediaService.upload({ buffer: req.file.buffer, mimeType: req.file.mimetype, folder: 'hok/products/variants', type: 'image' })

    const currentVariants = Array.isArray(product.colorVariants) ? product.colorVariants : []
    const filtered = currentVariants.filter((v) => v.colorName !== colorName)
    const forceDefault = setAsDefault === true || setAsDefault === 'true'
    const isDefault = forceDefault || filtered.length === 0
    const newVariant = {
      colorName,
      colorHex,
      sku: sku ? String(sku) : undefined,
      imageUrl: upload.secure_url,
      imagePublicId: upload.public_id,
      stockQuantity: Number(stockQuantity),
      priceOverride: priceOverride !== undefined && priceOverride !== '' ? Number(priceOverride) : undefined,
      isDefault: Boolean(isDefault),
    }

    const variants = [...filtered, newVariant].map((v) => ({
      ...v,
      isDefault: v.colorName === newVariant.colorName ? true : false,
    }))

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { colorVariants: variants },
    })

    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error('[PRODUCT][VARIANT_ADD] error:', error?.message)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({ success: false, message: 'Failed to add color variant' })
  }
}

export const setDefaultVariant = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

    const colorName = decodeURIComponent(req.params.colorName)
    const currentVariants = Array.isArray(product.colorVariants) ? product.colorVariants : []
    const target = currentVariants.find((v) => v.colorName === colorName)
    if (!target) return res.status(404).json({ success: false, message: 'Variant not found' })

    const variants = currentVariants.map((v) => ({
      ...v,
      isDefault: v.colorName === colorName,
    }))

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { colorVariants: variants },
    })

    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error('[PRODUCT][VARIANT_DEFAULT] error:', error?.message)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({ success: false, message: 'Failed to set default variant' })
  }
}

export const removeColorVariant = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

    const { colorName } = req.params
    if (!colorName) return res.status(400).json({ success: false, message: 'colorName is required' })

    const currentVariants = Array.isArray(product.colorVariants) ? product.colorVariants : []
    const variant = currentVariants.find((v) => v.colorName === colorName)
    if (variant?.imagePublicId) {
      try {
        await mediaService.delete(variant.imagePublicId, 'image')
      } catch {
        // ignore
      }
    }

    const filtered = currentVariants.filter((v) => v.colorName !== colorName)

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { colorVariants: filtered },
    })

    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error('[PRODUCT][VARIANT_REMOVE] error:', error?.message)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({ success: false, message: 'Failed to remove color variant' })
  }
}

export const addStyleVariant = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

    const { styleName, description = '', images = [] } = req.body
    if (!styleName) return res.status(400).json({ success: false, message: 'styleName is required' })

    const currentVariants = Array.isArray(product.styleVariants) ? product.styleVariants : []
    const filtered = currentVariants.filter((v) => v.styleName !== styleName)
    const isDefault = filtered.length === 0
    const newVariant = {
      styleName,
      description,
      images: Array.isArray(images) ? images : [],
      isDefault,
    }

    const variants = [...filtered, newVariant].map((v) => ({
      ...v,
      isDefault: v.styleName === styleName,
    }))

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { styleVariants: variants },
    })

    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error('[PRODUCT][STYLE_ADD] error:', error?.message)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({ success: false, message: 'Failed to add style variant' })
  }
}

export const removeStyleVariant = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

    const { styleName } = req.params
    if (!styleName) return res.status(400).json({ success: false, message: 'styleName is required' })

    const currentVariants = Array.isArray(product.styleVariants) ? product.styleVariants : []
    const filtered = currentVariants.filter((v) => v.styleName !== styleName)

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { styleVariants: filtered },
    })

    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error('[PRODUCT][STYLE_REMOVE] error:', error?.message)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({ success: false, message: 'Failed to remove style variant' })
  }
}

export const setDefaultStyleVariant = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

    const styleName = decodeURIComponent(req.params.styleName)
    const currentVariants = Array.isArray(product.styleVariants) ? product.styleVariants : []
    const target = currentVariants.find((v) => v.styleName === styleName)
    if (!target) return res.status(404).json({ success: false, message: 'Style variant not found' })

    const variants = currentVariants.map((v) => ({
      ...v,
      isDefault: v.styleName === styleName,
    }))

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { styleVariants: variants },
    })

    res.json(sendSuccess(withId(updated)))
  } catch (error) {
    console.error('[PRODUCT][STYLE_DEFAULT] error:', error?.message)
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message, details: error.details })
    }
    res.status(500).json({ success: false, message: 'Failed to set default style variant' })
  }
}
