import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { motion } from 'framer-motion'
import { getOptimizedUrl, buildSrcSet, getVideoPosterUrl, getOptimizedVideoUrl } from '../../utils/cloudinaryHelpers'

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

const HeroSection = memo(({ heroImages = [], className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [opacityA, setOpacityA] = useState(1)
  const [opacityB, setOpacityB] = useState(0)
  const [nextMedia, setNextMedia] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const firstImageLoadedRef = useRef(false)
  const transitionTimeoutRef = useRef(null)

  const titleVariants = useMemo(() => buildTitleVariants(prefersReducedMotion), [prefersReducedMotion])
  const taglineVariants = useMemo(() => buildTaglineVariants(prefersReducedMotion), [prefersReducedMotion])

  const mediaItems = useMemo(() => {
    if (!heroImages || heroImages.length === 0) return []
    const allMedia = []
    heroImages.forEach(item => {
      if (!item) return
      // Support both video and image media
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

  useEffect(() => {
    if (!firstMediaUrl || firstImageLoadedRef.current) return
    firstImageLoadedRef.current = true
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = getVideoPosterUrl(firstMediaUrl) || getOptimizedUrl(firstMediaUrl, { width: 1920, crop: 'limit' })
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

  useEffect(() => {
    if (mediaItems.length <= 1 || prefersReducedMotion) return
    const interval = 8500
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mediaItems.length)
    }, interval)
    return () => clearInterval(timer)
  }, [mediaItems.length, prefersReducedMotion])

  useEffect(() => {
    if (currentIndex === displayIndex) return
    setNextMedia(mediaItems[currentIndex])
    setOpacityA(0)
    setOpacityB(1)

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }
    const duration = prefersReducedMotion ? 300 : 1200
    transitionTimeoutRef.current = setTimeout(() => {
      setDisplayIndex(currentIndex)
      setOpacityA(1)
      setOpacityB(0)
      setNextMedia(null)
    }, duration)

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [currentIndex, displayIndex, mediaItems, prefersReducedMotion])

  const currentMedia = mediaItems[displayIndex]

  const handleImageLoad = useCallback(() => {
    if (!isLoaded) setIsLoaded(true)
  }, [isLoaded])

  const renderMedia = (media, opacity, isNext = false) => {
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
          autoPlay={!isNext}
          preload={isNext ? 'none' : 'metadata'}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out"
          style={{ opacity, background: 'var(--primary)' }}
          onLoadedData={handleImageLoad}
        />
      )
    }
    return (
      <img
        key={media.url}
        src={getOptimizedUrl(media.url, { width: 1920, crop: 'limit' })}
        srcSet={buildSrcSet(media.url) || undefined}
        sizes={buildSrcSet(media.url) ? '100vw' : undefined}
        fetchPriority={isNext ? 'low' : 'high'}
        alt={media.alt}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out"
        style={{ opacity, background: 'var(--primary)' }}
        loading={isNext ? 'lazy' : 'eager'}
        decoding="async"
        onLoad={handleImageLoad}
        width={1920}
        height={1080}
      />
    )
  }

  if (!mediaItems.length) {
    return (
      <section
        className={`relative w-full h-[85vh] lg:h-screen min-h-[500px] overflow-hidden bg-[var(--primary)] ${className}`}
        role="region"
        aria-label="Hero image"
        style={{ contain: 'layout paint' }}
      >
        <div className="absolute inset-0 bg-[var(--primary)]" />
      </section>
    )
  }

  return (
    <section
      className={`relative w-full h-[85vh] lg:h-screen min-h-[500px] overflow-hidden ${className}`}
      role="region"
      aria-label="Hero image"
      style={{ contain: 'layout paint' }}
    >
      <div
        className={`absolute inset-0 will-change-transform ${!prefersReducedMotion ? 'ken-burns' : ''}`}
        style={{ animationDuration: '12s' }}
      >
        {renderMedia(currentMedia, opacityA)}
        {nextMedia && renderMedia(nextMedia, opacityB, true)}
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
