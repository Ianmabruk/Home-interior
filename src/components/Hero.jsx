import { useState, useEffect, useMemo } from 'react'
import { getOptimizedUrl, buildSrcSet } from '../utils/cloudinaryHelpers'

/* eslint-disable react-hooks/set-state-in-effect -- Carousel crossfade requires synchronous state updates in effect */

/* eslint-disable no-unused-vars -- onBookConsultation is kept for component API compatibility */
export const Hero = ({ onBookConsultation, heroImages = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [opacityA, setOpacityA] = useState(1)
  const [opacityB, setOpacityB] = useState(0)
  const [nextImage, setNextImage] = useState(null)

  const images = useMemo(() => {
    if (!heroImages || heroImages.length === 0) return []
    return heroImages
      .filter(item => item)
      .slice(0, 5)
      .map(item => ({
        url: typeof item === 'string' ? item : (item.imageUrl || item.mediaUrls?.[0] || item.url),
        alt: item.title || item.alt || 'Luxury interior design project'
      }))
  }, [heroImages])

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [images.length])

  useEffect(() => {
    if (currentIndex === displayIndex) return
    setNextImage(images[currentIndex])
    setOpacityA(0)
    setOpacityB(1)
    const timeout = setTimeout(() => {
      setDisplayIndex(currentIndex)
      setOpacityA(1)
      setOpacityB(0)
      setNextImage(null)
    }, 800)
    return () => clearTimeout(timeout)
  }, [currentIndex, displayIndex, images])

  const currentImage = images[displayIndex]
  const activeImage = currentImage?.url
  const activeAlt = currentImage?.alt || 'Luxury interior design'

  return (
    <section
      className="relative w-full h-screen min-h-[700px] overflow-hidden bg-[var(--primary)]"
      role="region"
      aria-label="Hero image"
    >
      {!images.length && (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/95 to-[var(--primary)]/80" />
      )}
      {images.length > 0 && (
        <div className="absolute inset-0">
          <img
            src={getOptimizedUrl(activeImage, { width: 1280, crop: 'limit' })}
            srcSet={buildSrcSet(activeImage) || undefined}
            sizes={buildSrcSet(activeImage) ? '100vw' : undefined}
            fetchpriority="high"
            alt={activeAlt}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
            style={{ opacity: opacityA }}
            loading="eager"
            decoding="async"
          />
          {nextImage && (
            <img
              src={getOptimizedUrl(nextImage.url, { width: 1280, crop: 'limit' })}
              srcSet={buildSrcSet(nextImage.url) || undefined}
              sizes={buildSrcSet(nextImage.url) ? '100vw' : undefined}
              alt={nextImage.alt}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
              style={{ opacity: opacityB }}
              loading="eager"
              decoding="async"
            />
          )}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/95 to-[var(--primary)]/80" />
      <div className="absolute inset-0 opacity-[0.03] pattern-overlay" />
    </section>
  )
}
