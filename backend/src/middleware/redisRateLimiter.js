import { getRedisClient, isRedisAvailable } from '../config/redis.js'

const SERVER_ID = process.env.SERVER_ID || 'hok-api-01'
const inMemoryStore = new Map()

function getInMemoryKey(key) {
  const now = Date.now()
  const record = inMemoryStore.get(key)
  if (!record || now > record.resetTime) {
    return { count: 0, resetTime: now + 60000 }
  }
  return record
}

async function getRedisKey(key) {
  const client = await getRedisClient()
  if (!client) return null

  const data = await client.get(key)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

async function setRedisKey(key, value, ttlMs) {
  const client = await getRedisClient()
  if (!client) return false
  try {
    await client.setEx(key, Math.ceil(ttlMs / 1000), JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60000
  const limit = options.limit || 120
  const keyPrefix = options.keyPrefix || 'rl'

  return async function rateLimiter(req, res, next) {
    const clientIdentifier = req.ip || req.connection.remoteAddress || 'unknown'
    const key = `${keyPrefix}:${clientIdentifier}`

    if (isRedisAvailable()) {
      const record = await getRedisKey(key)
      const now = Date.now()
      let current = { count: 0, resetTime: now + windowMs }

      if (record && now < record.resetTime) {
        current = record
      }

      current.count += 1

       if (current.count > limit) {
         const retryAfter = Math.ceil((current.resetTime - now) / 1000)
         res.setHeader('Retry-After', String(retryAfter))
         res.setHeader('X-Server-ID', SERVER_ID)
         return res.status(429).json({ success: false, message: 'Too many requests, please try again later.' })
       }

    res.setHeader('X-Server-ID', SERVER_ID)
    res.setHeader('X-RateLimit-Limit', String(limit))
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - current.count)))
    return next()
    }

    const mem = getInMemoryKey(key)
    mem.count += 1
    inMemoryStore.set(key, mem)

    if (mem.count > limit) {
      const retryAfter = Math.ceil((mem.resetTime - Date.now()) / 1000)
      res.setHeader('Retry-After', String(retryAfter))
      res.setHeader('X-Server-ID', SERVER_ID)
      return res.status(429).json({ success: false, message: 'Too many requests, please try again later.' })
    }

    res.setHeader('X-Server-ID', SERVER_ID)
    res.setHeader('X-RateLimit-Limit', String(limit))
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - mem.count)))
    next()
  }
}
