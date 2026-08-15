import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { motion } from 'framer-motion'
import { getOptimizedUrl, buildSrcSet } from '../../utils/cloudinaryHelpers'

const HOK_LINE = (
  <>
    <span className="text-white">HOK</span>
    <span className="text-[#E89A43]"> Interiors</span>
  </>
)
const TAGLINE = 'Design • Build • Style'

const titleVariants = {
  hidden: { opacity: 0, x: -120 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

const taglineVariants = {
  hidden: { opacity: 0, x: 120 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.4,
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

const HeroSection = memo(({ heroImages = [], className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [opacityA, setOpacityA] = useState(1)
  const [opacityB, setOpacityB] = useState(0)
  const [nextImage, setNextImage] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const firstImageLoadedRef = useRef(false)
  const transitionTimeoutRef = useRef(null)

  const images = useMemo(() => {
    if (!heroImages || heroImages.length === 0) return []
    const allImages = []
    heroImages.forEach(item => {
      if (!item) return
      const urls = item.mediaUrls?.length > 0 ? item.mediaUrls : (item.imageUrl ? [item.imageUrl] : [])
      urls.forEach(url => {
        if (url) {
          allImages.push({
            url,
            alt: item.title || item.alt || 'Luxury interior design project',
          })
        }
      })
    })
    return allImages
  }, [heroImages])

  const firstImageUrl = images[0]?.url

  useEffect(() => {
    if (!firstImageUrl || firstImageLoadedRef.current) return
    firstImageLoadedRef.current = true
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = getOptimizedUrl(firstImageUrl, { width: 1920, crop: 'limit' })
    link.fetchPriority = 'high'
    document.head.appendChild(link)
    return () => {
      const existing = document.querySelector(`link[href="${link.href}"]`)
      if (existing) existing.remove()
    }
  }, [firstImageUrl])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const handler = (e) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (images.length <= 1 || prefersReducedMotion) return
    const interval = 4000
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, interval)
    return () => clearInterval(timer)
  }, [images.length, prefersReducedMotion])

  useEffect(() => {
    if (currentIndex === displayIndex) return
    setNextImage(images[currentIndex])
    setOpacityA(0)
    setOpacityB(1)

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }
    const duration = prefersReducedMotion ? 300 : 1800
    transitionTimeoutRef.current = setTimeout(() => {
      setDisplayIndex(currentIndex)
      setOpacityA(1)
      setOpacityB(0)
      setNextImage(null)
    }, duration)

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [currentIndex, displayIndex, images, prefersReducedMotion])

  const currentImage = images[displayIndex]
  const activeImage = currentImage?.url
  const activeAlt = currentImage?.alt || 'Luxury interior design'

  const handleImageLoad = useCallback(() => {
    if (!isLoaded) setIsLoaded(true)
  }, [isLoaded])

  if (!images.length) {
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
      <motion.div
        className="absolute inset-0 will-change-transform"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: prefersReducedMotion ? 0.3 : 1.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <img
          src={getOptimizedUrl(activeImage, { width: 1920, crop: 'limit' })}
          srcSet={buildSrcSet(activeImage) || undefined}
          sizes={buildSrcSet(activeImage) ? '100vw' : undefined}
          fetchPriority="high"
          alt={activeAlt}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1800ms] ease-out"
          style={{ opacity: opacityA, background: 'var(--primary)' }}
          loading="eager"
          decoding="async"
          onLoad={handleImageLoad}
          width={1920}
          height={1080}
        />
        {nextImage && (
          <img
            src={getOptimizedUrl(nextImage.url, { width: 1920, crop: 'limit' })}
            srcSet={buildSrcSet(nextImage.url) || undefined}
            sizes={buildSrcSet(nextImage.url) ? '100vw' : undefined}
            alt={nextImage.alt}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1800ms] ease-out"
            style={{ opacity: opacityB, background: 'var(--primary)' }}
            loading="lazy"
            decoding="async"
            width={1920}
            height={1080}
          />
        )}
      </motion.div>

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
