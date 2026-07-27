import { memo, useState } from 'react'
import { normalizeMediaSettings, positionToObjectPosition } from '../../utils/mediaSettings'
import { getOptimizedUrl, buildSrcSet } from '../../utils/cloudinaryHelpers'

function PositionedImage({
  src,
  alt = '',
  settings,
  className = '',
  style,
  loading = 'lazy',
  draggable = false,
  sizes = '100vw',
  responsive = true,
  blurPlaceholder = true,
  fetchPriority,
}) {
  const [loaded, setLoaded] = useState(false)

  if (!src) {
    return (
      <div className={`${className} bg-[var(--secondary)]/30`} style={style} role="img" aria-label={alt || 'Image placeholder'} />
    )
  }

  const s = normalizeMediaSettings(settings)
  const objectPosition = positionToObjectPosition(s.position)
  const zoom = s.zoom / 100

  const optimizedSrc = responsive ? getOptimizedUrl(src, { width: 960, crop: 'limit' }) : src
  const srcSet = responsive ? buildSrcSet(src) : ''

  return (
    <div className="relative overflow-hidden" style={{ width: '100%', height: '100%', ...style }}>
      {blurPlaceholder && !loaded && (
        <img
          src={src.includes('cloudinary.com')
            ? src.replace('/image/upload/', '/image/upload/w_20,f_auto,q_10/')
            : src}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-[20px] scale-110 transition-opacity duration-700 opacity-100"
          style={{ filter: 'blur(20px)' }}
        />
      )}
      <img
        src={optimizedSrc || src}
        srcSet={srcSet || undefined}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={loading}
        draggable={draggable}
        decoding="async"
        fetchPriority={fetchPriority}
        className={`${className} transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: s.fit,
          objectPosition,
          transform: zoom !== 1 ? `scale(${zoom})` : undefined,
          transformOrigin: objectPosition,
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </div>
  )
}

export default memo(PositionedImage)