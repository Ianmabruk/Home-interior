import { prisma } from '../config/database.js'
import { notifyAdmins } from './pushService.js'

export async function triggerNotification({
  type,
  title,
  body = '',
  targetUrl,
  entityId = null,
  entityType = null,
  payload = null,
}) {
  const record = await prisma.notificationEvent.create({
    data: {
      type,
      title,
      body,
      targetUrl,
      entityId,
      entityType,
      payload,
      status: 'pending',
    },
  })

  const result = await notifyAdmins({
    title,
    body,
    url: targetUrl,
    tag: type,
  })

  const status = result.skipped ? 'skipped' : 'sent'
  await prisma.notificationEvent.update({
    where: { id: record.id },
    data: {
      status,
      sentCount: result.sent || 0,
      sentAt: new Date(),
    },
  })

  return { eventId: record.id, ...result }
}

export async function triggerNewOrderNotification(order) {
  const orderId = order.id || order._id
  const trackingNumber = order.trackingNumber || ''
  const title = 'HOK Interiors — New Order'
  const body = `Order ${trackingNumber || '#' + String(orderId).slice(-8)} has been received. Check your admin dashboard.`
  return triggerNotification({
    type: 'NEW_ORDER',
    title,
    body,
    targetUrl: `/admin/orders?orderId=${encodeURIComponent(orderId)}`,
    entityId: orderId,
    entityType: 'order',
    payload: { trackingNumber, total: order.total, status: order.status },
  })
}

export async function triggerNewConsultationNotification(consultation) {
  const consultationId = consultation.id || consultation._id
  const title = 'HOK Interiors — New Consultation'
  const body = 'A new consultation request has been received.'
  return triggerNotification({
    type: 'NEW_CONSULTATION',
    title,
    body,
    targetUrl: `/admin/consultations?viewId=${encodeURIComponent(consultationId)}`,
    entityId: consultationId,
    entityType: 'consultation',
    payload: { type: consultation.type },
  })
}
