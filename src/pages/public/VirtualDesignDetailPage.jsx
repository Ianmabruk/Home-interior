import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowUpRight, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@services/api'
import { getOptimizedUrl } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { useZoom } from '@hooks/useZoom'

export const VirtualDesignDetailPage = () => {
  const { id } = useParams()
  const [design, setDesign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const { style: zoomStyle, handleWheel, handleMouseDown, handleTouchStart, handleTouchEnd } = useZoom()

  const loadDesign = useCallback(async () => {
    if (!id) return
    try {
      const res = await api.get(`/virtual-design/${id}`)
      setDesign(res.data || null)
    } catch (err) {
      console.warn('[VIRTUAL DESIGN DETAIL] Failed to load:', err?.message)
      setDesign(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadDesign()
  }, [loadDesign])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'virtual-changed') loadDesign()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadDesign])

  const images = useMemo(() => {
    if (!design) return []
    const imgArray = []
    if (design.imageUrl || design.mediaUrl) imgArray.push(design.imageUrl || design.mediaUrl)
    if (design.galleryImages && design.galleryImages.length > 0) {
      design.galleryImages.forEach((img) => imgArray.push(typeof img === 'string' ? img : img.url))
    }
    return [...new Set(imgArray.filter(Boolean))]
  }, [design])

  const handleLightboxNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const handleLightboxPrev = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
      </main>
    )
  }

  if (!design) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-display text-3xl font-semibold text-[var(--primary)] mb-3">Project Not Found</h1>
          <p className="text-[var(--primary)]/60 mb-6">The virtual design project you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link to="/virtual-design" className="btn-luxury-primary inline-flex items-center gap-2">
            Back to Virtual Designs
            <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main>
      <PageMeta
        title={`${design.title} — HOK Interior Designs`}
        description={design.description || `Explore ${design.title} virtual design project.`}
        image={images[0]}
      />
      <div className="min-h-screen bg-[var(--bg)]">
        {/* Hero Gallery */}
        <section className="relative">
          <div className="relative aspect-[16/10] md:aspect-[3/2] overflow-hidden">
            <div
              className="absolute inset-0"
              style={zoomStyle}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
               onTouchMove={(e) => { try { e.preventDefault() } catch { /* noop */ } }}
              onTouchEnd={handleTouchEnd}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={getOptimizedUrl(images[currentImageIndex], { width: 1920, crop: 'limit' })}
                  alt={`${design.title} - Image ${currentImageIndex + 1}`}
                  className="h-full w-full object-cover"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </AnimatePresence>
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={handleLightboxPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-[var(--primary)] shadow-lg hover:bg-white transition-colors md:left-8"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} strokeWidth={1.5} />
                </button>
                <button
                  onClick={handleLightboxNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-[var(--primary)] shadow-lg hover:bg-white transition-colors md:right-8"
                  aria-label="Next image"
                >
                  <ChevronRight size={24} strokeWidth={1.5} />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 md:bottom-8">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-2 w-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            <button
              onClick={() => { setLightboxOpen(true); setCurrentImageIndex(0) }}
              className="absolute bottom-4 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-[var(--primary)] shadow-lg hover:bg-white transition-colors md:bottom-8 md:right-8"
              aria-label="Open fullscreen gallery"
            >
              <ArrowUpRight size={24} strokeWidth={1.5} />
            </button>
          </div>

          {images.length > 1 && (
            <div className="mt-6 px-6 md:px-12 lg:px-20">
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 h-20 w-28 md:h-24 md:w-32 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      index === currentImageIndex ? 'border-[var(--accent)] shadow-[0_0_0_2px_rgba(232,154,67,0.3)]' : 'border-transparent hover:border-[var(--accent)]/40'
                    }`}
                    aria-label={`View image ${index + 1}`}
                    aria-current={index === currentImageIndex ? 'true' : 'false'}
                  >
                    <img
                      src={getOptimizedUrl(img, { width: 200, crop: 'fill' })}
                      alt={`${design.title} - Image ${index + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Project Details */}
        <section className="px-6 md:px-12 lg:px-20 py-16 md:py-24">
          <div className="container-wide">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-10">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">{design.category || 'Virtual Design'}</p>
                  <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-[var(--primary)] leading-tight">
                    {design.title}
                  </h1>
                  {design.location && (
                    <p className="mt-3 text-base md:text-lg text-[var(--primary)]/60 flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {design.location}
                    </p>
                  )}
                </div>

                {design.description && (
                  <div className="prose prose-lg max-w-none text-[var(--primary)]/70">
                    <p className="leading-relaxed">{design.description}</p>
                  </div>
                )}

                {design.features && design.features.length > 0 && (
                  <div>
                    <h3 className="font-display text-2xl md:text-3xl font-medium text-[var(--primary)] mb-6">Key Features</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {design.features.map((feature, index) => (
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

                {design.specifications && Object.keys(design.specifications).length > 0 && (
                  <div>
                    <h3 className="font-display text-2xl md:text-3xl font-medium text-[var(--primary)] mb-6">Specifications</h3>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(design.specifications).map(([key, value]) => (
                        <div key={key} className="p-4 bg-white rounded-2xl border border-[var(--border)]/40">
                          <dt className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-1">{key}</dt>
                          <dd className="text-[var(--primary)]/80">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="sticky top-24 bg-white rounded-3xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)]">
                  <h3 className="font-display text-xl font-medium text-[var(--primary)] mb-6">Project Inquiry</h3>
                  <p className="text-[var(--primary)]/60 mb-6">Interested in this virtual design? Get in touch to discuss your project.</p>
                  <Link
                    to="/contact"
                    className="btn-luxury-primary w-full inline-flex items-center justify-center gap-2"
                  >
                    Contact Us
                    <ArrowRight size={14} strokeWidth={1.5} />
                  </Link>
                </div>

                {design.relatedProjects && design.relatedProjects.length > 0 && (
                  <div>
                    <h3 className="font-display text-xl font-medium text-[var(--primary)] mb-4">Related Projects</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {design.relatedProjects.slice(0, 2).map((related, index) => (
                        <Link
                          key={related.id || index}
                           to={`/virtual-design/${related.id}`}
                          className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-[var(--secondary)]/30"
                        >
                          {related.imageUrl && (
                            <img
                              src={getOptimizedUrl(related.imageUrl, { width: 400, crop: 'limit' })}
                              alt={related.title}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/70 via-transparent to-transparent flex items-end p-4">
                            <h4 className="font-display text-lg font-medium text-white w-full">
                              {related.title}
                            </h4>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Fullscreen Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[var(--primary)]/95 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Fullscreen gallery"
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
               onTouchMove={(e) => { try { e.preventDefault() } catch { /* noop */ } }}
              onTouchEnd={handleTouchEnd}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              className="relative max-h-[90vh] max-w-[90vw]"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={getOptimizedUrl(images[currentImageIndex], { width: 2560, crop: 'limit' })}
                  alt={`${design.title} - Image ${currentImageIndex + 1}`}
                  className="max-h-[90vh] max-w-[90vw] object-contain"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </AnimatePresence>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index) }}
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

export default VirtualDesignDetailPage