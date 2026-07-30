import { prisma } from '../config/database.js'
import { failure } from '../utils/response.js'

export const orderService = {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
}

function parseOrder(order) {
  return {
    _id: order.id,
    id: order.id,
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
  const order = await prisma.order.create({ data })
  return parseOrder(order)
}

async function getOrder(id) {
  const order = await prisma.order.findUnique({
    where: { id },
  })
  if (!order) throw failure(404, 'Order not found')
  return parseOrder(order)
}

async function getUserOrders(email) {
  const orders = await prisma.order.findMany({
    where: { email },
    orderBy: { createdAt: 'desc' },
  })
  return orders.map(parseOrder)
}

async function getAllOrders({ sort = '-createdAt', limit = 100 } = {}) {
  const orderBy = sort?.startsWith('-') ? { [sort.slice(1)]: 'desc' } : { createdAt: 'asc' }
  const orders = await prisma.order.findMany({
    orderBy,
    take: Number(limit) || 100,
  })
  return orders.map(parseOrder)
}

async function updateOrderStatus(id, status) {
  const order = await prisma.order.update({
    where: { id },
    data: { status },
  })
  return parseOrder(order)
}
