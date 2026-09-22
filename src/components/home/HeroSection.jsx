import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { motion } from '@components/common/DynamicMotion'
import { getOptimizedUrlAutoDpr, getVideoPosterUrl, getOptimizedVideoUrl } from '../../utils/cloudinaryHelpers'

const HOK_LINE = (
  <>
    <span className="text-white">HOK</span>
    <span className="text-[#E89A43]"> Interiors</span>
  </>
)
const TAGLINE = 'Design • Build • Style'

const buildTitleVariants = (reduced) => ({
  hidden: reduced ? { opacity: 0 } : { opacity: 0, x: 120 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: reduced ? 0.6 : 1.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
})

const buildTaglineVariants = (reduced) => ({
  hidden: reduced ? { opacity: 0 } : { opacity: 0, x: -120 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      delay: reduced ? 0 : 0.4,
      duration: reduced ? 0.6 : 1.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
})

const HOLD_DURATION = 2000
const CROSSFADE_DURATION = 800

const HeroSection = memo(({ heroImages = [], className = '' }) => {
  const [displayIndex, setDisplayIndex] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const titleVariants = useMemo(() => buildTitleVariants(prefersReducedMotion), [prefersReducedMotion])
  const taglineVariants = useMemo(() => buildTaglineVariants(prefersReducedMotion), [prefersReducedMotion])

  const mediaItems = useMemo(() => {
    if (!heroImages || heroImages.length === 0) return []
    const allMedia = []
    heroImages.forEach(item => {
      if (!item) return
      if (item.mediaUrls?.length > 0) {
        item.mediaUrls.forEach(url => {
          if (url) {
            allMedia.push({
              url,
              type: url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) ? 'video' : 'image',
              alt: item.title || item.alt || 'Luxury interior design project',
            })
          }
        })
      } else if (item.imageUrl) {
        allMedia.push({
          url: item.imageUrl,
          type: 'image',
          alt: item.title || item.alt || 'Luxury interior design project',
        })
      }
    })
    return allMedia
  }, [heroImages])

  const firstMediaUrl = mediaItems[0]?.url

  const loadedImagesRef = useRef(new Set())
  const transitionTimeoutRef = useRef(null)
  const isMountedRef = useRef(true)
  const firstImageLoadedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!firstMediaUrl) return
    if (firstImageLoadedRef.current) return
    firstImageLoadedRef.current = true
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = getVideoPosterUrl(firstMediaUrl) || getOptimizedUrlAutoDpr(firstMediaUrl, { width: 1920, crop: 'limit' })
    link.fetchPriority = 'high'
    document.head.appendChild(link)
    return () => {
      const existing = document.querySelector(`link[href="${link.href}"]`)
      if (existing) existing.remove()
    }
  }, [firstMediaUrl])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = (e) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Preload all hero images so the crossfade never flashes to a blank image.
  useEffect(() => {
    if (mediaItems.length <= 1) return
    const urlsToPreload = mediaItems
      .filter(item => item.type === 'image' && !loadedImagesRef.current.has(item.url))
      .map(item => item.url)
    if (urlsToPreload.length === 0) return

    urlsToPreload.forEach(url => {
      const img = new Image()
      img.onload = () => {
        loadedImagesRef.current.add(url)
      }
      img.onerror = () => {
        loadedImagesRef.current.add(url)
      }
      img.src = getOptimizedUrlAutoDpr(url, { width: 1920, crop: 'limit' })
    })
  }, [mediaItems])

  // Timer effect — fires every HOLD_DURATION + CROSSFADE_DURATION
  useEffect(() => {
    if (mediaItems.length <= 1 || prefersReducedMotion) return

    let timerId = null

    function startTransition() {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
      const fadeDuration = prefersReducedMotion ? 0 : CROSSFADE_DURATION
      setTransitioning(true)
      transitionTimeoutRef.current = setTimeout(() => {
        setDisplayIndex((prev) => (prev + 1) % mediaItems.length)
        setTransitioning(false)
      }, fadeDuration)
    }

    function start() {
      if (timerId) return
      timerId = setInterval(() => {
        if (document.hidden) return
        if (!isMountedRef.current) return
        startTransition()
      }, HOLD_DURATION + CROSSFADE_DURATION)
    }

    function stop() {
      if (timerId) {
        clearInterval(timerId)
        timerId = null
      }
    }

    const handleVisibility = () => {
      if (document.hidden) {
        stop()
      } else {
        start()
      }
    }

    start()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [mediaItems.length, prefersReducedMotion])

  const handleImageLoad = useCallback(() => {}, [])

  const renderMedia = (media, opacity, isCurrent = false) => {
    if (!media) return null
    if (media.type === 'video') {
      return (
        <video
          key={media.url}
          src={getOptimizedVideoUrl(media.url) || media.url}
          poster={getVideoPosterUrl(media.url)}
          muted
          loop
          playsInline
          type="video/mp4"
          autoPlay={isCurrent}
          preload={isCurrent ? 'metadata' : 'none'}
          className="absolute inset-0 w-full h-full object-cover hero-media"
          style={{ opacity, transition: `opacity ${CROSSFADE_DURATION}ms ease-out` }}
          onLoadedData={handleImageLoad}
        />
      )
    }
    const optimizedSrc = getOptimizedUrlAutoDpr(media.url, { width: 1920, crop: 'limit' })
    return (
      <img
        key={media.url}
        src={optimizedSrc}
        alt={media.alt}
        className="absolute inset-0 w-full h-full object-cover hero-media"
        style={{ opacity, transition: `opacity ${CROSSFADE_DURATION}ms ease-out` }}
        loading="eager"
        decoding="async"
        onLoad={handleImageLoad}
      />
    )
  }

  if (!mediaItems.length) {
    return (
      <section
        className={`relative w-full bg-[var(--primary)] ${className}`}
        role="region"
        aria-label="Hero image"
        style={{ height: 'clamp(56vw, 85vh, 100vh)', minHeight: '300px' }}
      >
        <div className="absolute inset-0 bg-[var(--primary)]" />
      </section>
    )
  }

  const total = mediaItems.length
  const nextIndex = (displayIndex + 1) % total
  const currentMedia = mediaItems[displayIndex]
  const nextMedia = total > 1 ? mediaItems[nextIndex] : null

  return (
    <section
      className={`relative w-full overflow-hidden ${className}`}
      role="region"
      aria-label="Hero image"
      style={{ height: 'clamp(56vw, 85vh, 100vh)', minHeight: '300px' }}
    >
      <div className="absolute inset-0">
        {renderMedia(currentMedia, transitioning ? 0 : 1, true)}
        {nextMedia && renderMedia(nextMedia, transitioning ? 1 : 0, false)}
      </div>

      <motion.div
        className="absolute inset-0 flex items-end pointer-events-none"
        style={{ paddingBottom: 'clamp(40px, 6vw, 80px)', paddingLeft: 'clamp(24px, 4vw, 64px)' }}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-6xl">
          <motion.h1
            variants={titleVariants}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-normal tracking-[0.02em] drop-shadow-lg"
            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.25)' }}
          >
            {HOK_LINE}
          </motion.h1>
          <motion.p
            variants={taglineVariants}
            className="mt-4 md:mt-6 text-lg sm:text-xl md:text-2xl lg:text-3xl font-light tracking-[0.25em] uppercase text-white/90 drop-shadow-md relative z-10"
            style={{
              textShadow: '0 2px 20px rgba(0,0,0,0.2)',
              marginTop: '-8px',
            }}
          >
            {TAGLINE}
          </motion.p>
        </div>
      </motion.div>
    </section>
  )
})

HeroSection.displayName = 'HeroSection'

export { HeroSection }
export default HeroSection
