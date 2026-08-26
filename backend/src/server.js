import dotenv from 'dotenv'
dotenv.config({ override: false })
import { app } from './app.js'
import { validateEnv } from './config/env.js'
import { prisma, connectDatabase } from './config/database.js'
import { uploadToCloudinary } from './config/cloudinary.js'
import cloudinary from './config/cloudinary.js'
import { isSupabaseConfigured } from './config/supabase.js'
import { getRedisClient, disconnectRedis } from './config/redis.js'
import { env } from './config/env.js'
import { initPush } from './services/pushService.js'
import fs from 'fs'
import path from 'path'
import { CIRCULAR_TAB_DEFINITIONS } from './constants/circularTabs.js'

const SERVER_ID = process.env.SERVER_ID || 'hok-api-01'
const log = {
  info: (msg) => console.log(`[${SERVER_ID}] ${msg}`),
  warn: (msg) => console.warn(`[${SERVER_ID}] ${msg}`),
  error: (msg) => console.error(`[${SERVER_ID}] ${msg}`),
}

validateEnv()

if (process.env.NODE_ENV !== 'production') {
  const uploadsDir = path.join(process.cwd(), 'uploads')
  const subDirs = ['portfolio', 'products', 'services', 'virtual-designs', 'testimonials', 'about', 'consultations']
  for (const dir of subDirs) {
    fs.mkdirSync(path.join(uploadsDir, dir), { recursive: true })
  }
}

const PORT = process.env.PORT || 10000

let server = null
let isShuttingDown = false

async function start() {
  try {
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET && isSupabaseConfigured()) {
      log.warn('Both Cloudinary and Supabase are configured. Cloudinary will be used for uploads. Remove SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY if you want to use Supabase.')
    }
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      log.info(`Cloudinary configured (cloud: ${process.env.CLOUDINARY_CLOUD_NAME}). Uploads will use Cloudinary.`)
    } else if (isSupabaseConfigured()) {
      log.info('Supabase configured. Uploads will use Supabase Storage.')
    } else {
      log.warn('No permanent object storage configured. Uploads will fail in production.')
    }
  } catch (err) {
    log.error('Startup check failed: ' + (err?.message || err))
  }

  try {
    await connectDatabase()
    log.info('Database connected')
  } catch (err) {
    log.error('Database connection failed: ' + (err?.message || err))
  }

  if (initPush()) {
    log.info('Web Push initialized (VAPID configured)')
  } else {
    log.warn('Web Push NOT initialized — set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to enable admin push notifications')
  }

  if (process.env.REDIS_URL) {
    try {
      await getRedisClient()
    } catch (err) {
      log.warn('Redis connection failed: ' + (err?.message || err))
    }
  }

  try {
    const adminCount = await prisma.admin.count()
    if (adminCount === 0) {
      const adminEmail = env.adminEmail || 'info@hokinteriors.co.ke'
      const adminPassword = env.adminPassword
      if (!adminPassword) {
        log.warn('No ADMIN_PASSWORD / SEED_ADMIN_PASSWORD set — skipping default admin creation. Set ADMIN_PASSWORD to create one.')
      } else {
        const passwordHash = await bcrypt.hash(adminPassword, 12)
        await prisma.admin.create({
          data: {
            email: adminEmail,
            passwordHash,
            fullName: 'Admin',
            role: 'ADMIN',
          },
        })
        log.info('Default admin account created (email: ' + adminEmail + ')')
      }
    } else {
      log.info('Admin accounts already exist — skipping auto-seed')
    }
  } catch (err) {
    log.warn('Auto-seed admin failed: ' + (err?.message || err))
  }

  try {
    for (const tab of CIRCULAR_TAB_DEFINITIONS) {
      const existing = await prisma.circularTab.findUnique({ where: { key: tab.key } })
      if (!existing) {
        await prisma.circularTab.create({ data: tab })
        log.info(`Circular tab '${tab.key}' created`)
      }
    }
  } catch (err) {
    log.warn('Auto-seed circular tabs failed: ' + (err?.message || err))
  }

  try {
    server = app.listen(PORT, () => {
      log.info(`Backend server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`)
      log.info(`Server ID: ${SERVER_ID}`)
    })
  } catch (err) {
    log.error('Failed to start HTTP server: ' + (err?.message || err))
  }

  server.on('error', (err) => {
    log.error('Server error: ' + (err?.message || err))
  })
 }

async function gracefulShutdown(signal) {
  if (isShuttingDown) return
  isShuttingDown = true
  log.info(`Received ${signal}, shutting down gracefully...`)

  if (server) {
    server.close(() => {
      log.info('HTTP server closed')
    })

    const shutdownTimeout = setTimeout(() => {
      log.error('Forced shutdown due to timeout')
      process.exit(1)
    }, 30000)

    server.on('close', () => {
      clearTimeout(shutdownTimeout)
    })
  }

  try {
    await prisma.$disconnect()
    log.info('Database disconnected')
  } catch (err) {
    log.error('Database disconnect error: ' + (err?.message || err))
  }

  try {
    await disconnectRedis()
    log.info('Redis disconnected')
  } catch (err) {
    log.error('Redis disconnect error: ' + (err?.message || err))
  }

  process.exit(0)
}

start().catch((err) => {
  log.error('Failed to start server: ' + (err?.message || err))
  process.exit(1)
})

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
