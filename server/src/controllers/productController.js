import { z } from 'zod'
import { prisma } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { uploadImage, uploadVideo } from '../services/uploadService.js'
import { sendEmail, buildNewProductEmailTemplate } from '../config/sendgrid.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { withId, withIdArray, parseMaybeJson, parseMediaSettings } from '../utils/helpers.js'

// Multipart/form-data sends every field as a string, so `z.coerce.boolean()`
// is unsafe here: it turns the string 'false' into `true` (any non-empty
// string is truthy), which permanently breaks the Published/Featured toggles.
// This parser maps the real submitted value back to a boolean and stays
// optional so `?? true` create-time defaults still apply.
const formBoolean = z.preprocess((value) => {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === '1' || value === 'on') return true
  if (value === 'false' || value === '0' || value === '') return false
  return value
}, z.boolean()).optional()

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.coerce.number().min(0),
  discountPrice: z.coerce.number().min(0).optional(),
  category: z.string().min(2),
  vendor: z.string().optional(),
  stock: z.coerce.number().int().min(0),
  sku: z.string().min(2),
  tags: z.array(z.string()).optional(),
  isFeatured: formBoolean,
  isPublished: formBoolean,
})

export const listProducts = asyncHandler(async (req, res) => {
  const { q, category, sort = '-createdAt', page = 1, limit = 12 } = req.query
  const where = { isPublished: true }

  if (q) {
    const search = String(q)
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { vendor: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (category) {
    where.category = String(category)
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
})

export const listAllProducts = asyncHandler(async (req, res) => {
  const { q, category, sort = '-createdAt', page = 1, limit = 100 } = req.query
  const where = {}

  if (q) {
    const search = String(q)
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { vendor: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (category) {
    where.category = String(category)
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
})

export const getProduct = asyncHandler(async (req, res) => {
  const item = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!item) {
    throw new ApiError(404, 'Product not found')
  }
  res.json(sendSuccess(withId(item)))
})

export const createProduct = asyncHandler(async (req, res) => {
  const data = productSchema.parse(req.body)
  const files = req.files || []

  const uploads = await Promise.all(
      files.map((file) => uploadImage(file.buffer, 'hok/products', file.mimetype)),
  )

  const colorVariantsRaw = Array.isArray(req.body.colorVariants)
    ? req.body.colorVariants
    : parseMaybeJson(req.body.colorVariants, [])
  const colorVariants = Array.isArray(colorVariantsRaw) ? colorVariantsRaw : []

  const tags = Array.isArray(req.body.tags)
    ? req.body.tags
    : parseMaybeJson(req.body.tags, [])

  const product = await prisma.product.create({
    data: {
      ...data,
      isPublished: data.isPublished ?? true,
      tags: Array.isArray(tags) ? tags : [],
      images: uploads.map((item) => ({ url: item.secure_url, publicId: item.public_id })),
      colorVariants,
      mediaSettings: parseMediaSettings(req.body.mediaSettings) || undefined,
    },
  })

  try {
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
    if (admin) {
      await sendEmail({
        to: admin.email,
        subject: 'New Product Added - HOK Interior',
        html: buildNewProductEmailTemplate({
          productName: product.name,
          productPrice: product.discountPrice || product.price,
          productImageUrl: product.images?.[0]?.url,
        }),
      })
    }
  } catch (err) {
    console.error('New product notification email failed:', err)
  }

  res.status(201).json(sendSuccess(withId(product)))
})

export const updateProduct = asyncHandler(async (req, res) => {
  const data = productSchema.partial().parse(req.body)
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!product) {
    throw new ApiError(404, 'Product not found')
  }

  const files = req.files || []
  if (files.length > 0) {
    const uploads = await Promise.all(
    files.map((file) => uploadImage(file.buffer, 'hok/products', file.mimetype)),
    )
    data.images = uploads.map((item) => ({ url: item.secure_url, publicId: item.public_id }))
  }

  const colorVariantsRaw = Array.isArray(req.body.colorVariants)
    ? req.body.colorVariants
    : parseMaybeJson(req.body.colorVariants, null)
  if (Array.isArray(colorVariantsRaw)) {
    data.colorVariants = colorVariantsRaw
  }

  const parsedMediaSettings = parseMediaSettings(req.body.mediaSettings)
  if (parsedMediaSettings) data.mediaSettings = parsedMediaSettings

  // Do NOT force isPublished to a default on update — `data` only carries the
  // fields the admin actually submitted, so an edit can never accidentally
  // republish a product that was intentionally unpublished.
  const updated = await prisma.product.update({ where: { id: req.params.id }, data })
  res.json(sendSuccess(withId(updated)))
})

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!product) {
    throw new ApiError(404, 'Product not found')
  }
  await prisma.product.delete({ where: { id: req.params.id } })
  res.json(sendSuccess({ message: 'Product deleted' }))
})

export const addColorVariant = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!product) throw new ApiError(404, 'Product not found')

  const { colorName, colorHex = '', stockQuantity = 0, priceOverride } = req.body
  if (!colorName) throw new ApiError(400, 'colorName is required')
  if (!req.file) throw new ApiError(400, 'Image file is required')

  const upload = await uploadImage(req.file.buffer, 'hok/products/variants', req.file.mimetype)

  const currentVariants = Array.isArray(product.colorVariants) ? product.colorVariants : []
  const filtered = currentVariants.filter((v) => v.colorName !== colorName)
  const isDefault = currentVariants.length === 0
  const newVariant = {
    colorName,
    colorHex,
    imageUrl: upload.secure_url,
    imagePublicId: upload.public_id,
    stockQuantity: Number(stockQuantity),
    priceOverride: priceOverride !== undefined && priceOverride !== '' ? Number(priceOverride) : undefined,
    isDefault: Boolean(isDefault),
  }

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: { colorVariants: [...filtered, newVariant] },
  })

  res.json(sendSuccess(withId(updated)))
})

export const removeColorVariant = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!product) throw new ApiError(404, 'Product not found')

  const { colorName } = req.params
  if (!colorName) {
    throw new ApiError(400, 'colorName is required')
  }

  const currentVariants = Array.isArray(product.colorVariants) ? product.colorVariants : []
  const filtered = currentVariants.filter((v) => v.colorName !== colorName)

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: { colorVariants: filtered },
  })

  res.json(sendSuccess(withId(updated)))
})
