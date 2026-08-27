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

export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60000
  const limit = options.limit || 120
  const keyPrefix = options.keyPrefix || 'rl'

  return async function rateLimiter(req, res, next) {
    const clientIdentifier = req.ip || req.connection.remoteAddress || 'unknown'
    const key = `${keyPrefix}:${clientIdentifier}`
    const now = Date.now()
    const resetTime = now + windowMs

    if (isRedisAvailable()) {
      try {
        const client = await getRedisClient()
        if (client) {
          const data = await client.get(key)
          let current = { count: 0, resetTime }
          if (data) {
            try { current = JSON.parse(data) } catch { current = { count: 0, resetTime } }
          }
          if (now > current.resetTime) {
            current = { count: 0, resetTime }
          }
          current.count += 1

          if (current.count > limit) {
            const retryAfter = Math.ceil((current.resetTime - now) / 1000)
            res.setHeader('Retry-After', String(retryAfter))
            res.setHeader('X-Server-ID', SERVER_ID)
            return res.status(429).json({ success: false, message: 'Too many requests, please try again later.' })
          }

          const ttl = Math.max(1, Math.ceil((current.resetTime - now) / 1000))
          await client.setEx(key, ttl, JSON.stringify(current))

          res.setHeader('X-Server-ID', SERVER_ID)
          res.setHeader('X-RateLimit-Limit', String(limit))
          res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - current.count)))
          return next()
        }
      } catch (err) {
        console.warn(`[${SERVER_ID}] [rateLimiter] Redis error, falling back to in-memory:`, err?.message)
      }
    }

    const mem = getInMemoryKey(key)
    if (now > mem.resetTime) {
      mem.count = 0
      mem.resetTime = resetTime
    }
    mem.count += 1
    inMemoryStore.set(key, mem)

    if (mem.count > limit) {
      const retryAfter = Math.ceil((mem.resetTime - now) / 1000)
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

// Clean up expired in-memory rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of inMemoryStore) {
    if (now > record.resetTime) {
      inMemoryStore.delete(key)
    }
  }
}, 300000)
