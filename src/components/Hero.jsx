import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import { getOptimizedUrl, buildSrcSet } from '../utils/cloudinaryHelpers'

/* eslint-disable react-hooks/set-state-in-effect -- Carousel crossfade requires synchronous state updates in effect */

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

      <div className="relative z-10 flex h-full items-end justify-center px-6 md:px-12 lg:px-20 pb-20 md:pb-28">
        <div
          className="max-w-5xl w-full flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up"
          style={{ animationDelay: '0.8s' }}
        >
          <Link
            to="/portfolio"
            className="btn-luxury-primary group hidden sm:w-auto"
          >
            View Portfolio
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <button
            onClick={onBookConsultation}
            className="btn-luxury-secondary group w-full sm:w-auto"
          >
            Book Consultation
            <CalendarCheck size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:scale-110" />
          </button>
        </div>
      </div>
    </section>
  )
}
