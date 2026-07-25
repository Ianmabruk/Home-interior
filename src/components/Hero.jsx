import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, useAnimation, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { getOptimizedUrl, buildSrcSet } from '../utils/cloudinaryHelpers'

export const Hero = ({ heroImages = [], className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [opacityA, setOpacityA] = useState(1)
  const [opacityB, setOpacityB] = useState(0)
  const [nextImage, setNextImage] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const images = useMemo(() => {
    if (!heroImages || heroImages.length === 0) return []
    return heroImages
      .filter(item => item)
      .map(item => ({
        url: typeof item === 'string' ? item : (item.imageUrl || item.mediaUrls?.[0] || item.url),
        alt: item.title || item.alt || 'Luxury interior design project'
      }))
  }, [heroImages])

  const firstImageUrl = images[0]?.url

  useEffect(() => {
    if (!firstImageUrl) return
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
    /* eslint-disable react-hooks/set-state-in-effect -- Carousel crossfade requires synchronous state updates */
    setNextImage(images[currentIndex])
    setOpacityA(0)
    setOpacityB(1)
    const timeout = setTimeout(() => {
      setDisplayIndex(currentIndex)
      setOpacityA(1)
      setOpacityB(0)
      setNextImage(null)
    }, 1200)
    return () => clearTimeout(timeout)
  }, [currentIndex, displayIndex, images])

  const currentImage = images[displayIndex]
  const activeImage = currentImage?.url
  const activeAlt = currentImage?.alt || 'Luxury interior design'

  const controls = useAnimation()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)

  const springConfig = { stiffness: 15, damping: 25, mass: 2 }

  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)
  const springScale = useSpring(scale, springConfig)

  const transform = useTransform(
    [springX, springY, springScale],
    ([xVal, yVal, s]) => `translate3d(${xVal}%, ${yVal}%, 0) scale(${s})`
  )

  const startKenBurns = useCallback(() => {
    if (images.length <= 1) return
    const duration = 8 + Math.random() * 4
    const targetX = (Math.random() - 0.5) * 12
    const targetY = (Math.random() - 0.5) * 12
    const targetScale = 1 + Math.random() * 0.18

    x.set(0)
    y.set(0)
    scale.set(1)

    controls.start({
      x: targetX,
      y: targetY,
      scale: targetScale,
      transition: { duration, ease: 'linear' }
    })
  }, [controls, images.length, x, y, scale])

  useEffect(() => {
    if (!isLoaded || images.length <= 1) return
    startKenBurns()
    const interval = setInterval(startKenBurns, 10000)
    return () => clearInterval(interval)
  }, [isLoaded, images.length, startKenBurns])

  const handleImageLoad = () => {
    setIsLoaded(true)
  }

  if (!images.length) {
    return (
      <section
        className={`relative w-full h-screen min-h-[700px] overflow-hidden bg-primary ${className}`}
        role="region"
        aria-label="Hero image"
      >
        <div className="absolute inset-0 bg-[var(--primary)]" />
      </section>
    )
  }

  return (
    <section
      className={`relative w-full h-screen min-h-[700px] overflow-hidden ${className}`}
      role="region"
      aria-label="Hero image"
    >
      <motion.div
        style={{ transform }}
        className="absolute inset-0 will-change-transform"
      >
        <img
          src={getOptimizedUrl(activeImage, { width: 1920, crop: 'limit' })}
          srcSet={buildSrcSet(activeImage) || undefined}
          sizes={buildSrcSet(activeImage) ? '100vw' : undefined}
          fetchPriority="high"
          alt={activeAlt}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out"
          style={{ opacity: opacityA }}
          loading="eager"
          decoding="async"
          onLoad={handleImageLoad}
        />
        {nextImage && (
          <img
            src={getOptimizedUrl(nextImage.url, { width: 1920, crop: 'limit' })}
            srcSet={buildSrcSet(nextImage.url) || undefined}
            sizes={buildSrcSet(nextImage.url) ? '100vw' : undefined}
            alt={nextImage.alt}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out"
            style={{ opacity: opacityB }}
            loading="lazy"
            decoding="async"
          />
        )}
      </motion.div>
    </section>
  )
}

export default Hero