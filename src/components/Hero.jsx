import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api'
import { getOptimizedUrl } from '../utils/cloudinaryHelpers'

const SLIDE_DURATION = 8000
const FADE_DURATION = 2.5

export const Hero = ({ onBookConsultation }) => {
  const [images, setImages] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const intervalRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/content/homepage')
        const data = res.data || {}

        const carouselImages = []

        if (data.about?.aboutImageUrl) {
          carouselImages.push({
            url: data.about.aboutImageUrl,
            alt: 'HOK Interior Design Studio',
            priority: true
          })
        }

        if (data.portfolio && Array.isArray(data.portfolio)) {
          data.portfolio
            .filter(item => item.imageUrl)
            .slice(0, 5)
            .forEach(item => {
              carouselImages.push({
                url: item.imageUrl,
                alt: item.title || 'Luxury interior design project'
              })
            })
        }

        if (data.projects && Array.isArray(data.projects)) {
          data.projects
            .filter(item => item.coverImageUrl || item.media?.[0]?.url)
            .slice(0, 4)
            .forEach(item => {
              carouselImages.push({
                url: item.coverImageUrl || item.media?.[0]?.url,
                alt: item.title || 'Luxury interior design project'
              })
            })
        }

        if (carouselImages.length > 0) {
          setImages(carouselImages)
        }
      } catch {
        // Silently fail - fallback image will be used
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    if (images.length <= 1 || isPaused) return
    intervalRef.current = setInterval(next, SLIDE_DURATION)
    return () => clearInterval(intervalRef.current)
  }, [images.length, next, isPaused])

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const currentImage = images[currentIndex]
  const fallbackImage = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&h=1080&fit=crop'
  const activeImage = currentImage?.url || fallbackImage

  return (
    <section
      className="relative w-full h-screen min-h-[700px] overflow-hidden bg-luxury-text"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Hero image carousel"
    >
      {/* Background Slides - Full Width, Edge to Edge */}
      {!loading && images.length > 0 && (
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: FADE_DURATION, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <motion.img
                src={getOptimizedUrl(activeImage, { width: 1920, crop: 'limit' })}
                alt={currentImage?.alt || 'Luxury interior design'}
                className="h-full w-full object-cover ken-burns"
                loading="eager"
                decoding="async"
                style={{
                  transform: `translate3d(${mousePosition.x * 15}px, ${mousePosition.y * 15}px, 0) scale(1.02)`
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Fallback */}
      {(loading || images.length === 0) && (
        <div className="absolute inset-0">
          <motion.img
            src={getOptimizedUrl(fallbackImage, { width: 1920, crop: 'limit' })}
            alt="Luxury interior design"
            className="h-full w-full object-cover ken-burns"
            loading="eager"
            decoding="async"
          />
        </div>
      )}

      {/* Buttons Only - Lower Position */}
      <div className="relative z-10 flex h-full items-end justify-center px-6 md:px-12 lg:px-20 pb-20 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl w-full flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/portfolio"
            className="btn-luxury-primary group w-full sm:w-auto"
          >
            View Portfolio
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
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
        </motion.div>
      </div>

      {/* Dots Indicator - Subtle */}
      {images.length > 1 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className={`relative h-1.5 rounded-full transition-all duration-700 ${idx === currentIndex ? 'w-10 bg-orange-accent' : 'w-2 bg-white/40 hover:bg-white/60'}`}
              aria-label={`Go to slide ${idx + 1}`}
            >
              {idx === currentIndex && (
                <motion.div
                  layoutId="activeDot"
                  className="absolute inset-0 rounded-full bg-orange-accent"
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}