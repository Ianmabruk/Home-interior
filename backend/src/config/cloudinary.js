import {
  isImageCloudinaryConfigured as isCloudinaryConfigured,
  assertImageCloudinaryConfigured as assertCloudinaryConfigured,
  uploadImage as uploadToCloudinary,
  deleteImage as deleteFromCloudinary,
  deleteManyImages as deleteManyFromCloudinary,
} from '../services/cloudinaryImageService.js'
import imageCloudinary from '../services/cloudinaryImageService.js'

export {
  isCloudinaryConfigured,
  assertCloudinaryConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteManyFromCloudinary,
}

export default imageCloudinary