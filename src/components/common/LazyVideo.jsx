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
  fallbackSrc,
}) {
  const videoRef = useRef(null)
  const [hasError, setHasError] = useState(false)
  const [canPlay, setCanPlay] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [effectiveSrc, setEffectiveSrc] = useState(null)
  const reducedMotion = useReducedMotion()
  const shouldAutoPlay = autoPlay && !reducedMotion && muted && playsInline
  const attemptPlayRef = useRef(0)
  const isMountedRef = useRef(true)
  const retryCountRef = useRef(0)
  const usedFallbackRef = useRef(false)
  const MAX_RETRIES = 2

  const attemptPlay = useCallback(async () => {
    const video = videoRef.current
    if (!video || !isMountedRef.current) return
    const currentAttempt = ++attemptPlayRef.current
    try {
      await video.play()
    } catch (err) {
      if (!isMountedRef.current) return
      if (err.name === 'AbortError' || err.name === 'NotAllowedError') {
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

  const onError = useCallback(() => {
    if (!isMountedRef.current) return
    const video = videoRef.current
    const err = video?.error
    if (!err) return

    if (err.code === MediaError.MEDIA_ERR_ABORTED) {
      return
    }

    // MEDIA_ERR_DECODE on mobile can be transient (network pressure, memory,
    // partial download during autoplay policy enforcement). Retry before
    // showing the error UI. If the transformed URL consistently fails, fall
    // back to the original/untransformed source.
    if (err.code === MediaError.MEDIA_ERR_DECODE || err.code === MediaError.MEDIA_ERR_NETWORK) {
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1
        const videoEl = videoRef.current
        if (videoEl) {
          videoEl.load()
        }
        return
      }

      if (!usedFallbackRef.current && fallbackSrc) {
        usedFallbackRef.current = true
        retryCountRef.current = 0
        setEffectiveSrc(fallbackSrc)
        setHasError(false)
        return
      }
    }

    setHasError(true)
  }, [fallbackSrc])

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

  useEffect(() => {
    if (effectiveSrc && videoRef.current && isMountedRef.current) {
      const video = videoRef.current
      video.load()
    }
  }, [effectiveSrc])

  useEffect(() => {
    if (effectiveSrc) {
      retryCountRef.current = 0
      usedFallbackRef.current = true
    }
  }, [effectiveSrc])

  if (!src && !fallbackSrc) return null

  const sourceSrc = effectiveSrc || src

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-4 bg-[var(--secondary)]/20 text-[var(--primary)]/50 ${className}`}
        style={{ width: '100%', height: '100%' }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-sm">Video unavailable</p>
        <button
          onClick={() => {
            if (videoRef.current) {
              setHasError(false)
              retryCountRef.current = 0
              videoRef.current.load()
            }
          }}
          className="text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
        >
          Retry
        </button>
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
      <source src={sourceSrc} type="video/mp4" />
      {sources.map((s, i) => (
        <source key={i} src={s.src} type={s.type || 'video/mp4' } />
      ))}
    </video>
  )
}
