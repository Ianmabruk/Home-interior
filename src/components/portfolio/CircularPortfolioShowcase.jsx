import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'

const CIRCULAR_CARD_SIZE = {
  base: 300,
  md: 400,
  lg: 500,
}

export const CircularPortfolioShowcase = memo(({ portfolio = [], getProjectImage }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [rotateDeg, setRotateDeg] = useState(0)
  const elementRef = useRef(null)
  const intervalRef = useRef(null)

  const portfolioImages = useMemo(() => {
    if (!Array.isArray(portfolio)) return []
    return portfolio
      .filter(item => item && getProjectImage(item))
      .map(item => ({
        id: item.id,
        imageUrl: getProjectImage(item),
        title: item.title || 'Portfolio Project',
        slug: item.id
      }))
  }, [portfolio, getProjectImage])

  const totalImages = portfolioImages.length

  const goToNext = useCallback(() => {
    if (isAnimating || totalImages <= 1) return
    setIsAnimating(true)
    setRotateDeg(prev => prev + 360)
    setCurrentIndex(prev => (prev + 1) % totalImages)
    setTimeout(() => {
      setIsAnimating(false)
    }, 1500)
  }, [isAnimating, totalImages])

  const goToPrev = useCallback(() => {
    if (isAnimating || totalImages <= 1) return
    setIsAnimating(true)
    setRotateDeg(prev => prev - 360)
    setCurrentIndex(prev => (prev - 1 + totalImages) % totalImages)
    setTimeout(() => {
      setIsAnimating(false)
    }, 1500)
  }, [isAnimating, totalImages])

  useEffect(() => {
    if (totalImages <= 1) return
    intervalRef.current = setInterval(goToNext, 7000)
    return () => clearInterval(intervalRef.current)
  }, [totalImages, goToNext])

  const currentItem = portfolioImages[currentIndex]

  return (
    <section className="bg-[var(--secondary)]/30 py-20 md:py-32">
      <div className="container-wide md:px-12 lg:px-20">
        <div className="animate-fade-up mb-16 md:mb-24 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Portfolio</p>
          <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
            Featured Projects
          </h2>
        </div>

        {totalImages === 0 ? (
          <div className="animate-fade-in flex min-h-[50vh] items-center justify-center">
            <p className="font-display text-xl text-[var(--primary)]/60">No projects yet</p>
          </div>
        ) : (
          <div className="relative flex flex-col items-center">
            <div className="relative flex-shrink-0" style={{ width: '100%', maxWidth: '100%' }}>
              <div
                ref={elementRef}
                className="relative mx-auto"
                style={{
                  width: CIRCULAR_CARD_SIZE.base,
                  height: CIRCULAR_CARD_SIZE.base,
                  perspective: '1000px',
                  transform: `rotateY(${rotateDeg}deg)`,
                  transition: isAnimating ? 'transform 1.5s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
                  willChange: 'transform',
                }}
              >
                <div className="relative w-full h-full">
                  <div
                    className="absolute inset-0 rounded-full overflow-hidden"
                    style={{
                      boxShadow: '0 25px 80px rgba(42,36,31,0.12), 0 0 0 3px rgba(232,154,67,0.3)',
                      border: '3px solid #E89A43',
                      background: '#F5EFE8',
                    }}
                  >
                    {currentItem?.imageUrl ? (
                      <img
                        key={currentItem.id}
                        src={getOptimizedUrl(currentItem.imageUrl, { width: 1200, crop: 'limit' })}
                        alt={currentItem.title}
                        className="h-full w-full object-contain bg-[var(--secondary)]/10 animate-fade-in"
                        loading={currentIndex === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                        fetchPriority={currentIndex === 0 ? 'high' : undefined}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[var(--primary)]/30">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/30 via-transparent to-transparent pointer-events-none" />
                  </div>

                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center gap-3 px-6 py-3 bg-[var(--accent)] text-white rounded-[16px] shadow-[0_8px_32px_rgba(232,154,67,0.4)] whitespace-nowrap hover:scale-105 active:scale-95 transition-transform duration-200"
                    style={{ zIndex: 10 }}
                  >
                    <Link
                      to={`/portfolio/${currentItem?.slug}`}
                      className="group flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"
                      onClick={(e) => {
                        if (totalImages > 1) {
                          e.preventDefault()
                          e.stopPropagation()
                        }
                      }}
                    >
                      View Project
                      <ArrowRight size={16} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 h-12 flex-shrink-0" aria-hidden="true" />

            {totalImages > 1 && (
              <div className="mt-12 flex items-center gap-6">
                <button
                  onClick={goToPrev}
                  disabled={isAnimating}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-[var(--border)]/40 text-[var(--primary)] transition-all duration-300 hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white hover:shadow-[0_8px_24px_rgba(232,154,67,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous project"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <div className="flex items-center gap-3" role="tablist" aria-label="Project navigation">
                  {portfolioImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (index !== currentIndex && !isAnimating) {
                          setIsAnimating(true)
                          const direction = index > currentIndex ? 1 : -1
                          setRotateDeg(prev => prev + direction * 360)
                          setCurrentIndex(index)
                          setTimeout(() => {
                            setIsAnimating(false)
                          }, 1200)
                        }
                      }}
                      disabled={isAnimating}
                      className={`relative h-3 w-3 rounded-full transition-all duration-500 ${
                        index === currentIndex
                          ? 'bg-[var(--accent)] w-8 shadow-[0_0_12px_rgba(232,154,67,0.5)]'
                          : 'bg-[var(--primary)]/20 hover:bg-[var(--primary)]/40'
                      }`}
                      aria-label={`Go to project ${index + 1}`}
                      aria-selected={index === currentIndex}
                      role="tab"
                    />
                  ))}
                </div>

                <button
                  onClick={goToNext}
                  disabled={isAnimating}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-[var(--border)]/40 text-[var(--primary)] transition-all duration-300 hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white hover:shadow-[0_8px_24px_rgba(232,154,67,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next project"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
})

export default CircularPortfolioShowcase