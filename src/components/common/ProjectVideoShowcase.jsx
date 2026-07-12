import { useEffect, useRef, useState } from 'react'
import { getOptimizedVideoUrl, getVideoPosterUrl } from '../../utils/cloudinaryHelpers'
import PositionedImage from './PositionedImage'

// Auto-advancing, infinitely looping showcase of project media.
//  - Accepts mixed items: { type: 'video' | 'image', url, mediaSettings }.
//    Videos autoplay (muted, inline) and advance on end; images advance on a
//    timer, so the section always shows whatever the admin uploaded instead of
//    silently dropping image-only projects.
//  - Only the active video downloads/decodes; the next poster is preloaded so
//    switching is instant with no black flash.
//  - Pauses when scrolled out of view (IntersectionObserver) to save CPU/battery.
//  - No text/buttons/overlays — media only (per design).
const IMAGE_DURATION_MS = 6000

export default function ProjectVideoShowcase({ videos, className = '' }) {
  // Backwards compatible: bare { url } items are treated as videos.
  const list = (videos || [])
    .filter((v) => v && v.url)
    .map((v) => ({ type: v.type || 'video', url: v.url, mediaSettings: v.mediaSettings }))
  const [index, setIndex] = useState(0)
  const [inView, setInView] = useState(true)
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  // Clamp during render so a shorter list (after a feed refetch) never reads
  // past the end — no state update inside an effect needed.
  const safeIndex = list.length ? index % list.length : 0
  const current = list[safeIndex]
  const isVideo = current?.type === 'video'

  const goNext = () => setIndex((i) => (list.length ? (i + 1) % list.length : 0))

  // Pause decoding work when the section is offscreen.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // (Re)load whenever the active video changes.
  useEffect(() => {
    const v = videoRef.current
    if (!v || !isVideo || !current) return
    // React does not reliably set the `muted` DOM property from the JSX
    // attribute; without it, browsers block muted autoplay. Force it here.
    v.muted = true
    v.load()
  }, [current, isVideo])

  // Play/pause the active video on visibility change.
  useEffect(() => {
    const v = videoRef.current
    if (!v || !isVideo || !current) return
    if (inView) {
      v.muted = true
      const p = v.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } else {
      v.pause()
    }
  }, [inView, current, isVideo])

  // Auto-advance images on a timer (videos advance via onEnded).
  useEffect(() => {
    if (isVideo || !current || list.length < 2 || !inView) return undefined
    const t = setTimeout(goNext, IMAGE_DURATION_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex, isVideo, inView, list.length])

  if (!current) return null

  const nextItem = list.length > 1 ? list[(safeIndex + 1) % list.length] : null

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-linen ${className}`}>
      {isVideo ? (
        <video
          ref={videoRef}
          key={current.url}
          src={getOptimizedVideoUrl(current.url, { width: 1280 })}
          poster={getVideoPosterUrl(current.url, { width: 1280 })}
          autoPlay
          muted
          loop={list.length === 1}
          playsInline
          preload="metadata"
          fetchPriority="high"
          onEnded={goNext}
          onCanPlay={() => {
            if (inView && videoRef.current) {
              videoRef.current.muted = true
              videoRef.current.play().catch(() => {})
            }
          }}
          className="h-full w-full object-cover"
        />
      ) : (
        <PositionedImage
          src={current.url}
          alt=""
          settings={current.mediaSettings}
          className="h-full w-full"
          loading="eager"
        />
      )}

      {/* Preload the next item's poster/image so the transition is seamless. */}
      {nextItem && (
        <img
          src={nextItem.type === 'video' ? getVideoPosterUrl(nextItem.url, { width: 1280 }) : nextItem.url}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
        />
      )}

      {/* Progress dots (no text) */}
      {list.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {list.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full bg-white transition-all duration-300 ${
                i === safeIndex ? 'w-6' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
