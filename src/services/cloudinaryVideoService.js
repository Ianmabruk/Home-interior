import { mediaService } from './mediaService'

export function uploadOptimizedVideo(file, contentHash, handlers = {}) {
  if (!file) throw new Error('No optimized video is available')
  return mediaService.uploadPreparedVideo(
    file,
    handlers.folder || 'blogs',
    {
      size: handlers.originalBytes ?? file.size,
      name: handlers.originalName || file.name || 'video.mp4',
    },
    contentHash,
    handlers,
  )
}
