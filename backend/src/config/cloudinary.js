import { v2 as cloudinary } from 'cloudinary'

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

const isConfigured = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)

if (isConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  })
}

export const uploadToCloudinary = async (buffer, mimetype, folder) => {
  if (!isConfigured) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.')
  }
  const ext = mimetype.split('/')[1] || 'bin'
  const publicId = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}`

  try {
    const result = await new Promise((resolve, reject) => {
       cloudinary.uploader.upload_stream(
         {
           resource_type: 'auto',
           folder,
           public_id: publicId,
           overwrite: false,
           quality: 'auto:good',
           fetch_format: 'auto',
           transformation: [
             { width: 2048, crop: 'limit' },
             { quality: 'auto:good' },
             { fetch_format: 'auto' },
           ],
         },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary] Upload stream error:', {
              message: error.message,
              http_code: error.http_code,
              name: error.name,
            })
            reject(error)
          } else {
            resolve(result)
          }
        }
      ).end(buffer)
    })

    return {
      url: result.secure_url,
      publicId: result.public_id,
      mimeType: mimetype,
    }
  } catch (err) {
    console.error('[Cloudinary] Upload failed:', {
      message: err?.message,
      http_code: err?.http_code,
      name: err?.name,
      folder,
      mimetype,
      bufferLength: buffer?.length || buffer?.byteLength || 'unknown',
    })
    throw err
  }
}

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId || !isConfigured) return
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' })
  } catch (error) {
    console.error('Cloudinary delete error:', error)
  }
}

export const deleteManyFromCloudinary = async (publicIds) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) return
  await Promise.allSettled(publicIds.map(deleteFromCloudinary))
}

export default cloudinary
