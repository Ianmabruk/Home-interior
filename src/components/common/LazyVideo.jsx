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
  const [_isLoaded, setIsLoaded] = useState(false)
  const [_hasError, setHasError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const reducedMotion = useReducedMotion()
  const shouldAutoPlay = autoPlay && !reducedMotion && muted && playsInline

  const attemptPlay = useCallback(async () => {
    const video = videoRef.current
    if (!video || isPlaying) return

    try {
      await video.play()
      setIsPlaying(true)
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.debug('[LazyVideo] Autoplay prevented:', err.message)
      }
    }
  }, [isPlaying])

  const handleCanPlay = useCallback(() => {
    setIsLoaded(true)
    if (shouldAutoPlay) {
      attemptPlay()
    }
  }, [attemptPlay, shouldAutoPlay])

  const handlePlay = useCallback(() => setIsPlaying(true), [])
  const handlePause = useCallback(() => setIsPlaying(false), [])
  const handleError = useCallback(() => {
    setHasError(true)
    setIsPlaying(false)
  }, [])

  const handleEnded = useCallback(() => {
    if (loop) {
      attemptPlay()
    } else {
      setIsPlaying(false)
    }
  }, [attemptPlay, loop])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = muted
    video.playsInline = playsInline
    video.loop = loop
    video.preload = preload
  }, [muted, playsInline, loop, preload])

  useEffect(() => {
    if (!eager && !shouldAutoPlay) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoaded(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px 0px' },
    )

    const video = videoRef.current
    if (video) observer.observe(video)

    return () => observer.disconnect()
  }, [eager, shouldAutoPlay])

  useEffect(() => {
    if (eager || !shouldAutoPlay) return

    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (muted) video.muted = true
          attemptPlay()
        } else {
          video.pause()
        }
      },
      { rootMargin: '150px 0px' },
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [eager, shouldAutoPlay, muted, attemptPlay])

  if (!src) return null

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
      onCanPlay={handleCanPlay}
      onPlay={handlePlay}
      onPause={handlePause}
      onError={handleError}
      onEnded={handleEnded}
      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
    />
  )
}