import { useState, useEffect } from 'react'
import { getOptimizedUrl, buildSrcSet } from '../../utils/cloudinaryHelpers'

// Blur placeholder component that shows a low-quality blurred version of the image
// while the full image loads
export function BlurPlaceholder({ 
  src, 
  alt = '', 
  className = '', 
  style,
  width = 400 
}) {
  const [loaded, setLoaded] = useState(false)
  const [blurSrc, setBlurSrc] = useState('')

  useEffect(() => {
    // Generate a tiny blurred version URL for the placeholder
    if (src) {
      const blurUrl = src.includes('cloudinary.com') 
        ? src.replace('/image/upload/', '/image/upload/w_20,f_auto,q_10/')
        : src
      setBlurSrc(blurUrl)
    }
  }, [src])

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {blurSrc && !loaded && (
        <img
          src={blurSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-[20px] scale-110 transition-opacity duration-700 opacity-100"
          style={{ filter: 'blur(20px)' }}
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </div>
  )
}

// Enhanced PositionedImage with blur placeholder support
export function PositionedImageWithBlur({
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
      <div className={`${className} bg-[var(--secondary)]/30`} style={style} role="img" aria-label={alt || 'Image placeholder'} />
    )
  }

  const s = {
    fit: settings?.fit || 'cover',
    position: settings?.position || 'center',
    zoom: settings?.zoom || 100,
  }
  const objectPosition = s.position
  const zoom = s.zoom / 100

  const optimizedSrc = responsive ? getOptimizedUrl(src, { width: 1024, crop: 'limit' }) : src
  const srcSet = responsive ? buildSrcSet(src) : ''

  const imageClass = `${className} transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`

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
        className={imageClass}
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