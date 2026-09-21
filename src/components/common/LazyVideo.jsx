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
  sources = [],
}) {
  const videoRef = useRef(null)
  const [hasError, setHasError] = useState(false)
  const [canPlay, setCanPlay] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const reducedMotion = useReducedMotion()
  const shouldAutoPlay = autoPlay && !reducedMotion && muted && playsInline
  const attemptPlayRef = useRef(0)
  const isMountedRef = useRef(true)

  const attemptPlay = useCallback(async () => {
    const video = videoRef.current
    if (!video || !isMountedRef.current) return
    const currentAttempt = ++attemptPlayRef.current
    try {
      await video.play()
    } catch (err) {
      if (!isMountedRef.current) return
      if (err.name === 'AbortError' || err.name === 'NotAllowedError') {
        console.debug('[LazyVideo] Autoplay prevented:', err.message)
        return
      }
      if (currentAttempt === attemptPlayRef.current) {
        setHasError(true)
      }
    }
  }, [])

  const onCanPlay = useCallback(() => {
    if (!isMountedRef.current) return
    setCanPlay(true)
    setIsLoaded(true)
  }, [])

  const onLoadedData = useCallback(() => {
    if (!isMountedRef.current) return
    setIsLoaded(true)
  }, [])

  const onLoadStart = useCallback(() => {
    if (!isMountedRef.current) return
    setHasError(false)
  }, [])

  const onPlay = useCallback(() => {}, [])
  const onPause = useCallback(() => {}, [])

  const onError = useCallback((e) => {
    if (!isMountedRef.current) return
    const video = e.currentTarget
    const err = video?.error
    // Don't treat transient/abort/decode errors as fatal — these are common
    // on mobile Safari during autoplay policy enforcement and preloading.
    if (!err) return
    if (err.code === MediaError.MEDIA_ERR_ABORTED || err.code === MediaError.MEDIA_ERR_DECODE) {
      return
    }
    // MEDIA_ERR_NETWORK (2) can be transient — don't immediately show error
    // unless the user has actually tried to interact
    setHasError(true)
  }, [])

  const onEnded = useCallback(() => {
    if (!isMountedRef.current) return
    if (loop) {
      attemptPlay()
    }
  }, [loop, attemptPlay])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = muted
    video.playsInline = playsInline
    video.loop = loop
    video.preload = preload
  }, [muted, playsInline, loop, preload])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isMountedRef.current) return

    if (eager && canPlay) {
      if (muted) video.muted = true
      attemptPlay()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!isMountedRef.current) return
        if (entry.isIntersecting) {
          if (muted) video.muted = true
          if (canPlay) {
            attemptPlay()
          }
        } else {
          if (!isLoaded) {
            video.pause()
          }
        }
      },
      { rootMargin: '150px 0px' },
    )

    if (shouldAutoPlay || !eager) {
      observer.observe(video)
    }

    return () => observer.disconnect()
  }, [shouldAutoPlay, canPlay, muted, attemptPlay, eager, isLoaded])

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
      poster={poster}
      className={className}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      controls={controls}
      preload={preload}
      onCanPlay={onCanPlay}
      onLoadedData={onLoadedData}
      onLoadStart={onLoadStart}
      onPlay={onPlay}
      onPause={onPause}
      onError={onError}
      onEnded={onEnded}
      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
    >
      <source src={src} type="video/mp4" />
      {sources.map((s, i) => (
        <source key={i} src={s.src} type={s.type || 'video/mp4' } />
      ))}
    </video>
  )
}
