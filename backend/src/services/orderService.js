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

async function generateUniqueTrackingNumber() {
  for (let i = 0; i < 10; i++) {
    const candidate = generateTrackingNumber()
    const exists = await withRetry(() => prisma.order.findUnique({
      where: { trackingNumber: candidate },
      select: { id: true },
    }))
    if (!exists) return candidate
  }
  return generateTrackingNumber() + Math.floor(Math.random() * 1000)
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
  const enrichedItems = Array.isArray(data.items) ? data.items : (() => { try { return JSON.parse(data.items || '[]') } catch { return [] } })()
    if (!enrichedItems.length) {
      throw failure(400, 'Order must contain at least one item')
    }

    const productIds = enrichedItems.map((i) => i.productId).filter(Boolean)
    const products = productIds.length > 0 ? await withRetry(() => prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true },
    })) : []
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
      console.warn(`[orders] Missing products for IDs: ${missingProducts.map((i) => i.productId).join(', ')}`)
    }

    const serverTotal = finalItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)

    let created
    try {
      const trackingNumber = await generateUniqueTrackingNumber()
      created = await withRetry(() => prisma.order.create({
        data: {
          ...data,
          items: JSON.stringify(finalItems),
          total: serverTotal,
          trackingNumber,
        },
      }))
    } catch (err) {
      console.error('[orders] order create failed:', err)
      throw failure(500, err?.message || 'Failed to create order')
    }

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
      } else if (product.stock < qty) {
        throw failure(400, `Insufficient stock for ${product.name}`)
      }
    }

    // Parallelize stock updates instead of sequential updates.
    // This reduces the total time spent on stock updates from O(n) to O(1).
    const stockUpdates = finalItems
      .filter((item) => item.productId && productMap.has(item.productId))
      .map((item) => {
        const product = productMap.get(item.productId)
        const qty = Number(item.quantity) || 1
        if (product.variants && item.variantId) {
          const variant = product.variants.find((v) => v.id === item.variantId)
          if (variant) {
            return withRetry(() => prisma.productVariant.update({
              where: { id: variant.id },
              data: { stock: { decrement: qty } },
            }))
          }
        }
        return withRetry(() => prisma.product.update({
          where: { id: product.id },
          data: { stock: { decrement: qty } },
        }))
      })

    await Promise.all(stockUpdates)

    try {
      await sendOrderConfirmationEmail({
        order: created,
        toEmail: data.email,
      })
    } catch (emailErr) {
      console.error('[orders] order confirmation email failed:', emailErr)
    }

    // Send admin notification email (fire-and-forget)
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL
      if (adminEmail) {
        await emailService.sendRawEmail({
          eventId: `order_${String(created.id)}_admin_notification`,
          to: adminEmail,
          name: 'HOK Admin',
          subject: `New Order Received — ${created.trackingNumber || '#' + String(created.id).slice(-8).toUpperCase()}`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <h1 style="color:#2a241f;">New Order Received</h1>
              <div style="background:#faf8f4;border-radius:12px;padding:16px;margin:16px 0;">
                <p><strong>Order:</strong> #${String(created.id).slice(-8).toUpperCase()}</p>
                <p><strong>Tracking:</strong> ${created.trackingNumber || 'N/A'}</p>
                <p><strong>Customer:</strong> ${created.name || 'Guest'}</p>
                <p><strong>Email:</strong> ${created.email}</p>
                <p><strong>Phone:</strong> ${created.phone || 'N/A'}</p>
                <p><strong>Total:</strong> KSh ${Number(created.total || 0).toLocaleString()}</p>
                <p><strong>Status:</strong> ${created.status || 'Pending'}</p>
                <p><strong>Date:</strong> ${new Date(created.createdAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}</p>
              </div>
              <a href="${process.env.CLIENT_URL || 'https://hokinteriors.co.ke'}/admin/orders?orderId=${created.id}" style="display:inline-block;padding:12px 24px;background:#2a241f;color:#fff;text-decoration:none;border-radius:8px;">View Order in Dashboard</a>
            </div>
          `,
          text: `New Order Received\n\nOrder: #${String(created.id).slice(-8).toUpperCase()}\nTracking: ${created.trackingNumber || 'N/A'}\nCustomer: ${created.name || 'Guest'}\nEmail: ${created.email}\nPhone: ${created.phone || 'N/A'}\nTotal: KSh ${Number(created.total || 0).toLocaleString()}\nStatus: ${created.status || 'Pending'}\nDate: ${new Date(created.createdAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}\n\nView Order: ${process.env.CLIENT_URL || 'https://hokinteriors.co.ke'}/admin/orders?orderId=${created.id}`,
        })
      }
    } catch (adminEmailErr) {
      console.error('[orders] admin notification email failed:', adminEmailErr)
    }

    return parseOrder(created)
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

async function getAllOrders({ sort = '-createdAt', limit = 100 } = {}) {
  const orderBy = sort?.startsWith('-') ? { [sort.slice(1)]: 'desc' } : { createdAt: 'asc' }
  const orders = await withRetry(() => prisma.order.findMany({
    orderBy,
    take: Number(limit) || 100,
  }))
  return orders.map(parseOrder)
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
