import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { getOptimizedUrl } from '@utils/cloudinaryHelpers'

export const FullscreenImageViewer = ({
  images = [],
  currentIndex = 0,
  onClose,
  onPrev,
  onNext,
  onGoToIndex,
  getImageSrc,
  getImageAlt,
  projectTitle = '',
  imageType = 'image',
}) => {
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [showThumbnails, setShowThumbnails] = useState(true)
  const thumbnailRef = useRef(null)

  const totalImages = images.length

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (totalImages <= 1) return
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50
    if (Math.abs(diff) > threshold) {
      setIsNavigating(true)
      if (diff > 0) {
        onNext()
      } else {
        onPrev()
      }
      setTimeout(() => setIsNavigating(false), 300)
    }
    touchStartX.current = 0
    touchEndX.current = 0
  }, [totalImages, onNext, onPrev])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft') onPrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onNext, onPrev])

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  useEffect(() => {
    if (thumbnailRef.current) {
      const activeThumb = thumbnailRef.current.children[currentIndex]
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [currentIndex])

  if (totalImages === 0) return null

  const currentImage = images[currentIndex]
  const imageSrc = getImageSrc ? getImageSrc(currentImage, currentIndex) : currentImage.src
  const imageAlt = getImageAlt ? getImageAlt(currentImage, currentIndex) : `${projectTitle} - ${imageType} ${currentIndex + 1}`

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] bg-black flex flex-col w-screen h-screen overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen image viewer"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-20 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 text-white hover:bg-white/20 active:bg-white/30 transition-colors"
        aria-label="Close image viewer"
      >
        <X size={28} strokeWidth={1.5} className="md:hidden" />
        <X size={32} strokeWidth={1.5} className="hidden md:block" />
      </button>

      {/* Image Counter */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
        <span className="text-white/90 text-sm md:text-base font-medium bg-black/30 px-4 py-2 rounded-full">
          {currentIndex + 1} / {totalImages}
        </span>
      </div>

      {/* Toggle Thumbnails Button */}
      {totalImages > 1 && (
        <button
          onClick={() => setShowThumbnails((prev) => !prev)}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 md:hidden px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-medium"
          aria-label={showThumbnails ? 'Hide thumbnails' : 'Show thumbnails'}
        >
          {showThumbnails ? 'Hide' : 'Show'} thumbnails
        </button>
      )}

      {/* Previous Button */}
      {totalImages > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          disabled={isNavigating}
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 text-white hover:bg-white/20 active:bg-white/30 transition-colors disabled:opacity-50"
          aria-label="Previous image"
        >
          <ChevronLeft size={32} strokeWidth={1.5} className="md:hidden" />
          <ChevronLeft size={40} strokeWidth={1.5} className="hidden md:block" />
        </button>
      )}

      {/* Next Button */}
      {totalImages > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          disabled={isNavigating}
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 text-white hover:bg-white/20 active:bg-white/30 transition-colors disabled:opacity-50"
          aria-label="Next image"
        >
          <ChevronRight size={32} strokeWidth={1.5} className="md:hidden" />
          <ChevronRight size={40} strokeWidth={1.5} className="hidden md:block" />
        </button>
      )}

      {/* Image Container */}
      <div
        className="flex-1 flex items-center justify-center relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-y' }}
      >
        <motion.img
          key={currentIndex}
          src={imageSrc}
          alt={imageAlt}
          className="max-w-[100vw] max-h-[100dvh] w-auto h-auto object-contain"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          draggable={false}
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Thumbnails Strip */}
      {totalImages > 1 && showThumbnails && (
        <div className="z-10 bg-black/60 backdrop-blur-sm">
          <div
            ref={thumbnailRef}
            className="flex items-center gap-2 overflow-x-auto px-4 py-3 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {images.map((img, index) => {
              const thumbSrc = getImageSrc ? getImageSrc(img, index) : img.src
              const isActive = index === currentIndex
              return (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); onGoToIndex && onGoToIndex(index) }}
                  className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    isActive ? 'border-white w-16 h-16 md:w-20 md:h-20 opacity-100' : 'border-transparent w-12 h-12 md:w-16 md:h-16 opacity-60 hover:opacity-100'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                >
                  <img
                    src={getOptimizedUrl(thumbSrc, { width: 200, crop: 'limit' })}
                    alt={`Thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default FullscreenImageViewer
