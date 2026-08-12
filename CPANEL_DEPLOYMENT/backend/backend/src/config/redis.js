import { createClient } from 'redis'

const SERVER_ID = process.env.SERVER_ID || 'hok-api-01'
let redisClient = null
let redisAvailable = false

export async function getRedisClient() {
  if (redisClient && redisAvailable) return redisClient

  if (!process.env.REDIS_URL) return null

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
    })

    redisClient.on('error', (err) => {
      console.error(`[${SERVER_ID}] [redis] client error:`, err?.message || err)
      redisAvailable = false
    })

    redisClient.on('connect', () => {
      console.log(`[${SERVER_ID}] [redis] client connected`)
      redisAvailable = true
    })

    await redisClient.connect()
    return redisClient
  } catch (err) {
    console.error(`[${SERVER_ID}] [redis] failed to connect:`, err?.message || err)
    redisClient = null
    redisAvailable = false
    return null
  }
}

export function isRedisAvailable() {
  return redisAvailable && redisClient !== null
}

export async function disconnectRedis() {
  if (redisClient) {
    try {
      await redisClient.disconnect()
    } catch {}
    redisClient = null
    redisAvailable = false
  }
}
