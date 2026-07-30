import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { motion } from 'framer-motion'
import { getOptimizedUrl, buildSrcSet } from '../../utils/cloudinaryHelpers'

const textVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
}

const lineVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
}

const HeroSection = memo(({ heroImages = [], className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [opacityA, setOpacityA] = useState(1)
  const [opacityB, setOpacityB] = useState(0)
  const [nextImage, setNextImage] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [heroData, setHeroData] = useState(null)
  const firstImageLoadedRef = useRef(false)
  const transitionTimeoutRef = useRef(null)

  const images = useMemo(() => {
    if (!heroImages || heroImages.length === 0) return []
    return heroImages
      .filter(item => item)
      .map(item => ({
        url: typeof item === 'string' ? item : (item.imageUrl || item.mediaUrls?.[0] || item.url),
        alt: item.title || item.alt || 'Luxury interior design project',
        title: item.title,
        subtitle: item.subtitle,
      }))
      .filter(item => item.url)
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
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [images.length])

  useEffect(() => {
    if (currentIndex === displayIndex) return
    setNextImage(images[currentIndex])
    setOpacityA(0)
    setOpacityB(1)

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }
    transitionTimeoutRef.current = setTimeout(() => {
      setDisplayIndex(currentIndex)
      setOpacityA(1)
      setOpacityB(0)
      setNextImage(null)
    }, 1200)

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [currentIndex, displayIndex, images])

  const currentImage = images[displayIndex]
  const activeImage = currentImage?.url
  const activeAlt = currentImage?.alt || 'Luxury interior design'

  const handleImageLoad = useCallback(() => {
    if (!isLoaded) setIsLoaded(true)
  }, [isLoaded])

  useEffect(() => {
    const current = images[displayIndex]
    if (current?.title || current?.subtitle) {
      setHeroData({
        title: current.title,
        subtitle: current.subtitle,
      })
    } else if (images.length > 0) {
      setHeroData({
        title: 'HOK Interior',
        subtitle: 'Designs',
      })
    }
  }, [displayIndex, images])

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
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <img
          src={getOptimizedUrl(activeImage, { width: 1920, crop: 'limit' })}
          srcSet={buildSrcSet(activeImage) || undefined}
          sizes={buildSrcSet(activeImage) ? '100vw' : undefined}
          fetchPriority="high"
          alt={activeAlt}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out"
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
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out"
            style={{ opacity: opacityB, background: 'var(--primary)' }}
            loading="lazy"
            decoding="async"
            width={1920}
            height={1080}
          />
        )}
      </motion.div>

      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        variants={textVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center px-6 max-w-5xl mx-auto">
          <div className="inline-flex items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6 flex-wrap">
            <motion.h1
              variants={lineVariants}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-normal tracking-[0.02em] text-[#2A241F] drop-shadow-lg"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.15)' }}
            >
              {heroData?.title || 'HOK Interior'}
            </motion.h1>
            <motion.span
              variants={lineVariants}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-normal tracking-[0.02em] text-[#E89A43] drop-shadow-lg"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.15)' }}
            >
              {heroData?.subtitle || 'Designs'}
            </motion.span>
          </div>
          <motion.p
            variants={lineVariants}
            className="text-base sm:text-lg md:text-xl lg:text-2xl font-light tracking-[0.15em] uppercase text-[#2A241F]/80 mb-8 md:mb-10 max-w-2xl mx-auto"
            style={{ textShadow: '0 1px 10px rgba(0,0,0,0.1)' }}
          >
            Timeless Interiors, Designed for a Life Well Lived
          </motion.p>
          <motion.div
            variants={lineVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pointer-events-auto"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-full bg-[#E89A43] px-8 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white shadow-[0_8px_32px_rgba(232,154,67,0.35)] transition-all duration-500 hover:shadow-[0_12px_40px_rgba(232,154,67,0.45)]"
            >
              <span className="relative z-10">Explore Our Work</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full border-2 border-[#2A241F]/20 bg-white/60 backdrop-blur-md px-8 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#2A241F] shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-500 hover:bg-white/80 hover:border-[#2A241F]/40"
            >
              Get In Touch
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="flex flex-col items-center gap-2 text-[#2A241F]/50"
        >
          <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border-2 border-[#2A241F]/30 flex items-start justify-center p-1"
          >
            <div className="w-1 h-2 rounded-full bg-[#2A241F]/40" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
})

HeroSection.displayName = 'HeroSection'

export { HeroSection }
export default HeroSection
