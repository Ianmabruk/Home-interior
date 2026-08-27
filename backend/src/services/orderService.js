import { prisma, withRetry } from '../config/database.js'
import { failure } from '../utils/response.js'
import { sendOrderConfirmationEmail, default as emailService } from './emailService.js'

const TRACKING_PREFIX = 'HOK'
const TRACKING_LENGTH = 6

function generateTrackingNumber() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < TRACKING_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const year = new Date().getFullYear()
  return `${TRACKING_PREFIX}-${year}-${code}`
}

// Keep for backwards compatibility but simplified
async function generateUniqueTrackingNumber() {
  return generateTrackingNumber()
}

export const orderService = {
  createOrder,
  getOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  trackOrder,
}

function parseOrder(order) {
  return {
    _id: order.id,
    id: order.id,
    userId: order.userId,
    email: order.email,
    name: order.name,
    phone: order.phone,
    items: typeof order.items === 'string' ? (() => { try { return JSON.parse(order.items) } catch { return [] } })() : (order.items || []),
    shippingAddress: typeof order.shippingAddress === 'string' ? (() => { try { return JSON.parse(order.shippingAddress) } catch { return {} } })() : (order.shippingAddress || {}),
    shippingMethod: order.shippingMethod,
    paymentMethod: order.paymentMethod,
    paymentDetails: typeof order.paymentDetails === 'string' ? (() => { try { return JSON.parse(order.paymentDetails) } catch { return {} } })() : (order.paymentDetails || {}),
    paymentStatus: order.paymentStatus || 'pending',
    paymentReference: order.paymentReference || null,
    total: order.total,
    status: order.status,
    trackingNumber: order.trackingNumber,
    customerNote: order.customerNote,
    estimatedDelivery: order.estimatedDelivery,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

function parseOrderSafe(order) {
  return {
    id: order.id,
    trackingNumber: order.trackingNumber,
    status: order.status,
    customerNote: order.customerNote,
    estimatedDelivery: order.estimatedDelivery,
    createdAt: order.createdAt,
  }
}

function buildOrderSignature(data) {
  const items = Array.isArray(data.items) ? data.items : []
  const normalized = items.map((i) => ({
    productId: i.productId || null,
    variantId: i.variantId || null,
    quantity: Number(i.quantity) || 1,
    price: Number(i.price) || 0,
  })).sort((a, b) => `${a.productId}:${a.variantId}`.localeCompare(`${b.productId}:${b.variantId}`))
  return `${String(data.email).toLowerCase()}|${Number(data.total) || 0}|${JSON.stringify(normalized)}`
}

const pendingOrders = new Map()
const recentOrderCache = new Map()
const IDEMPOTENCY_WINDOW_MS = 30_000

async function createOrder(data) {
  try {
    const enrichedItems = Array.isArray(data.items) ? data.items : (() => { try { return JSON.parse(data.items || '[]') } catch { return [] } })()
    if (!enrichedItems.length) {
      throw failure(400, 'Order must contain at least one item')
    }

    const signature = buildOrderSignature(data)

    if (pendingOrders.has(signature)) {
      return pendingOrders.get(signature)
    }

    const now = Date.now()
    const cached = recentOrderCache.get(signature)
    if (cached && now - cached.timestamp < IDEMPOTENCY_WINDOW_MS) {
      return cached.order
    }

    const promise = createOrderInternal(data, signature)
    pendingOrders.set(signature, promise)
    try {
      const order = await promise
      recentOrderCache.set(signature, { order, timestamp: Date.now() })
      // Schedule notifications asynchronously after order is created
      scheduleOrderNotifications(order, data)
      return order
    } finally {
      pendingOrders.delete(signature)
    }
  } catch (err) {
    console.error('[orders] createOrder failed:', err)
    if (err?.status) throw err
    throw failure(500, err?.message || 'Failed to create order')
  }
}

async function createOrderInternal(data, signature) {
  const t0 = Date.now()
  const enrichedItems = Array.isArray(data.items) ? data.items : (() => { try { return JSON.parse(data.items || '[]') } catch { return [] } })()
  if (!enrichedItems.length) {
    throw failure(400, 'Order must contain at least one item')
  }

  const productIds = enrichedItems.map((i) => i.productId).filter(Boolean)
  console.log(`[ORDER ${signature}] INTERNAL_START ${Date.now() - t0}ms items=${enrichedItems.length} products=${productIds.length}`)

  // Use transaction to batch all database operations
  // This reduces round trips from 4+ to 1
  try {
    const result = await prisma.$transaction(async (tx) => {
      const txT0 = Date.now()
      // Fetch products within transaction
      const products = productIds.length > 0 ? await tx.product.findMany({
        where: { id: { in: productIds } },
        include: { variants: true },
      }) : []
      console.log(`[ORDER ${signature}] TX_PRODUCTS_FETCHED ${Date.now() - txT0}ms count=${products.length}`)

      const productMap = new Map(products.map((p) => [p.id, p]))

      const finalItems = enrichedItems.map((item) => {
        const product = productMap.get(item.productId)
        const variant = product?.variants?.find((v) => v.id === item.variantId)
        const dbPrice = variant?.price || product?.price || 0
        if (item.price !== undefined && Math.abs(Number(item.price) - dbPrice) > 0.01) {
          throw failure(400, `Price mismatch for product ${item.productId}`)
        }
        return {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: dbPrice,
          name: product?.name || 'Unknown Product',
          image: variant?.image || product?.mainImage || (Array.isArray(product?.images) ? product.images[0] : '') || '',
          selectedVariant: variant ? {
            id: variant.id,
            color: variant.color,
            colorHex: variant.colorHex,
            image: variant.image,
            price: variant.price,
            stock: variant.stock,
          } : null,
        }
      })

      const missingProducts = enrichedItems.filter((i) => i.productId && !productMap.has(i.productId))
      if (missingProducts.length > 0) {
        console.warn(`[ORDER ${signature}] Missing products for IDs: ${missingProducts.map((i) => i.productId).join(', ')}`)
      }

      const serverTotal = finalItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)

      // Generate tracking number (no extra SELECT query needed)
      const trackingNumber = generateTrackingNumber()
      console.log(`[ORDER ${signature}] TX_ORDER_CREATE_START ${Date.now() - txT0}ms`)

      // Create order within transaction
      const created = await tx.order.create({
        data: {
          ...data,
          items: JSON.stringify(finalItems),
          total: serverTotal,
          trackingNumber,
        },
      })
      console.log(`[ORDER ${signature}] TX_ORDER_CREATED ${Date.now() - txT0}ms id=${created.id}`)

      // Stock validation and updates within transaction
      const stockT0 = Date.now()
      for (const item of finalItems) {
        if (!item.productId) continue
        const product = productMap.get(item.productId)
        if (!product) continue

        const qty = Number(item.quantity) || 1
        if (product.variants && item.variantId) {
          const variant = product.variants.find((v) => v.id === item.variantId)
          if (!variant || variant.stock < qty) {
            throw failure(400, `Insufficient stock for ${product.name}`)
          }
          // Update variant stock
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: { decrement: qty } },
          })
        } else if (product.stock < qty) {
          throw failure(400, `Insufficient stock for ${product.name}`)
        }
        // Update product stock
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: qty } },
        })
      }
      console.log(`[ORDER ${signature}] TX_STOCK_UPDATED ${Date.now() - stockT0}ms items=${finalItems.length}`)

      const order = parseOrder(created)
      console.log(`[ORDER ${signature}] TX_COMMIT ${Date.now() - txT0}ms total=${Date.now() - t0}ms`)
      return order
    }, {
      isolationLevel: 'ReadCommitted',
      maxWait: 5000,
      timeout: 10000,
    })
    console.log(`[ORDER ${signature}] INTERNAL_COMPLETE ${Date.now() - t0}ms`)
    return result
  } catch (err) {
    console.error(`[ORDER ${signature}] INTERNAL_FAILED ${Date.now() - t0}ms`, err?.code, err?.message || err)
    if (err?.status) throw err
    // Handle unique constraint violation on tracking number
    if (err?.code === 'P2002') {
      // Retry with new tracking number
      return createOrderInternal(data, signature)
    }
    throw failure(500, err?.message || 'Failed to create order')
  }
}

