import 'dotenv/config'
import { app } from './app.js'
import { validateEnv } from './config/env.js'
import { prisma } from './config/database.js'
import { cloudinary, uploadToCloudinary } from './config/cloudinary.js'
import fs from 'fs'
import path from 'path'

validateEnv()

const uploadsDir = path.join(process.cwd(), 'uploads')
const subDirs = ['portfolio', 'products', 'services', 'virtual-designs', 'testimonials', 'about', 'consultations']
for (const dir of subDirs) {
  fs.mkdirSync(path.join(uploadsDir, dir), { recursive: true })
}

const PORT = process.env.PORT || 5000

async function start() {
  try {
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.api.ping((error, result) => {
            if (error) reject(error)
            else resolve(result)
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

  const server = app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`)
  })
}

start()

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...')
  server.close()
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...')
  server.close()
  await prisma.$disconnect()
  process.exit(0)
})

export default server
