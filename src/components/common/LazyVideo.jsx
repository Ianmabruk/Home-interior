import { useEffect, useRef, useState, useCallback } from 'react'
import { useReducedMotion } from '@components/common/DynamicMotion'

export default function LazyVideo({
  src,
  poster,
  className = '',
  eager = false,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  controls = false,
  preload = 'metadata',
}) {
  const videoRef = useRef(null)
  const [hasError, setHasError] = useState(false)
  const [canPlay, setCanPlay] = useState(false)
  const reducedMotion = useReducedMotion()
  const shouldAutoPlay = autoPlay && !reducedMotion && muted && playsInline

  const attemptPlay = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    try {
      await video.play()
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.debug('[LazyVideo] Autoplay prevented:', err.message)
      }
    }
  }, [])

  const onCanPlay = useCallback(() => {
    setCanPlay(true)
    if (shouldAutoPlay) {
      attemptPlay()
    }
  }, [shouldAutoPlay, attemptPlay])

  const onPlay = useCallback(() => {}, [])
  const onPause = useCallback(() => {}, [])
  const onError = useCallback(() => {
    setHasError(true)
  }, [])

  const onEnded = useCallback(() => {
    if (loop) {
      attemptPlay()
    }
  }, [loop, attemptPlay])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = muted
    video.playsInline = playsInline
    video.loop = loop
    video.preload = preload
  }, [muted, playsInline, loop, preload])

  useEffect(() => {
    if (!shouldAutoPlay && !canPlay) return
    const video = videoRef.current
    if (!video) return

    if (eager && canPlay) {
      if (muted) video.muted = true
      attemptPlay()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (muted) video.muted = true
          if (canPlay) {
            attemptPlay()
          }
        } else {
          video.pause()
        }
      },
      { rootMargin: '150px 0px' },
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [shouldAutoPlay, canPlay, muted, attemptPlay, eager])

  if (!src) return null

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--secondary)]/20 text-[var(--primary)]/50 ${className}`}
        style={{ width: '100%', height: '100%' }}
      >
        Video unavailable
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      className={className}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      controls={controls}
      preload={preload}
      onCanPlay={onCanPlay}
      onPlay={onPlay}
      onPause={onPause}
      onError={onError}
      onEnded={onEnded}
      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
    />
  )
}
