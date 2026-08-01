import { ApiError } from '../utils/ApiError.js'

export function validateZod(schema, source = 'body') {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : req[source] ?? {}
    const result = schema.safeParse(data)
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.length ? issue.path.join('.') : '_root',
        message: issue.message,
      }))
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      })
    }
    next()
  }
}

export function validateIdParam(req, res, next) {
  if (!req.params.id) {
    return next()
  }
  if (typeof req.params.id !== 'string' || req.params.id.length < 3) {
    throw new ApiError(400, 'Invalid resource id')
  }
  next()
}
