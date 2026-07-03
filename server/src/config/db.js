import mongoose from 'mongoose'
import { env } from './env.js'
import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'

const ensureAdminUser = async () => {
  const existing = await User.findOne({ email: env.seedAdminEmail.toLowerCase() })
  if (existing) return
  const passwordHash = await bcrypt.hash(env.seedAdminPassword, 12)
  await User.create({
    fullName: 'HOK Platform Admin',
    email: env.seedAdminEmail.toLowerCase(),
    role: 'admin',
    isActive: true,
    passwordHash,
  })
}

export const connectDB = async () => {
  if (!env.mongoUri) {
    throw new Error(
      'MONGO_URI is not set. Add it to server/.env before starting the server.',
    )
  }

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 30000,
    family: 4,
  })

  const dbName = mongoose.connection.db.databaseName
  // eslint-disable-next-line no-console
  console.log(`MongoDB Atlas connected — database: ${dbName}`)

  await ensureAdminUser()
}

export const disconnectDB = async () => {
  await mongoose.connection.close()
}
