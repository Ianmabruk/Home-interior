import { useState } from 'react'
import { getOptimizedUrlAutoDpr, buildSrcSet } from '../../utils/cloudinaryHelpers'

export default function OptimizedImage({ src, alt = '', className = '', sizes, width, loading = 'lazy', priority = false, style = {}, objectPosition = 'center', objectFit = 'cover' }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-[var(--secondary)]/20 text-[var(--primary)]/30 ${className}`}
        style={style}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      </div>
    )
  }

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
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit, objectPosition, display: 'block' }}
      />
    </div>
  )
}
