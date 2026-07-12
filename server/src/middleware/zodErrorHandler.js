import { ApiError } from '../utils/ApiError.js'

export const zodErrorHandler = (err, req, res, next) => {
  if (err?.name === 'ZodError' || Array.isArray(err?.issues)) {
    // Zod v4 exposes `.issues` (the legacy `.errors` alias was removed), so
    // read from issues to surface the real field-level validation messages
    // instead of a generic "Validation error".
    const issues = err.issues || err.errors || []
    const message = issues.map((e) => {
      const path = Array.isArray(e.path) && e.path.length ? `${e.path.join('.')}: ` : ''
      return `${path}${e.message}`
    }).join(', ') || 'Validation error'
    return res.status(400).json({ success: false, message, details: issues })
  }
  const plainError = err instanceof Error ? err : new Error(String(err))
  next(plainError)
}
