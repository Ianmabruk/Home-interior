export const cacheHeaders = (maxAge = 60, staleWhileRevalidate = 30) => (req, res, next) => {
  if (req.method !== 'GET') {
    return next()
  }
  const isAuthed = Boolean(req.admin)
  const policy = isAuthed
    ? `private, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
    : `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  res.setHeader('Cache-Control', policy)
  next()
}
