import {
  isVideoCloudinaryConfigured,
  assertVideoCloudinaryConfigured,
  uploadVideo as uploadVideoToCloudinary,
  deleteVideo as deleteVideoFromCloudinary,
} from '../services/cloudinaryVideoService.js'
import videoCloudinary from '../services/cloudinaryVideoService.js'

export {
  isVideoCloudinaryConfigured,
  assertVideoCloudinaryConfigured,
  uploadVideoToCloudinary,
  deleteVideoFromCloudinary,
}

export default videoCloudinary