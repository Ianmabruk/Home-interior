import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import crypto from 'crypto'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { env } from './config/env.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'
import routes from './routes/index.js'
import { createRateLimiter } from './middleware/redisRateLimiter.js'
import { getRedisClient, isRedisAvailable } from './config/redis.js'

dotenv.config()

export const app = express()

const SERVER_ID = process.env.SERVER_ID || 'hok-api-01'

app.set('trust proxy', 1)
app.use(compression())
app.use(helmet())
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  }),
)
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }))
app.use(helmet.crossOriginEmbedderPolicy({ policy: false }))
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }))
app.use(morgan((tokens, req, res) => {
  return [
    `[${SERVER_ID}]`,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'),
    '-',
    tokens['response-time'](req, res),
    'ms'
  ].join(' ')
}))
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://hokinteriors.com',
  'https://www.hokinteriors.com',
  'https://homy-comfy.netlify.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
].filter(Boolean)

const isAllowedOrigin = (origin) => {
  if (!origin) return true
  if (allowedOrigins.includes(origin)) return true
  const wildcards = ['*.netlify.app', '*.vercel.app', '*.onrender.com']
  return wildcards.some((pattern) => {
    const suffix = pattern.replace('*', '')
    return origin.endsWith(suffix)
  })
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true)
      return callback(new Error(`CORS: origin ${origin} not allowed`), false)
    },
    credentials: true,
  }),
)

app.use((req, res, next) => {
  if (req.body === undefined || req.body === null) req.body = {}
  next()
})

app.use(
  '/api',
  createRateLimiter({
    windowMs: 1000 * 60,
    limit: 120,
    keyPrefix: 'rl:api',
  }),
)

const authLimiter = createRateLimiter({
  windowMs: 1000 * 60 * 15,
  limit: 20,
  keyPrefix: 'rl:auth',
})
app.use('/api/auth', authLimiter)

app.use((req, res, next) => {
  res.setHeader('X-Server-ID', process.env.SERVER_ID || 'hok-api-01')
  next()
})

app.use((req, res, next) => {
  res.setHeader('X-Request-ID', crypto.randomUUID())
  next()
})

import { prisma } from './config/database.js'

app.get(['/api/health', '/health'], async (req, res) => {
  let database = 'error'
  try {
    await prisma.$queryRaw`SELECT 1`
    database = 'ok'
  } catch (err) {
    console.error(`[${SERVER_ID}] [health] database check failed:`, err?.message || err)
  }
  res.setHeader('X-Server-ID', SERVER_ID)
  res.json({ database, server: 'running' })
})

app.get(['/api/ready', '/ready'], async (req, res) => {
  let database = 'error'
  let cache = 'not-configured'
  try {
    await prisma.$queryRaw`SELECT 1`
    database = 'ok'
  } catch (err) {
    console.error(`[${SERVER_ID}] [ready] database check failed:`, err?.message || err)
  }
  try {
    if (process.env.REDIS_URL) {
      const client = await getRedisClient()
      if (client && isRedisAvailable()) {
        await client.ping()
        cache = 'ok'
      } else {
        cache = 'error'
      }
    }
  } catch (err) {
    cache = 'error'
    console.error(`[${SERVER_ID}] [ready] cache check failed:`, err?.message || err)
  }
  res.setHeader('X-Server-ID', SERVER_ID)
  const ready = database === 'ok' && (cache === 'ok' || cache === 'not-configured')
  res.status(ready ? 200 : 503).json({ database, cache, server: 'running', ready })
})

app.use('/uploads', express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'uploads')))

app.use('/api', routes)

app.use(notFoundHandler)
app.use(errorHandler)
