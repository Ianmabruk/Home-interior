import crypto from 'crypto'

const TTL_MS = 60 * 60 * 1000 // 1 hour
const CSRF_SECRET = process.env.JWT_ACCESS_SECRET

export function generateCsrfToken() {
  if (!CSRF_SECRET) {
    throw new Error('JWT_ACCESS_SECRET is required to generate CSRF tokens')
  }
  const issuedAt = Date.now()
  const nonce = crypto.randomBytes(32).toString('hex')
  const payload = `v1.${issuedAt}.${nonce}`
  const signature = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex')
  return `${payload}.${signature}`
}

function isValidSignedToken(token) {
  if (!CSRF_SECRET || typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 4 || parts[0] !== 'v1') return false
  const [, issuedAtText, nonce, signature] = parts
  const issuedAt = Number(issuedAtText)
  if (
    !Number.isSafeInteger(issuedAt)
    || !/^[a-f0-9]{64}$/.test(nonce)
    || !/^[a-f0-9]{64}$/.test(signature)
    || issuedAt > Date.now()
    || Date.now() - issuedAt > TTL_MS
  ) {
    return false
  }
  const payload = `v1.${issuedAtText}.${nonce}`
  const expected = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest()
  const received = Buffer.from(signature, 'hex')
  return crypto.timingSafeEqual(expected, received)
}

export async function validateCsrfToken(req, res, next) {
  if (process.env.NODE_ENV === 'test') {
    return next()
  }

  const headerToken = req.headers['x-csrf-token']

  if (!headerToken) {
    return res.status(403).json({ success: false, message: 'Missing CSRF token' })
  }

  if (!isValidSignedToken(headerToken)) {
    return res.status(403).json({ success: false, message: 'Invalid or expired CSRF token' })
  }

  return next()
}
