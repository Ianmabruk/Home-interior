import { useEffect, useRef } from 'react'
import { getOptimizedVideoUrl } from '@utils/cloudinaryHelpers'

export default function BlogVideo({ src, poster, onPlay, className = '' }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'

    const attemptPlayback = async () => {
      try {
        await video.play()
        if (onPlay) onPlay()
      } catch (err) {
        console.warn('[BlogVideo] Autoplay blocked:', err?.message || err)
        video.controls = true
      }
    }

    // Try to play immediately (for browsers that allow it)
    attemptPlayback()

    // Also try when video metadata is loaded (for browsers that need it)
    const handleCanPlay = () => {
      attemptPlayback()
    }
    video.addEventListener('canplay', handleCanPlay, { once: true })

    // Safari sometimes needs a nudge after initial play attempt
    const handlePlaying = () => {
      video.removeEventListener('playing', handlePlaying)
      // Force a repaint to ensure video isn't stuck on poster
      video.style.opacity = '0.99'
      requestAnimationFrame(() => {
        video.style.opacity = '1'
      })
    }
    video.addEventListener('playing', handlePlaying, { once: true })

    return () => {
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('playing', handlePlaying)
    }
  }, [src, onPlay])

  if (!src) return null

  return (
    <video
      ref={videoRef}
      src={getOptimizedVideoUrl(src, { width: 1280 })}
      poster={poster}
      controls
      playsInline
      preload="metadata"
      muted
      className={`w-full h-full object-contain ${className}`}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      onError={(e) => {
        console.warn('[BlogVideo] Video load error:', e.target.error?.message)
        // Keep video element visible even on error - don't hide it
        const video = e.target
        video.controls = true
        video.style.opacity = '1'
      }}
    >
      Your browser does not support the video tag.
    </video>
  )
}