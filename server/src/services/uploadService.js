import streamifier from 'streamifier'
import cloudinary from '../config/cloudinary.js'
import { ApiError } from '../utils/ApiError.js'

export const uploadToCloudinary = async (fileBuffer, folder, resourceType = 'image') => {
  if (!fileBuffer) {
    throw new ApiError(400, 'No file buffer provided')
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(new ApiError(500, 'Cloudinary upload failed', error))
          return
        }
        resolve(result)
      },
    )

    streamifier.createReadStream(fileBuffer).pipe(uploadStream)
  })
}
