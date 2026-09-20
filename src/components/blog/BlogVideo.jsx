import { useEffect, useRef } from 'react'
import { getOptimizedVideoUrl, getVideoPosterUrl } from '@utils/cloudinaryHelpers'

export default function BlogVideo({ src, poster, onPlay, className = '' }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'

    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (onPlay) onPlay()
        })
        .catch((err) => {
          console.warn('[BlogVideo] Autoplay blocked:', err?.message || err)
          video.controls = true
        })
    }
  }, [src, onPlay])

  if (!src) return null

  return (
    <video
      ref={videoRef}
      src={getOptimizedVideoUrl(src, { width: 1280 })}
      poster={poster ? getVideoPosterUrl(poster) : undefined}
      controls
      playsInline
      preload="metadata"
      muted
      autoPlay
      className={`w-full h-full object-contain ${className}`}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      onError={(e) => {
        console.warn('[BlogVideo] Video load error:', e.target.error?.message)
      }}
    >
      Your browser does not support the video tag.
    </video>
  )
}