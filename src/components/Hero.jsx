import { useState, useEffect, useMemo, useCallback } from 'react'
import { getOptimizedUrl, buildSrcSet } from '../utils/cloudinaryHelpers'

export const Hero = ({ heroImages = [], className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [opacityA, setOpacityA] = useState(1)
  const [opacityB, setOpacityB] = useState(0)
  const [nextImage, setNextImage] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [kenBurnsKey, setKenBurnsKey] = useState(0)

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

  const handleImageLoad = () => {
    setIsLoaded(true)
  }

  const startKenBurns = useCallback(() => {
    if (images.length <= 1) return
    setKenBurnsKey(prev => prev + 1)
  }, [images.length])

  useEffect(() => {
    if (!isLoaded || images.length <= 1) return
    startKenBurns()
    const interval = setInterval(startKenBurns, 10000)
    return () => clearInterval(interval)
  }, [isLoaded, images.length, startKenBurns])

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
      <div
        className="absolute inset-0 will-change-transform animate-ken-burns"
        style={{ animationDelay: '0s', animationDuration: '12s' }}
        key={kenBurnsKey}
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
      </div>
    </section>
  )
}

export default Hero