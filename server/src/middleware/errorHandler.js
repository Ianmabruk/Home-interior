import { ApiError } from '../utils/ApiError.js'

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` })
}

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ message: err.message, details: err.details })
    return
  }

  // Multer / file upload specific errors
  if (err?.name === 'MulterError') {
    res.status(400).json({ message: `Upload error: ${err.message}` })
    return
  }

  console.error('[ERROR]', err)
  res.status(500).json({
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err?.message : undefined,
  })
}
