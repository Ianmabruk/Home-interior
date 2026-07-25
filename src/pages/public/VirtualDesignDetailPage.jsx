import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, Link } from 'react-router-dom'
import { X, Play, CalendarCheck, ArrowRight } from 'lucide-react'
import { api } from '../../services/api'
import { getOptimizedUrl, getOptimizedVideoUrl, getVideoPosterUrl } from '../../utils/cloudinaryHelpers'

export const VirtualDesignDetailPage = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [imageFullscreen, setImageFullscreen] = useState(null)
  const [videoFullscreen, setVideoFullscreen] = useState(null)

  const [zoomScale, setZoomScale] = useState(1)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const imageRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/virtual-design/${id}`)
        setProject(res.data)
      } catch (err) {
        console.warn('[VIRTUAL DETAIL] Failed to load:', err?.message)
        setProject(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (project) document.body.style.overflow = ''
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [project])

  useEffect(() => {
    setTimeout(() => {
      setGalleryIndex(0)
    }, 0)
  }, [project])

  const closeImageModal = useCallback(() => {
    setImageFullscreen(null)
    setGalleryIndex(0)
    setZoomScale(1)
    setZoomPosition({ x: 0, y: 0 })
  }, [])

  const closeVideoModal = () => { setVideoFullscreen(null) }

  useEffect(() => {
    setTimeout(() => {
      setZoomScale(1)
      setZoomPosition({ x: 0, y: 0 })
      isDragging.current = false
    }, 0)
  }, [galleryIndex])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!imageFullscreen) return
      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          closeImageModal()
          break
        case 'ArrowLeft':
          e.preventDefault()
          setGalleryIndex((prev) => (prev === 0 ? 0 : prev - 1))
          break
        case 'ArrowRight':
          e.preventDefault()
          setGalleryIndex((prev) => (prev === 0 ? 0 : prev + 1))
          break
      }
    }
    if (imageFullscreen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [imageFullscreen, closeImageModal])

  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  const handleTouchStart = (e) => {
    if (!imageFullscreen) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    if (!imageFullscreen || touchStartX.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const diffX = touchStartX.current - touchEndX
    const diffY = touchStartY.current - touchEndY
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        setGalleryIndex((prev) => (prev === 0 ? 0 : prev - 1))
      } else {
        setGalleryIndex((prev) => (prev === 0 ? 0 : prev + 1))
      }
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const handleWheel = (e) => {
    if (!imageFullscreen) return
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setZoomScale((prev) => {
        const newScale = Math.min(Math.max(prev - e.deltaY * 0.001, 1), 4)
        return newScale
      })
    }
  }

  const handleMouseDown = (e) => {
    if (zoomScale <= 1) return
    isDragging.current = true
    dragStart.current = { x: e.clientX - zoomPosition.x, y: e.clientY - zoomPosition.y }
    if (imageRef.current) imageRef.current.style.cursor = 'grabbing'
  }

  const handleMouseMove = (e) => {
    if (!isDragging.current || zoomScale <= 1) return
    setZoomPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    })
  }

  const handleMouseUp = () => {
    isDragging.current = false
    if (imageRef.current) imageRef.current.style.cursor = 'grab'
  }

  const handleDoubleClick = () => {
    setZoomScale((prev) => (prev > 1 ? 1 : 2))
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)]">
        <section className="py-16 md:py-24 px-6 md:px-12 lg:px-20">
          <div className="container-wide text-center">
            <div className="mb-12 md:mb-16 flex flex-col items-center">
              <div className="relative w-[150px] h-[150px] mx-auto mb-8">
                <div className="w-full h-full rounded-full bg-[var(--secondary)]/30 border-4 border-white flex items-center justify-center">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--primary)]/30" aria-hidden="true">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </div>
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-normal text-[var(--primary)] leading-tight">
                Loading...
              </h1>
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[var(--bg)]">
        <div className="container-wide px-6 md:px-12 lg:px-20 py-20 text-center">
          <h1 className="font-display text-4xl text-[var(--primary)]">Project Not Found</h1>
          <p className="mt-4 text-sm text-[var(--primary)]/55">The virtual design you are looking for does not exist.</p>
          <Link to="/virtual-design" className="btn-luxury-primary mt-6 inline-block">Back to Virtual Designs</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      {/* Gallery Section - Vertical Stack */}
      {project.galleryMedia && project.galleryMedia.length > 0 && (
        <section className="section-pad bg-[var(--bg)] pt-8">
          <div className="container-wide px-6 md:px-12 lg:px-20">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
              className="grid gap-8 grid-cols-1"
            >
              {project.galleryMedia.map((media, idx) => (
                <motion.div
                  key={idx}
                  variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } }}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-3xl bg-white border border-[var(--border)] shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={media.url}
                        alt={`${project.title} gallery ${idx + 1}`}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      {media.type === 'video' && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <button
                            onClick={(e) => { e.stopPropagation(); setVideoFullscreen({ videoUrl: media.url, title: `${project.title} - Gallery ${idx + 1}`, category: media.type }) }}
                            className="absolute right-3 bottom-3 flex h-11 w-11 items-center justify-center bg-white/90 text-[var(--primary)] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white shadow-lg hover:scale-110"
                            aria-label="Play video"
                          >
                            <Play size={20} strokeWidth={1.5} className="ml-1" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Project Details */}
      <section className="section-pad bg-[var(--bg)]">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-16 md:mt-24 max-w-3xl mx-auto text-center"
          >
            {project.description && (
              <div className="mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-normal text-[var(--primary)] mb-4">Description</h2>
                <p className="text-base leading-relaxed text-[var(--primary)]/70">{project.description}</p>
              </div>
            )}

            {/* Media Type Badge */}
            <div className="mb-12">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                project.mediaType === 'video'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {project.mediaType === 'video' ? 'Video' : 'Image'}
              </span>
            </div>

            {/* Conversion CTA */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-consultation'))}
                className="group btn-luxury-primary px-8 py-4 text-[11px] rounded-xl"
              >
                Book Consultation
                <CalendarCheck size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:scale-110" />
              </button>
              <Link
                to="/contact"
                className="group btn-luxury-secondary px-8 py-4 text-[11px] rounded-xl"
              >
                Contact Us
                <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Image Fullscreen Modal */}
      <AnimatePresence>
        {imageFullscreen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-[var(--primary)]/98 backdrop-blur-sm"
              onClick={closeImageModal}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-4 md:inset-10 lg:inset-20 z-50 bg-white rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.3)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="image-fullscreen-title"
            >
              <button
                onClick={closeImageModal}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur text-[var(--primary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-all duration-300"
                aria-label="Close"
              >
                <X size={20} strokeWidth={2} />
              </button>

              <div className="relative h-full w-full flex items-center justify-center p-4" onWheel={handleWheel}>
                <img
                  ref={imageRef}
                  src={getOptimizedUrl(imageFullscreen.mediaUrl, { width: 1920 })}
                  alt={imageFullscreen.title}
                  className="max-h-[80vh] max-w-full object-contain cursor-grab"
                  style={{
                    transform: `translate(${zoomPosition.x}px, ${zoomPosition.y}px) scale(${zoomScale})`,
                    transformOrigin: 'center center',
                    transition: zoomScale > 1 ? 'none' : 'transform 0.1s ease-out',
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onDoubleClick={handleDoubleClick}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-[var(--primary)]/90 to-transparent text-white">
                <h2 id="image-fullscreen-title" className="font-display text-3xl md:text-4xl font-normal leading-tight">{imageFullscreen.title}</h2>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Video Fullscreen Modal */}
      <AnimatePresence>
        {videoFullscreen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-[var(--primary)]/98 backdrop-blur-sm"
              onClick={closeVideoModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-4 md:inset-10 lg:inset-20 z-50 bg-white rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.3)] max-w-6xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="video-fullscreen-title"
            >
              <button
                onClick={closeVideoModal}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur text-[var(--primary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-all duration-300"
                aria-label="Close"
              >
                <X size={20} strokeWidth={2} />
              </button>
              <div className="relative h-[70vh] w-full">
                <video
                  src={getOptimizedVideoUrl(videoFullscreen.videoUrl, { width: 1280 })}
                  poster={getVideoPosterUrl(videoFullscreen.videoUrl, { width: 1280 })}
                  controls
                  autoPlay
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain rounded-2xl shadow-2xl"
                />
              </div>
              <div className="p-6 md:p-8 bg-[var(--bg)]/95 backdrop-blur-sm">
                <h2 id="video-fullscreen-title" className="font-display text-3xl font-normal text-[var(--primary)]">{videoFullscreen.title}</h2>
                {videoFullscreen.description && (
                  <p className="mt-3 text-sm text-[var(--primary)]/60 leading-relaxed">{videoFullscreen.description}</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
