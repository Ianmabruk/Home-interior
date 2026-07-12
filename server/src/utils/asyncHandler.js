export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error('[API ERROR] Route:', req.originalUrl || req.path)
    console.error('FULL ERROR:', err)
    console.error('MESSAGE:', err.message)
    console.error('STACK:', err.stack)
    console.error('PRISMA CODE:', err.code)
    console.error('BODY:', req.body)
    console.error('PARAMS:', req.params)
    console.error('QUERY:', req.query)
    next(err)
  })
}
