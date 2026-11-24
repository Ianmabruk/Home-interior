import { v2 as cloudinary } from 'cloudinary'
import {
  isVideoCloudinaryConfigured,
  assertVideoCloudinaryConfigured,
  uploadVideo as uploadVideoToCloudinary,
  deleteVideo as deleteVideoFromCloudinary,
} from '../services/cloudinaryVideoService.js'

export {
  isVideoCloudinaryConfigured,
  assertVideoCloudinaryConfigured,
  uploadVideoToCloudinary,
  deleteVideoFromCloudinary,
}

export default cloudinary