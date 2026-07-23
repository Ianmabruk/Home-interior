export const cacheHeaders = (maxAge = 60, staleWhileRevalidate = 30) => (req, res, next) => {
  if (req.method !== 'GET') {
    return next()
  }
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`)
  next()
}
