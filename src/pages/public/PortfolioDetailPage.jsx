import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight, Images } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@services/api'
import { getOptimizedUrl } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { useZoom } from '@hooks/useZoom'

export const PortfolioDetailPage = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxType, setLightboxType] = useState('before')

  const { style: zoomStyle, handleWheel, handleMouseDown, handleTouchStart, reset, handleTouchEnd } = useZoom()

  const loadProject = useCallback(async () => {
    if (!id) return
    try {
      const res = await api.get(`/portfolio/${id}`)
      setProject(res.data || null)
    } catch (err) {
      console.warn('[PORTFOLIO DETAIL] Failed to load:', err?.message)
      setProject(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'portfolio-changed') loadProject()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadProject])

  const beforeImages = useMemo(() => {
    if (!project) return []
    if (project.beforeImages && Array.isArray(project.beforeImages)) {
      return project.beforeImages.map((img) => (typeof img === 'string' ? img : img.url)).filter(Boolean)
    }
    return []
  }, [project])

  const afterImages = useMemo(() => {
    if (!project) return []
    if (project.afterImages && Array.isArray(project.afterImages)) {
      return project.afterImages.map((img) => (typeof img === 'string' ? img : img.url)).filter(Boolean)
    }
    return []
  }, [project])

  const heroImage = project?.imageUrl || beforeImages[0] || afterImages[0] || null

  const displayImages = lightboxType === 'before' ? beforeImages : afterImages

  const handleLightboxNext = () => {
    if (displayImages.length === 0) return
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length)
  }

  const handleLightboxPrev = () => {
    if (displayImages.length === 0) return
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)
  }

  const openLightbox = (type, idx = 0) => {
    setLightboxType(type)
    setCurrentImageIndex(idx)
    setLightboxOpen(true)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      </main>
    )
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-display text-3xl font-semibold text-[var(--primary)] mb-3">Project Not Found</h1>
          <p className="text-[var(--primary)]/60 mb-6">The portfolio project you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link to="/portfolio" className="btn-luxury-primary inline-flex items-center gap-2">
            Back to Portfolio
            <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main>
      <PageMeta
        title={`${project.title} — HOK Interior Designs`}
        description={project.description || `Explore ${project.title} portfolio project.`}
        image={heroImage}
      />
      <div className="min-h-screen bg-[var(--bg)]">
        {/* Hero Image */}
        <section className="relative">
          <div className="relative aspect-[16/10] md:aspect-[3/2] overflow-hidden">
            <div
              className="absolute inset-0"
              style={zoomStyle}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
               onTouchMove={(e) => { try { e.preventDefault() } catch {} }}
              onTouchEnd={handleTouchEnd}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
              <AnimatePresence mode="wait">
                {heroImage ? (
                  <motion.img
                    key="hero"
                    src={getOptimizedUrl(heroImage, { width: 1920, crop: 'limit' })}
                    alt={project.title}
                    className="h-full w-full object-contain bg-[var(--secondary)]/5"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[var(--bg)] to-[var(--secondary)]/30 flex items-center justify-center text-[var(--primary)]/30">
                    <Images size={48} />
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Project Details */}
        <section className="px-6 md:px-12 lg:px-20 py-16 md:py-24">
          <div className="container-wide max-w-4xl mx-auto">
            <div className="grid gap-12">
              {/* Project Header */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">
                  {project.category || 'Portfolio'}
                </p>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-[var(--primary)] leading-tight">
                  {project.title}
                </h1>
                {project.location && (
                  <p className="mt-3 text-base md:text-lg text-[var(--primary)]/60 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {project.location}
                  </p>
                )}
              </div>

              {/* Description */}
              {project.description && (
                <div>
                  <p className="text-lg md:text-xl text-[var(--primary)]/70 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              )}

              {/* Before Images Section */}
              {beforeImages.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-medium text-[var(--primary)] mb-6">Before</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {beforeImages.map((img, index) => (
                      <div
                        key={`before-${index}`}
                        className="relative rounded-xl overflow-hidden border border-[var(--border)]/40 bg-[var(--secondary)]/10 cursor-zoom-in"
                        onClick={() => openLightbox('before', index)}
                      >
                        <img
                          src={getOptimizedUrl(img, { width: 400, crop: 'limit' })}
                          alt={`Before ${index + 1}`}
                          className="h-32 w-full object-contain p-2"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* After Images Section */}
              {afterImages.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-medium text-[var(--primary)] mb-6">After</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {afterImages.map((img, index) => (
                      <div
                        key={`after-${index}`}
                        className="relative rounded-xl overflow-hidden border border-[var(--border)]/40 bg-[var(--secondary)]/10 cursor-zoom-in"
                        onClick={() => openLightbox('after', index)}
                      >
                        <img
                          src={getOptimizedUrl(img, { width: 400, crop: 'limit' })}
                          alt={`After ${index + 1}`}
                          className="h-32 w-full object-contain p-2"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Features */}
              {project.features && project.features.length > 0 && (
                <div>
                  <h3 className="font-display text-2xl md:text-3xl font-medium text-[var(--primary)] mb-6">Key Features</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-[var(--border)]/40">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className="text-[var(--primary)]/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specifications */}
              {project.specifications && Object.keys(project.specifications).length > 0 && (
                <div>
                  <h3 className="font-display text-2xl md:text-3xl font-medium text-[var(--primary)] mb-6">Specifications</h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(project.specifications).map(([key, value]) => (
                      <div key={key} className="p-4 bg-white rounded-2xl border border-[var(--border)]/40">
                        <dt className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-1">{key}</dt>
                        <dd className="text-[var(--primary)]/80">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Back to Portfolio */}
              <div className="pt-6 border-t border-[var(--border)]/40">
                <Link to="/portfolio" className="btn-luxury-secondary inline-flex items-center gap-2">
                  Back to Portfolio
                  <ArrowRight size={14} strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {lightboxOpen && displayImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[var(--primary)]/95 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Fullscreen image gallery"
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Close gallery"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleLightboxPrev() }}
              className="absolute left-6 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors hidden md:block"
              aria-label="Previous image"
            >
              <ChevronLeft size={28} strokeWidth={1.5} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleLightboxNext() }}
              className="absolute right-6 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors hidden md:block"
              aria-label="Next image"
            >
              <ChevronRight size={28} strokeWidth={1.5} />
            </button>

            <div
              style={zoomStyle}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
               onTouchMove={(e) => { try { e.preventDefault() } catch {} }}
              onTouchEnd={handleTouchEnd}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              className="relative max-h-[90vh] max-w-[90vw]"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={getOptimizedUrl(displayImages[currentImageIndex], { width: 2560, crop: 'limit' })}
                  alt={`${project.title} - ${lightboxType} ${currentImageIndex + 1}`}
                  className="max-h-[90vh] max-w-[90vw] object-contain"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </AnimatePresence>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {displayImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); reset() }}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default PortfolioDetailPage
