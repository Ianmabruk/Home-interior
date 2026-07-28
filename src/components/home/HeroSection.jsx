import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { getOptimizedUrl, buildSrcSet } from '../../utils/cloudinaryHelpers'

const HeroSection = memo(({ heroImages = [], className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [opacityA, setOpacityA] = useState(1)
  const [opacityB, setOpacityB] = useState(0)
  const [nextImage, setNextImage] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const firstImageLoadedRef = useRef(false)
  const transitionTimeoutRef = useRef(null)

  const images = useMemo(() => {
    if (!heroImages || heroImages.length === 0) return []
    return heroImages
      .filter(item => item)
      .map(item => ({
        url: typeof item === 'string' ? item : (item.imageUrl || item.mediaUrls?.[0] || item.url),
        alt: item.title || item.alt || 'Luxury interior design project'
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

  if (!images.length) {
    return (
      <section
        className={`relative w-full h-screen min-h-[700px] overflow-hidden bg-[var(--primary)] ${className}`}
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
      className={`relative w-full h-screen min-h-[700px] overflow-hidden ${className}`}
      role="region"
      aria-label="Hero image"
      style={{ contain: 'layout paint' }}
    >
      <div
        className="absolute inset-0 will-change-transform"
        style={{ animationDelay: '0s', animationDuration: '12s' }}
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
            style={{ opacity: opacityB }}
            loading="lazy"
            decoding="async"
            width={1920}
            height={1080}
          />
        )}
      </div>
    </section>
  )
})

HeroSection.displayName = 'HeroSection'

export { HeroSection }
export default HeroSection