import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getOptimizedVideoUrl, getVideoPosterUrl } from '../../utils/cloudinaryHelpers'
import PositionedImage from './PositionedImage'

const IMAGE_DURATION_MS = 6000

export default function ProjectVideoShowcase({ videos, className = '' }) {
  const list = useMemo(
    () =>
      (videos || [])
        .filter((v) => v && v.url)
        .map((v) => ({ type: v.type || 'video', url: v.url, mediaSettings: v.mediaSettings })),
    [videos],
  )

  const [index, setIndex] = useState(0)
  const [inView, setInView] = useState(true)
  const [fadeKey, setFadeKey] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const lastLoadedUrlRef = useRef(null)

  const safeIndex = list.length ? index % list.length : 0
  const current = list[safeIndex]
  const isVideo = current?.type === 'video'

  const goNext = useCallback(() => {
    if (isTransitioning || list.length <= 1) return
    setIsTransitioning(true)
    const nextIndex = (safeIndex + 1) % list.length
    console.log('[showcase] transitioning:', {
      current: { index: safeIndex, url: current?.url },
      next: { index: nextIndex, url: list[nextIndex]?.url },
    })
    setTimeout(() => {
      setIndex(nextIndex)
      setFadeKey((k) => k + 1)
      setIsTransitioning(false)
    }, 400)
  }, [isTransitioning, safeIndex, current?.url, list])

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

  // Reload video element when the active video URL changes.
  useEffect(() => {
    const v = videoRef.current
    if (!v || !isVideo || !current) return
    if (lastLoadedUrlRef.current === current.url) return
    lastLoadedUrlRef.current = current.url
    v.muted = true
    v.load()
    console.log('[showcase] video loaded:', current.url)
  }, [current, isVideo, goNext])

  // Play/pause on visibility or transition changes.
  useEffect(() => {
    const v = videoRef.current
    if (!v || !isVideo || !current) return
    if (inView && !isTransitioning) {
      v.muted = true
      const p = v.play()
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          console.warn('[showcase] play() failed for', current.url, err)
        })
      }
      console.log('[showcase] video started:', current.url)
    } else {
      v.pause()
    }
  }, [inView, current, isVideo, isTransitioning])

  // Auto-advance images on a timer. Videos advance via onEnded.
  useEffect(() => {
    if (isVideo || !current || list.length < 2 || !inView) return undefined
    const t = setTimeout(goNext, IMAGE_DURATION_MS)
    return () => clearTimeout(t)
  }, [safeIndex, current, isVideo, inView, list.length, goNext])

  if (!current) return null

  const nextItem = list.length > 1 ? list[(safeIndex + 1) % list.length] : null

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-[32px] bg-linen shadow-2xl shadow-black/10 ring-1 ring-black/5 transition-transform duration-500 hover:scale-[1.01] ${className}`}
    >
      <div
        key={fadeKey}
        className="absolute inset-0 transition-opacity duration-400 ease-in-out"
        style={{ opacity: isTransitioning ? 0 : 1 }}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={getOptimizedVideoUrl(current.url, { width: 1280 })}
            poster={getVideoPosterUrl(current.url, { width: 1280 })}
            autoPlay
            muted
            loop={list.length === 1}
            playsInline
            preload="auto"
            fetchPriority="high"
            onEnded={() => {
              console.log('[showcase] video ended:', current.url)
              goNext()
            }}
            onCanPlay={() => {
              if (inView && videoRef.current && !isTransitioning) {
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
      </div>

      {nextItem && !isTransitioning && (
        <img
          src={nextItem.type === 'video' ? getVideoPosterUrl(nextItem.url, { width: 1280 }) : nextItem.url}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
        />
      )}

      {list.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/20 px-4 py-2 backdrop-blur-md">
          {list.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === safeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
