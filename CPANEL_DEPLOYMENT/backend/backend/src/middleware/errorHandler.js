import { ApiError } from '../utils/ApiError.js'

const SERVER_ID = process.env.SERVER_ID || 'hok-api-01'

export function notFoundHandler(req, res) {
  res.setHeader('X-Server-ID', SERVER_ID)
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` })
}

export function errorHandler(err, req, res, next) {
  if (err?.message?.includes('CORS: origin')) {
    res.setHeader('X-Server-ID', SERVER_ID)
    return res.status(403).json({ success: false, message: 'Not allowed by CORS' })
  }

  if (err?.code === 'LIMIT_FILE_SIZE' || err?.code === 'LIMIT_FILE_COUNT' || err?.code === 'LIMIT_FIELD_COUNT') {
    res.setHeader('X-Server-ID', SERVER_ID)
    return res.status(413).json({ success: false, message: 'Uploaded file is too large' })
  }

  if (err?.name === 'MulterError' && err?.code === 'LIMIT_UNEXPECTED_FILE') {
    res.setHeader('X-Server-ID', SERVER_ID)
    return res.status(400).json({ success: false, message: `Too many files uploaded for field '${err?.field || 'unknown'}'. Maximum limit exceeded.` })
  }

  if (err?.code === 'P2002') {
    res.setHeader('X-Server-ID', SERVER_ID)
    return res.status(409).json({ success: false, message: 'Duplicate value violates a unique constraint' })
  }

  if (err?.code === 'P2025') {
    res.setHeader('X-Server-ID', SERVER_ID)
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

  console.error(`[${SERVER_ID}] [${req.method} ${req.originalUrl}]`, {
    status,
    message: err?.message,
    stack: inProduction ? undefined : err?.stack,
  })

  res.setHeader('X-Server-ID', SERVER_ID)
  res.status(status).json({ success: false, message })
}
