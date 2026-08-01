import { ApiError } from '../utils/ApiError.js'

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` })
}

export function errorHandler(err, req, res, next) {
  if (err?.message?.includes('CORS: origin')) {
    return res.status(403).json({ success: false, message: 'Not allowed by CORS' })
  }

  if (err?.code === 'LIMIT_FILE_SIZE' || err?.code === 'LIMIT_FILE_COUNT' || err?.code === 'LIMIT_FIELD_COUNT') {
    return res.status(413).json({ success: false, message: 'Uploaded file is too large' })
  }

  if (err?.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'Duplicate value violates a unique constraint' })
  }

  if (err?.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' })
  }

  const isOperational = err instanceof ApiError

  const status = isOperational
    ? err.status
    : (err?.status && err.status >= 400 && err.status < 500 ? err.status : 500)

  const inProduction = process.env.NODE_ENV === 'production'
  const message = inProduction && status >= 500
    ? 'Internal server error'
    : (isOperational ? err.message : (err?.message || 'Internal server error'))

  console.error(`[${req.method} ${req.originalUrl}]`, {
    status,
    message: err?.message,
    stack: inProduction ? undefined : err?.stack,
  })

  res.status(status).json({ success: false, message })
}
