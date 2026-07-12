import { ApiError } from '../utils/ApiError.js'

export const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` })
}

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      route: req.originalUrl || req.path,
      message: err.message,
      details: err.details,
    })
    return
  }

  if (err?.name === 'MulterError') {
    res.status(400).json({
      success: false,
      route: req.originalUrl || req.path,
      message: `Upload error: ${err.message}`,
    })
    return
  }

  console.error('[500 ERROR] Route:', req.originalUrl || req.path)
  console.error('FULL ERROR:', err)
  console.error('MESSAGE:', err.message)
  console.error('STACK:', err.stack)
  console.error('PRISMA CODE:', err.code)
  console.error('BODY:', req.body)
  console.error('PARAMS:', req.params)
  console.error('QUERY:', req.query)

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
    route: req.originalUrl || req.path,
    error: message,
    rawMessage: err?.message,
    code,
    stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
  })
}
