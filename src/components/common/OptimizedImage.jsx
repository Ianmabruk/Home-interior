import React, { useState } from 'react'
import { getOptimizedUrlAutoDpr, buildSrcSet, getPlaceholderUrl } from '../../utils/cloudinaryHelpers'

export default function OptimizedImage({ src, alt = '', className = '', sizes, width, height, loading = 'lazy', priority = false, style = {} }) {
  const [loaded, setLoaded] = useState(false)

  if (!src) return <div className={className} style={{ width, height, background: 'var(--secondary)', ...style }} />

  const optimized = getOptimizedUrlAutoDpr(src, { width: width || 800, crop: 'limit' })
  const srcSet = buildSrcSet(src) || undefined
  const placeholder = getPlaceholderUrl(src, { width: 40 })

  return (
    <div style={{ position: 'relative', width: width || '100%', height: height || 'auto', ...style }} className={className}>
      {!loaded && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(16px)', transform: 'scale(1.05)' }}
        />
      )}
      <img
        src={optimized}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={priority ? 'eager' : loading}
        decoding="async"
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity 600ms ease' }}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}
