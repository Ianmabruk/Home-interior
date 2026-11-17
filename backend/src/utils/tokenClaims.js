export function getTokenType(decoded = {}) {
  if (!decoded || typeof decoded !== 'object') return null

  const normalizedType = decoded.type || decoded.tokenType
  if (normalizedType === 'admin' || normalizedType === 'customer') {
    return normalizedType
  }

  if (decoded.role === 'ADMIN' || decoded.role === 'admin') return 'admin'
  if (decoded.role === 'CUSTOMER' || decoded.role === 'customer') return 'customer'
  if (decoded.adminId) return 'admin'
  if (decoded.userId || decoded.customerId) return 'customer'

  return null
}

export function getTokenSubject(decoded = {}) {
  if (!decoded || typeof decoded !== 'object') return null

  const candidates = [decoded.sub, decoded.id, decoded.adminId, decoded.userId, decoded.customerId]
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value
  }

  const legacyRole = decoded.role
  if (legacyRole && (decoded.id || decoded.userId || decoded.adminId || decoded.sub)) {
    return decoded.id || decoded.userId || decoded.adminId || decoded.sub
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