// Schedule notifications asynchronously (fire-and-forget)
function scheduleOrderNotifications(created, data) {
  setImmediate(() => {
    sendOrderConfirmationEmail({ order: created, toEmail: data.email })
      .catch((e) => console.error('[orders] confirmation email failed:', e?.message))

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL
    if (adminEmail) {
      emailService.sendRawEmail({
        eventId: `order_${String(created.id)}_admin_notification`,
        to: adminEmail,
        name: 'HOK Admin',
        subject: `New Order Received — ${created.trackingNumber || '#' + String(created.id).slice(-8).toUpperCase()}`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h1 style="color:#2a241f;">New Order Received</h1>
          <div style="background:#faf8f4;border-radius:12px;padding:16px;margin:16px 0;">
            <p><strong>Order:</strong> #${String(created.id).slice(-8).toUpperCase()}</p>
            <p><strong>Tracking:</strong> ${created.trackingNumber || 'N/A'}</p>
            <p><strong>Customer:</strong> ${created.name || 'Guest'}</p>
            <p><strong>Email:</strong> ${created.email}</p>
            <p><strong>Total:</strong> KSh ${created.total?.toLocaleString() || '0'}</p>
          </div>
          <p style="color:#666;font-size:14px;">Log in to the admin dashboard to process this order.</p>
        </div>`,
      }).catch((e) => console.error('[orders] admin email failed:', e?.message))
    }
  })
}

async function getOrder(id) {
  const order = await withRetry(() => prisma.order.findUnique({
    where: { id },
  }))
  if (!order) throw failure(404, 'Order not found')
  return parseOrder(order)
}

async function getUserOrders(emailOrId) {
  const where = emailOrId ? { OR: [{ email: emailOrId }, { userId: emailOrId }] } : {}
  const orders = await withRetry(() => prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  }))
  return orders.map(parseOrder)
}

async function getAllOrders({ sort = '-createdAt', limit = 50, skip = 0, pagination = false } = {}) {
  const orderBy = sort?.startsWith('-') ? { [sort.slice(1)]: 'desc' } : { createdAt: 'asc' }
  const take = pagination ? (Number(limit) || 50) : (Number(limit) || 100)
  const orders = await withRetry(() => prisma.order.findMany({
    orderBy,
    take,
    skip: Number(skip) || 0,
  }))
  const result = {
    orders: orders.map(parseOrder),
  }
  // Include pagination metadata when paginated queries are used
  if (pagination) {
    const total = await withRetry(() => prisma.order.count())
    result.pagination = {
      total,
      limit: take,
      skip: Number(skip) || 0,
      pages: Math.ceil(total / take),
    }
  }
  return result
}

async function updateOrderStatus(id, updateData) {
  const order = await withRetry(() => prisma.order.update({
    where: { id },
    data: updateData,
  }))
  return parseOrder(order)
}

async function trackOrder(trackingNumber, contact) {
  if (!trackingNumber || !contact) {
    throw failure(400, 'Tracking number and contact are required')
  }
  const contactLower = String(contact).trim().toLowerCase()
  const order = await withRetry(() => prisma.order.findFirst({
    where: {
      trackingNumber,
      OR: [
        { email: { equals: contactLower, mode: 'insensitive' } },
        { phone: { equals: contact, mode: 'insensitive' } },
      ],
    },
  }))
  if (!order) {
    throw failure(404, 'We couldn\'t verify this order. Please check your tracking number and contact details.')
  }
  return parseOrderSafe(order)
}
