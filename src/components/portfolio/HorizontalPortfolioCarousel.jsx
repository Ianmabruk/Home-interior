import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'

const ASPECT_RATIO = 'aspect-[4/3]'

export const HorizontalPortfolioCarousel = memo(({ portfolio = [] }) => {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [activeIndex] = useState(0)

  const portfolioItems = useMemo(() => {
    if (!Array.isArray(portfolio)) return []
    return portfolio.filter(
      (item) => item && (item.imageUrl || item.mediaUrl || item.beforeImages?.[0] || item.afterImages?.[0])
    )
  }, [portfolio])

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10)
  }, [])

  useEffect(() => {
    updateScrollButtons()
    window.addEventListener('resize', updateScrollButtons)
    return () => window.removeEventListener('resize', updateScrollButtons)
  }, [updateScrollButtons, portfolioItems])

  const scrollByCard = useCallback((direction) => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector('article')?.offsetWidth || 320
    const scrollAmount = cardWidth + 24
    el.scrollBy({ left: direction === 'next' ? scrollAmount : -scrollAmount, behavior: 'smooth' })
  }, [])

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true)
    setStartX(e.pageX - scrollRef.current?.offsetLeft || 0)
    setScrollLeft(scrollRef.current?.scrollLeft || 0)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    e.preventDefault()
    const el = scrollRef.current
    if (!el) return
    const x = e.pageX - el.offsetLeft
    const walk = (x - startX) * 1.5
    el.scrollLeft = scrollLeft - walk
  }, [isDragging, startX, scrollLeft])

  const handleTouchStart = useCallback((e) => {
    setIsDragging(true)
    setStartX(e.touches[0].pageX - scrollRef.current?.offsetLeft || 0)
    setScrollLeft(scrollRef.current?.scrollLeft || 0)
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return
    const el = scrollRef.current
    if (!el) return
    const x = e.touches[0].pageX - el.offsetLeft
    const walk = (x - startX) * 1.5
    el.scrollLeft = scrollLeft - walk
  }, [isDragging, startX, scrollLeft])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e) => {
    const el = scrollRef.current
    if (!el) return
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) return
    e.preventDefault()
    el.scrollLeft += e.deltaX
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      scrollByCard('prev')
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      scrollByCard('next')
    }
  }, [scrollByCard])

  const handleScroll = useCallback(() => {
    updateScrollButtons()
  }, [updateScrollButtons])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <section className="bg-[var(--secondary)]/30 px-6 md:px-12 lg:px-20 py-16 md:py-24">
      <div className="container-wide">
        <div className="mb-12 animate-fade-up text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Portfolio</p>
          <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--accent)] md:text-5xl lg:text-6xl">
            Featured Projects
          </h2>
        </div>

        {portfolioItems.length === 0 ? (
          <div className="animate-fade-in flex min-h-[40vh] flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--secondary)]/30 text-[var(--primary)]/30">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <p className="font-display text-lg text-[var(--primary)]/40">No projects yet</p>
            <p className="text-sm text-[var(--primary)]/30">Portfolio images will appear here once uploaded from the admin dashboard</p>
          </div>
        ) : (
          <div className="relative">
            <div
              ref={scrollRef}
              role="listbox"
              aria-label="Portfolio gallery"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 scrollbar-hide cursor-grab active:cursor-grabbing"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {portfolioItems.map((item, index) => (
                <article
                  key={item._id || item.id}
                  role="option"
                  aria-selected={index === activeIndex}
                  tabIndex={0}
                  className="flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-[45vw] lg:w-[380px] xl:w-[420px] snap-start group"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-[var(--primary)]/5 shadow-[0_4px_20px_rgba(42,36,31,0.08)] transition-all duration-500 hover:shadow-[0_12px_40px_rgba(42,36,31,0.15)]">
                    <div className={`relative ${ASPECT_RATIO} overflow-hidden`}>
                      {item.imageUrl ? (
                        <img
                          src={getOptimizedUrl(item.imageUrl, { width: 600, crop: 'limit' })}
                          alt={item.title}
                          className="h-full w-full object-contain bg-[var(--secondary)]/10 transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                          fetchPriority={index === 0 ? 'high' : undefined}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[var(--primary)]/20">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/20 via-transparent to-transparent pointer-events-none" />
                    </div>
                    {item.category && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-widest text-[var(--primary)]">
                          {item.category}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 px-1">
                    <h3 className="font-display text-base md:text-lg font-medium text-[var(--primary)] group-hover:text-[var(--accent)] transition-colors duration-300 line-clamp-1">
                      {item.title}
                    </h3>
                    <Link
                      to={`/portfolio/${item._id || item.id}`}
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] transition-colors duration-300 hover:text-[var(--accent)]/80"
                    >
                      View Project
                      <ArrowRight size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {portfolioItems.length > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => scrollByCard('prev')}
                  disabled={!canScrollLeft}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-[var(--border)]/40 text-[var(--primary)] transition-all duration-300 hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white hover:shadow-[0_8px_24px_rgba(232,154,67,0.3)] disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Scroll portfolio left"
                >
                  <ChevronLeft size={20} strokeWidth={1.5} />
                </button>

                <div className="flex items-center gap-2" aria-hidden="true">
                  {portfolioItems.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const el = scrollRef.current
                        if (!el) return
                        const card = el.querySelector('article')
                        if (!card) return
                        el.scrollTo({ left: idx * (card.offsetWidth + 24), behavior: 'smooth' })
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === activeIndex ? 'bg-[var(--accent)] w-6' : 'bg-[var(--primary)]/20 w-2 hover:bg-[var(--primary)]/40'
                      }`}
                      aria-label={`Go to portfolio item ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => scrollByCard('next')}
                  disabled={!canScrollRight}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-[var(--border)]/40 text-[var(--primary)] transition-all duration-300 hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white hover:shadow-[0_8px_24px_rgba(232,154,67,0.3)] disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Scroll portfolio right"
                >
                  <ChevronRight size={20} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
})

export default HorizontalPortfolioCarousel