import { getOptimizedUrlAutoDpr, buildSrcSet } from '../../utils/cloudinaryHelpers'

export default function OptimizedImage({ src, alt = '', className = '', sizes, width, height, loading = 'lazy', priority = false, style = {}, objectPosition = 'center', objectFit = 'cover' }) {
  if (!src) return <div className={className} style={{ background: 'var(--secondary)', ...style }} />

  const optimized = getOptimizedUrlAutoDpr(src, { width: width || 800, crop: 'limit' })
  const srcSet = buildSrcSet(src) || undefined

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...style }} className={className}>
      <img
        src={optimized}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={priority ? 'eager' : loading}
        decoding="async"
        style={{ width: '100%', height: '100%', objectFit, objectPosition, display: 'block' }}
      />
    </div>
  )
}
