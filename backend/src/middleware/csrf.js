import crypto from 'crypto'

const csrfStore = new Map()

export function generateCsrfToken() {
  const token = crypto.randomBytes(32).toString('hex')
  csrfStore.set(token, Date.now())
  return token
}

export function validateCsrfToken(req, res, next) {
  const headerToken = req.headers['x-csrf-token']

  if (!headerToken) {
    return res.status(403).json({ success: false, message: 'Missing CSRF token' })
  }

  const stored = csrfStore.get(headerToken)
  if (!stored) {
    return res.status(403).json({ success: false, message: 'Invalid CSRF token' })
  }

  next()
}

setInterval(() => {
  const now = Date.now()
  for (const [token, timestamp] of csrfStore) {
    if (now - timestamp > 3600000) {
      csrfStore.delete(token)
    }
  }
}, 60000)
