import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Images } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { api } from '@services/api'
import { getOptimizedUrl } from '@utils/cloudinaryHelpers'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '@utils/adminEvents'
import { PageMeta } from '@hooks/usePageMeta'
import { FullscreenImageViewer } from '@components/portfolio/FullscreenImageViewer'

export const PortfolioDetailPage = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxType, setLightboxType] = useState('before')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

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
      return project.beforeImages.map((img, idx) => ({
        src: typeof img === 'string' ? img : img.url,
        type: 'before',
        index: idx,
      })).filter(Boolean)
    }
    return []
  }, [project])

  const afterImages = useMemo(() => {
    if (!project) return []
    if (project.afterImages && Array.isArray(project.afterImages)) {
      return project.afterImages.map((img, idx) => ({
        src: typeof img === 'string' ? img : img.url,
        type: 'after',
        index: idx,
      })).filter(Boolean)
    }
    return []
  }, [project])

  const heroImage = project?.imageUrl || beforeImages[0]?.src || afterImages[0]?.src || null
  const displayImages = lightboxType === 'before' ? beforeImages : afterImages

  const openLightbox = useCallback((type, idx = 0) => {
    setLightboxType(type)
    setCurrentImageIndex(idx)
    setLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
  }, [])

  const handleLightboxNext = useCallback(() => {
    if (displayImages.length === 0) return
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length)
  }, [displayImages.length])

  const handleLightboxPrev = useCallback(() => {
    if (displayImages.length === 0) return
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)
  }, [displayImages.length])

  const handleGoToIndex = useCallback((index) => {
    setCurrentImageIndex(index)
  }, [])

  const getViewerImageSrc = useCallback((img) => {
    return getOptimizedUrl(img.src, { width: 2560, crop: 'limit' })
  }, [])

  const getViewerImageAlt = useCallback((img, index) => {
    return `${project?.title || 'Project'} - ${img.type} ${index + 1}`
  }, [project])

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

      {/* Prominent Exit Page control (mobile-friendly) */}
      <div className="px-5 md:px-12 lg:px-20 pt-6 md:pt-8 flex items-center justify-between">
        <Link
          to="/portfolio"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--secondary)]/30 px-5 py-3 text-sm font-semibold text-[var(--primary)]/75 transition-all duration-300 hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/5"
        >
          <ArrowLeft size={16} strokeWidth={1.5} className="rotate-180" />
          Exit Page
        </Link>
        <Link
          to="/portfolio"
          className="text-xs font-semibold text-[var(--accent)] underline"
          aria-label="Back to portfolio"
        >
          Back to Portfolio
        </Link>
      </div>

      <div className="min-h-screen bg-[var(--bg)]">
        {/* Project Header - Two Column on Desktop */}
        <section className="px-5 md:px-12 lg:px-20 py-10 md:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Main Image */}
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-[var(--secondary)]/10 aspect-[4/3] lg:aspect-auto lg:h-full min-h-[300px]">
                {heroImage ? (
                  <img
                    src={getOptimizedUrl(heroImage, { width: 1200, crop: 'limit' })}
                    alt={project.title}
                    className="h-full w-full object-contain"
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[var(--primary)]/30">
                    <Images size={48} />
                  </div>
                )}
              </div>

              {/* Project Info */}
              <div className="flex flex-col justify-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">
                  {project.category || 'Portfolio'}
                </p>
                <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-[var(--primary)] leading-tight">
                  {project.title}
                </h1>

                {project.description && (
                  <div className="mt-6">
                    <p className="text-base md:text-lg text-[var(--primary)]/70 leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                )}

                <div className="mt-8">
                  <Link to="/portfolio" className="btn-luxury-secondary inline-flex items-center gap-2">
                    <ArrowRight size={14} strokeWidth={1.5} className="rotate-180" />
                    Back to Portfolio
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Before / After tab switcher */}
        <div className="px-5 md:px-12 lg:px-20 py-8 md:py-10">
          <div className="max-w-7xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)]/40 bg-[var(--bg)]/60 p-1.5">
              <a
                href="#before-images"
                className="rounded-full px-6 py-2.5 text-sm font-semibold text-[var(--primary)]/60 transition-all hover:text-[var(--accent)] hover:bg-[var(--accent)]/5"
              >
                BEFORE
              </a>
              <a
                href="#after-images"
                className="rounded-full px-6 py-2.5 text-sm font-semibold text-[var(--primary)]/60 transition-all hover:text-[var(--accent)] hover:bg-[var(--accent)]/5"
              >
                AFTER
              </a>
            </div>
            <p className="mt-1 text-xs text-[var(--primary)]/40">
              Use the tabs to jump between before and after project images.
            </p>
          </div>
        </div>

        {/* Before Images Section */}
        <section id="before-images" className="px-5 md:px-12 lg:px-20 py-10 md:py-16 bg-[var(--secondary)]/10">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-medium text-[var(--primary)] mb-6">Before</h2>
            {beforeImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {beforeImages.slice(0, 12).map((img, index) => (
                  <button
                    key={`before-${index}`}
                    onClick={() => openLightbox('before', index)}
                    className="relative rounded-xl overflow-hidden border border-[var(--border)]/40 bg-[var(--secondary)]/10 aspect-[4/3] hover:border-[var(--accent)]/60 active:scale-[0.98] transition-all"
                    aria-label={`View before image ${index + 1}`}
                  >
                    <img
                      src={getOptimizedUrl(img.src, { width: 600, crop: 'limit' })}
                      alt={`Before ${index + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[var(--primary)]/55">No Before images available.</p>
            )}
            {beforeImages.length > 12 && (
              <button
                onClick={() => openLightbox('before', 0)}
                className="mt-4 text-sm font-semibold text-[var(--accent)] hover:text-[var(--primary)] transition-colors"
              >
                View all {beforeImages.length} before images
              </button>
            )}
          </div>
        </section>

        {/* After Images Section */}
        <section id="after-images" className="px-5 md:px-12 lg:px-20 py-10 md:py-16">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-medium text-[var(--primary)] mb-6">After</h2>
            {afterImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {afterImages.slice(0, 12).map((img, index) => (
                <button
                  key={`after-${index}`}
                  onClick={() => openLightbox('after', index)}
                  className="relative rounded-xl overflow-hidden border border-[var(--border)]/40 bg-[var(--secondary)]/10 aspect-[4/3] hover:border-[var(--accent)]/60 active:scale-[0.98] transition-all"
                  aria-label={`View after image ${index + 1}`}
                >
                  <img
                    src={getOptimizedUrl(img.src, { width: 600, crop: 'limit' })}
                    alt={`After ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
              </div>
            ) : (
              <p className="text-[var(--primary)]/55">No After images available.</p>
            )}
            {afterImages.length > 12 && (
              <button
                onClick={() => openLightbox('after', 0)}
                className="mt-4 text-sm font-semibold text-[var(--accent)] hover:text-[var(--primary)] transition-colors"
              >
                View all {afterImages.length} after images
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Fullscreen Image Viewer */}
      <AnimatePresence>
        {lightboxOpen && (
          <FullscreenImageViewer
            images={displayImages}
            currentIndex={currentImageIndex}
            onClose={closeLightbox}
            onPrev={handleLightboxPrev}
            onNext={handleLightboxNext}
            onGoToIndex={handleGoToIndex}
            getImageSrc={getViewerImageSrc}
            getImageAlt={getViewerImageAlt}
            projectTitle={project.title}
            imageType={lightboxType}
          />
        )}
      </AnimatePresence>
    </main>
  )
}

export default PortfolioDetailPage
