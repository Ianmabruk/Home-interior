import 'dotenv/config'
import { app } from './app.js'
import { validateEnv } from './config/env.js'
import { prisma } from './config/database.js'
import fs from 'fs'
import path from 'path'

validateEnv()

const uploadsDir = path.join(process.cwd(), 'uploads')
const subDirs = ['portfolio', 'products', 'services', 'virtual-designs', 'testimonials', 'about', 'consultations']
for (const dir of subDirs) {
  fs.mkdirSync(path.join(uploadsDir, dir), { recursive: true })
}

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`)
})

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
