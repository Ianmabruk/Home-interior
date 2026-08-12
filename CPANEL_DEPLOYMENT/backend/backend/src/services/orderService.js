import { prisma, withRetry } from '../config/database.js'
import { failure } from '../utils/response.js'

export const orderService = {
  createOrder,
  getOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
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
    total: order.total,
    status: order.status,
    createdAt: order.createdAt,
  }
}

async function createOrder(data) {
  try {
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
      created = await withRetry(() => prisma.order.create({
        data: {
          ...data,
          items: JSON.stringify(finalItems),
          total: serverTotal,
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
        await withRetry(() => prisma.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: qty } },
        }))
      } else if (product.stock < qty) {
        throw failure(400, `Insufficient stock for ${product.name}`)
      } else {
        await withRetry(() => prisma.product.update({
          where: { id: product.id },
          data: { stock: { decrement: qty } },
        }))
      }
    }

    return parseOrder(created)
  } catch (err) {
    console.error('[orders] createOrder failed:', err)
    if (err?.status) throw err
    throw failure(500, err?.message || 'Failed to create order')
  }
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

async function updateOrderStatus(id, status) {
  const order = await withRetry(() => prisma.order.update({
    where: { id },
    data: { status },
  }))
  return parseOrder(order)
}
