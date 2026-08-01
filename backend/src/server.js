import 'dotenv/config'
import { app } from './app.js'
import { validateEnv } from './config/env.js'
import { prisma, connectDatabase } from './config/database.js'
import { uploadToCloudinary } from './config/cloudinary.js'
import cloudinary from './config/cloudinary.js'
import { isSupabaseConfigured } from './config/supabase.js'
import fs from 'fs'
import path from 'path'

validateEnv()

const uploadsDir = path.join(process.cwd(), 'uploads')
const subDirs = ['portfolio', 'products', 'services', 'virtual-designs', 'testimonials', 'about', 'consultations']
for (const dir of subDirs) {
  fs.mkdirSync(path.join(uploadsDir, dir), { recursive: true })
}

const PORT = process.env.PORT || 10000

let server = null

async function start() {
  try {
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET && isSupabaseConfigured()) {
      console.warn('[WARNING] Both Cloudinary and Supabase are configured. Cloudinary will be used for uploads. Remove SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY if you want to use Supabase.')
    }
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        await new Promise((resolve, reject) => {
          cloudinary.api.ping((error) => {
            if (error) reject(error)
            else resolve()
          })
        })
        console.log(`Cloudinary connected (cloud: ${process.env.CLOUDINARY_CLOUD_NAME})`)
      } catch (err) {
        console.error('Cloudinary ping failed:', err?.message || err)
        console.error('Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET')
      }
    }
  } catch (err) {
    console.error('Startup check failed:', err)
  }

  try {
    await connectDatabase()
    console.log('Database connected')
  } catch (err) {
    console.error('Database connection failed:', err?.message || err)
  }

  server = app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`)
  })

  server.on('error', (err) => {
    console.error('Server error:', err)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...')
  if (server) server.close()
  try { await prisma.$disconnect() } catch {}
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...')
  if (server) server.close()
  try { await prisma.$disconnect() } catch {}
  process.exit(0)
})
