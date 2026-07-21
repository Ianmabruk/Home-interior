export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    if (err instanceof Error && err.message.includes('Prisma')) {
      console.error(`[${req.method}] ${req.originalUrl || req.path} — ${err.message}`)
    }
    next(err)
  })
}
