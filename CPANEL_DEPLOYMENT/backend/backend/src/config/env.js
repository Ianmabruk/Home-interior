import dotenv from 'dotenv'

dotenv.config({ override: false })

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  clientUrl: process.env.CLIENT_URL || '',
  serverId: process.env.SERVER_ID || 'hok-api-01',
  redisUrl: process.env.REDIS_URL || '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '30d',
  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL,
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD,
}

export function validateEnv() {
  const missing = []
  if (!env.jwtAccessSecret) missing.push('JWT_ACCESS_SECRET')
  if (!env.jwtRefreshSecret) missing.push('JWT_REFRESH_SECRET')
  if (!env.databaseUrl) missing.push('DATABASE_URL')
  const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!hasCloudinary && !hasSupabase) {
    missing.push('Either CLOUDINARY_* or SUPABASE_* environment variables for file storage')
  }
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (env.jwtAccessSecret && env.jwtAccessSecret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters')
  }
  if (env.jwtRefreshSecret && env.jwtRefreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters')
  }

  if (env.databaseUrl && process.env.NODE_ENV === 'production') {
    const dbHost = new URL(env.databaseUrl).hostname
    if (dbHost.includes('summer-fog')) {
      console.warn(`[${env.serverId}] [WARNING] Using development database URL in production. Update DATABASE_URL in Render dashboard.`)
    }
  }
}
