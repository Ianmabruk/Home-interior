import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

// Lazily loads and autoplays a video only once it scrolls into (or near) the
// viewport, and pauses it when it leaves — so below-the-fold videos never
// download or decode until needed and don't burn CPU/battery on mobile.
//
// The poster always renders (even before the video loads), so there is no
// layout shift and the first frame paints instantly. Pass `eager` to keep the
// original above-the-fold behaviour (hero video plays immediately).
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
}) {
  const videoRef = useRef(null)
  const [active, setActive] = useState(eager)
  const reducedMotion = useReducedMotion()
  const shouldAutoPlay = autoPlay && !reducedMotion
  const showVideo = eager || active

  // Force the `muted` DOM property (React's JSX `muted` attribute is not
  // reliably applied), so browsers permit muted autoplay for eager videos too.
  useEffect(() => {
    if (muted && videoRef.current) videoRef.current.muted = true
  }, [muted, active])

  // Play as soon as the video source is attached and the section is meant to
  // be active. This covers the case where the browser does not auto-play a
  // dynamically-sourced <video> even when `autoplay` is present.
  useEffect(() => {
    const v = videoRef.current
    if (!v || !showVideo || !shouldAutoPlay) return
    const p = v.play()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  }, [showVideo, shouldAutoPlay])

  // Load (set src + autoplay) as soon as the element is near the viewport.
  useEffect(() => {
    if (eager) return undefined
    const el = videoRef.current
    if (!el) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [eager])

  // Pause when scrolled out of view to free the decoder (CPU/memory on mobile).
  useEffect(() => {
    if (eager || !shouldAutoPlay) return undefined
    const el = videoRef.current
    if (!el) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // React doesn't reliably set the `muted` DOM property from the JSX
          // attribute; force it so browsers allow muted autoplay.
          if (muted) el.muted = true
          const p = el.play()
          if (p && typeof p.catch === 'function') p.catch(() => {})
        } else {
          el.pause()
        }
      },
      { rootMargin: '150px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [eager, shouldAutoPlay, muted])

  return (
    <video
      ref={videoRef}
      poster={poster}
      className={className}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      controls={controls}
      preload={showVideo ? 'metadata' : 'none'}
      src={showVideo ? src : undefined}
      autoPlay={showVideo && shouldAutoPlay}
    />
  )
}
