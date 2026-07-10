import { ApiError } from '../utils/ApiError.js'

export const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` })
}

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ success: false, message: err.message, details: err.details })
    return
  }

  // Multer / file upload specific errors
  if (err?.name === 'MulterError') {
    res.status(400).json({ success: false, message: `Upload error: ${err.message}` })
    return
  }

  console.error('[ERROR]', err)

  // Map known Prisma error codes to a human-readable message so the client
  // (admin UI) shows the real cause instead of a blind "Internal server error"
  // (e.g. a missing migration column). No stack traces or raw SQL are leaked.
  const PRISMA_CODES = {
    P2021: 'table does not exist (pending migration?)',
    P2022: 'column does not exist (pending migration?)',
    P2002: 'unique constraint violation',
    P2003: 'foreign key constraint violation',
  }
  const code = err?.code
  const message = code && PRISMA_CODES[code]
    ? `Database error (${code}): ${PRISMA_CODES[code]}`
    : 'Internal server error'

  res.status(500).json({
    success: false,
    message,
    error: err?.name,
    code,
    details: process.env.NODE_ENV === 'development' ? err?.message : undefined,
  })
}
