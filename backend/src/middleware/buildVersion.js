import crypto from 'crypto'

let cachedVersion = null

export function getBuildVersion() {
  if (cachedVersion) return cachedVersion
  let version = process.env.HOK_BUILD_VERSION || process.env.BUILD_VERSION
  if (!version) {
    try {
      version = crypto
        .createHash('sha1')
        .update(`${process.env.NODE_ENV || 'dev'}:${Date.now()}`)
        .digest('hex')
        .substring(0, 8)
    } catch {
      version = 'dev'
    }
  }
  cachedVersion = version
  return cachedVersion
}

export function buildVersionMiddleware(req, res, next) {
  res.setHeader('X-HOK-Build-Version', getBuildVersion())
  next()
}
