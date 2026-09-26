import { useEffect, useRef, useState, useCallback } from 'react'
import { useReducedMotion } from '@components/common/DynamicMotion'
import { getVideoSourceType } from '@utils/cloudinaryHelpers'

const MAX_RETRIES = 2
// A media element can stall without ever firing `error` — e.g. a CDN or proxy
// answers with HTML, or a phone drops the connection mid-transfer. The browser
// then sits at readyState 0 forever: a black box with dead controls and no
// explanation. Bound that state so the visitor always gets a way forward.
const STALL_TIMEOUT_MS = 15000

const describeMediaError = (code) => {
  switch (code) {
    case 1:
      return 'Playback was aborted'
    case 2:
      return 'A network error interrupted the download'
    case 3:
      return 'The video could not be decoded on this device'
    case 4:
      return 'This video format is not supported on this device'
    default:
      return 'The video could not be loaded'
  }
}

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
  maxHeight = '75vh',
}) {
  const videoRef = useRef(null)
  const [hasError, setHasError] = useState(false)
  const [errorDetail, setErrorDetail] = useState('')
  const [canPlay, setCanPlay] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  // Until the browser reports intrinsic dimensions the element has no height,
  // which collapses it to the default 150px bar. Hold a neutral placeholder
  // ratio in that window, then switch to the video's real aspect ratio so a
  // portrait clip is never cropped or letterboxed.
  const [hasDimensions, setHasDimensions] = useState(false)
  const [effectiveSrc, setEffectiveSrc] = useState(null)
  const reducedMotion = useReducedMotion()

  const shouldAutoPlay = autoPlay && !reducedMotion && muted && playsInline
  const attemptPlayRef = useRef(0)
  const isMountedRef = useRef(true)
  const retryCountRef = useRef(0)
  const usedFallbackRef = useRef(false)

  // Reset per-source retry bookkeeping whenever the source actually changes,
  // otherwise a failure on one source burns the budget for the next one.
  useEffect(() => {
    retryCountRef.current = 0
    usedFallbackRef.current = false
    setHasDimensions(false)
  }, [src, fallbackSrc])

  const primarySrc = src || fallbackSrc || null

  const attemptPlay = useCallback(async () => {
    const video = videoRef.current
    if (!video || !isMountedRef.current) return
    const currentAttempt = ++attemptPlayRef.current
    try {
      await video.play()
    } catch (err) {
      if (!isMountedRef.current) return
      // Autoplay policy rejections are expected on mobile. The video stays
      // visible and fully manual — this must never escalate to an error state.
      if (err.name === 'AbortError' || err.name === 'NotAllowedError') return
      if (currentAttempt === attemptPlayRef.current) {
        setHasError(true)
        setErrorDetail(err.message || 'Playback could not start')
      }
    }
  }, [])

  const onCanPlay = useCallback(() => {
    if (!isMountedRef.current) return
    setCanPlay(true)
    setIsLoaded(true)
    setHasError(false)
  }, [])

  const onLoadedData = useCallback(() => {
    if (!isMountedRef.current) return
    setIsLoaded(true)
  }, [])

  const onLoadedMetadata = useCallback((e) => {
    if (!isMountedRef.current) return
    const el = e.currentTarget
    if (el.videoWidth > 0 && el.videoHeight > 0) setHasDimensions(true)
  }, [])

  const onLoadStart = useCallback(() => {
    if (!isMountedRef.current) return
    setHasError(false)
    setErrorDetail('')
  }, [])

  const onStalled = useCallback(() => {
    if (!isMountedRef.current) return
    if (import.meta.env.DEV) {
      console.warn('[LazyVideo] media stalled', { src: effectiveSrc || primarySrc })
    }
  }, [effectiveSrc, primarySrc])

  const onEnded = useCallback(() => {
    if (!isMountedRef.current) return
    if (loop) attemptPlay()
  }, [loop, attemptPlay])

  const onError = useCallback(() => {
    if (!isMountedRef.current) return
    const video = videoRef.current
    const err = video?.error
    if (!err) return

    if (import.meta.env.DEV) {
      console.warn('[LazyVideo] media error', {
        code: err.code,
        message: err.message,
        src: effectiveSrc || primarySrc,
      })
    }

    // An aborted request is not a failure — the browser cancels media requests
    // routinely (seek, source switch, unmount).
    if (err.code === 1 /* MEDIA_ERR_ABORTED */) return

    const recoverable = err.code === 3 /* DECODE */ || err.code === 2 /* NETWORK */
    if (recoverable && retryCountRef.current < MAX_RETRIES) {
      retryCountRef.current += 1
      videoRef.current?.load()
      return
    }

    // Legacy/transformed URL failed — try the untouched original once.
    if (!usedFallbackRef.current && fallbackSrc && (effectiveSrc || src) !== fallbackSrc) {
      usedFallbackRef.current = true
      setEffectiveSrc(fallbackSrc)
      setHasError(false)
      setErrorDetail('')
      return
    }

    setErrorDetail(describeMediaError(err.code))
    setHasError(true)
  }, [effectiveSrc, fallbackSrc, primarySrc, src])

  const retry = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    retryCountRef.current = 0
    usedFallbackRef.current = false
    setHasError(false)
    setErrorDetail('')
    // Re-assigning src restarts the media pipeline even when the URL is
    // unchanged and the element was left in a failed state.
    setEffectiveSrc(null)
    video.load()
    if (shouldAutoPlay) attemptPlay()
  }, [attemptPlay, shouldAutoPlay])

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

  const observerRef = useRef(null)
  useEffect(() => {
    const video = videoRef.current
    if (!video || !isMountedRef.current) return

    if (eager && canPlay) {
      if (muted) video.muted = true
      attemptPlay()
      return
    }

    if (observerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!isMountedRef.current) return
        if (entry.isIntersecting) {
          if (muted) video.muted = true
          if (canPlay) attemptPlay()
        } else if (!isLoaded) {
          video.pause()
        }
      },
      { rootMargin: '150px 0px' },
    )

    if (shouldAutoPlay || !eager) {
      observer.observe(video)
    }
    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [shouldAutoPlay, canPlay, muted, attemptPlay, eager, isLoaded])

  useEffect(() => {
    if (!effectiveSrc) return
    const video = videoRef.current
    if (video && isMountedRef.current) video.load()
  }, [effectiveSrc])

  // Watchdog: if a load attempt neither succeeds nor errors within the
  // timeout, treat it as a failure so the visitor sees the fallback and a
  // retry instead of an inert black rectangle.
  useEffect(() => {
    if (!primarySrc) return undefined
    if (isLoaded || hasError) return undefined

    const timer = setTimeout(() => {
      if (!isMountedRef.current) return
      const video = videoRef.current
      // Only escalate if the element is genuinely stuck with nothing to show.
      if (video && video.readyState >= 2) return
      setErrorDetail('The video took too long to load')
      setHasError(true)
    }, STALL_TIMEOUT_MS)

    return () => clearTimeout(timer)
  }, [primarySrc, isLoaded, hasError])

  if (!primarySrc) return null

  const sourceSrc = effectiveSrc || src || fallbackSrc
  const sourceType = getVideoSourceType(sourceSrc) || 'video/mp4'

  return (
    <div className={`relative w-full ${className}`}>
      <video
        ref={videoRef}
        poster={poster}
        className="block w-full"
        autoPlay={shouldAutoPlay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        controls={controls}
        preload={preload}
        onCanPlay={onCanPlay}
        onLoadedData={onLoadedData}
        onLoadedMetadata={onLoadedMetadata}
        onLoadStart={onLoadStart}
        onStalled={onStalled}
        onError={onError}
        onEnded={onEnded}
        // height:auto + object-fit:contain keeps the natural aspect ratio, so a
        // portrait phone clip is never cropped or squashed into a fixed box.
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: hasDimensions ? 'auto' : '16 / 9',
          maxHeight,
          objectFit: 'contain',
          display: 'block',
          backgroundColor: '#000',
        }}
      >
        <source src={sourceSrc} type={sourceType} />
        {sources.map((s, i) => (
          <source key={i} src={s.src} type={getVideoSourceType(s.src) || s.type || 'video/mp4'} />
        ))}
        Your browser does not support HTML video.
      </video>

      {/* The video element is intentionally never unmounted. A failed load
          degrades to an overlay so the poster, controls and retry stay usable
          instead of collapsing into an empty grey box. */}
      {hasError && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--secondary)]/20 px-4 text-center backdrop-blur-[2px]"
          role="status"
        >
          <p className="text-sm font-medium text-[var(--primary)]/70">Video unavailable</p>
          {errorDetail && <p className="text-xs text-[var(--primary)]/50">{errorDetail}</p>}
          <button
            type="button"
            onClick={retry}
            className="rounded-full border border-[var(--border)] px-4 py-1.5 text-xs font-semibold text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
