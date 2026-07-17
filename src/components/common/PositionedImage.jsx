import { memo, useState } from 'react'
import { normalizeMediaSettings, positionToObjectPosition } from '../../utils/mediaSettings'
import { getOptimizedUrl, buildSrcSet } from '../../utils/cloudinaryHelpers'

// Renders an image exactly as configured in the admin media controls:
// object-fit, object-position, and a scale transform for zoom. The image
// fills its parent container, so callers should wrap it in a sized,
// overflow-hidden element (e.g. <div className="h-44 w-full overflow-hidden">).
//
// For Cloudinary sources it also emits a responsive `srcset` (f_auto,q_auto
// width variants) so mobile devices download a small image instead of the
// full-resolution master. `sizes` defaults to full viewport width; pass a
// tighter value (e.g. "(min-width:1024px) 33vw, 50vw") for grid tiles.
//
// Supports blur placeholder: shows a tiny blurred version while loading.
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
}) {
  const [loaded, setLoaded] = useState(false)

  if (!src) {
    return (
      <div className={`${className} bg-sand`} style={style} role="img" aria-label={alt || 'Image placeholder'} />
    )
  }

  const s = normalizeMediaSettings(settings)
  const objectPosition = positionToObjectPosition(s.position)
  const zoom = s.zoom / 100

  const optimizedSrc = responsive ? getOptimizedUrl(src, { width: 1024, crop: 'limit' }) : src
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
