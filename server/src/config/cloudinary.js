import { v2 as cloudinary } from 'cloudinary'
import { env } from './env.js'

const missingVars = []
if (!env.cloudinaryCloudName) missingVars.push('CLOUDINARY_CLOUD_NAME')
if (!env.cloudinaryApiKey) missingVars.push('CLOUDINARY_API_KEY')
if (!env.cloudinaryApiSecret) missingVars.push('CLOUDINARY_API_SECRET')

if (missingVars.length > 0) {
  throw new Error(
    `Cloudinary is not configured. Missing environment variables: ${missingVars.join(', ')}`,
  )
}

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
})

export default cloudinary
