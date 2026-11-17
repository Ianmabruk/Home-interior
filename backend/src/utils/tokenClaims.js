export function getTokenType(decoded = {}) {
  if (!decoded || typeof decoded !== 'object') return null

  const normalizedType = decoded.type || decoded.tokenType
  if (normalizedType === 'admin' || normalizedType === 'customer') {
    return normalizedType
  }

  if (decoded.adminId) return 'admin'
  if (decoded.userId || decoded.customerId) return 'customer'

  return null
}

export function getTokenSubject(decoded = {}) {
  if (!decoded || typeof decoded !== 'object') return null

  const candidates = [decoded.sub, decoded.adminId, decoded.userId, decoded.customerId, decoded.id]
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value
  }

  return null
}

export function buildTokenPayload({ id, email, role, type }) {
  const normalizedType = type === 'admin' ? 'admin' : 'customer'
  const payload = {
    sub: id,
    email,
    role,
    type: normalizedType,
  }

  if (normalizedType === 'admin') {
    payload.adminId = id
  } else {
    payload.userId = id
  }

  return payload
}
