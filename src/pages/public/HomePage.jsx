import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { SectionTitle } from '../../components/common/SectionTitle'
import { ProductCard } from '../../components/shop/ProductCard'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'

export const HomePage = () => {
  const [feed, setFeed] = useState({
    projects: [],
    portfolio: [],
    about: null,
    virtualDesign: [],
    products: [],
  })
  const [loading, setLoading] = useState(true)
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0)

  const loadFeed = useCallback(() => {
    api
      .get('/content/homepage')
      .then((res) => setFeed(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadFeed() }, [loadFeed])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type) loadFeed().catch(() => {})
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadFeed])

  // Auto-rotate featured projects
  useEffect(() => {
    if (feed.projects.length <= 1) return
    const timer = setInterval(() => {
      setCurrentProjectIndex((prev) => (prev + 1) % feed.projects.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [feed.projects.length])

  const featuredProject = useMemo(() => {
    return feed.projects.length > 0 ? feed.projects[currentProjectIndex] : null
  }, [feed.projects, currentProjectIndex])

  const newest = useMemo(
    () =>
      [...feed.products]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4),
    [feed.products],
  )

  const portfolioGrid = feed.portfolio.slice(0, 6)

  if (loading) {
    return (
      <div className="-mt-[88px] md:-mt-[108px]">
        <div className="skeleton h-[70vh] w-full" />
        <div className="section-pad container-wide grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-80" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="-mt-[88px] md:-mt-[108px]">

      {/* ══════════════════════════════════════════
          SECTION 1 — FEATURED PROJECT CAROUSEL
          Single featured project with auto-rotate
      ══════════════════════════════════════════ */}
      <section className="relative bg-ink py-20 md:py-28 overflow-hidden">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <div className="text-center mb-12">
            <p className="eyebrow mb-3 text-white/40">Featured Work</p>
            <h2 className="font-display text-5xl font-medium text-white md:text-7xl">Projects</h2>
            <p className="mt-4 text-base text-white/50 max-w-2xl mx-auto">
              Explore our latest interior design projects through immersive video walkthroughs.
            </p>
          </div>

          {featuredProject ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={featuredProject._id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.8 }}
                className="relative max-w-5xl mx-auto"
              >
                {featuredProject.media?.[0]?.type === 'video' || featuredProject.videoUrl ? (
                  <video
                    src={featuredProject.media?.[0]?.url || featuredProject.videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full object-cover rounded-2xl shadow-2xl"
                  />
                ) : (
                  <img
                    src={featuredProject.media?.[0]?.url || featuredProject.coverImageUrl}
                    alt={featuredProject.title}
                    className="aspect-video w-full object-cover rounded-2xl shadow-2xl"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent rounded-2xl" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
                  <p className="font-display text-3xl font-medium text-white">{featuredProject.title}</p>
                  {featuredProject.description && (
                    <p className="mt-2 text-base text-white/70 max-w-2xl mx-auto">{featuredProject.description}</p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="aspect-video w-full rounded-2xl bg-charcoal flex items-center justify-center">
              <p className="font-display text-3xl text-white/20">No featured projects yet</p>
            </div>
          )}

          {feed.projects.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setCurrentProjectIndex((prev) => (prev - 1 + feed.projects.length) % feed.projects.length)}
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                aria-label="Previous project"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex gap-2">
                {feed.projects.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentProjectIndex(i)}
                    className={`h-2 rounded-full transition ${i === currentProjectIndex ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrentProjectIndex((prev) => (prev + 1) % feed.projects.length)}
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                aria-label="Next project"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          <div className="mt-10 text-center">
            <Link to="/projects" className="inline-flex items-center justify-center gap-2 rounded-none border border-white/30 px-8 py-3.5 text-2xs font-medium uppercase tracking-widest text-white transition-all duration-300 hover:bg-white hover:text-ink">
              View All Projects <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2 — PORTFOLIO PREVIEW
      ══════════════════════════════════════════ */}
      <section className="section-pad bg-linen">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <div className="mb-12 flex items-end justify-between">
            <SectionTitle eyebrow="Portfolio" title="Curated Interiors" align="left" />
            <Link
              to="/portfolio"
              className="hidden items-center gap-2 text-2xs font-medium uppercase tracking-widest text-ink/45 transition hover:text-ink md:inline-flex"
            >
              View Full Portfolio <ArrowRight size={13} strokeWidth={1.5} />
            </Link>
          </div>

          {portfolioGrid.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                {portfolioGrid.map((item, i) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.6, delay: i * 0.07 }}
                    className={`group relative overflow-hidden bg-sand ${
                      i === 0 ? 'col-span-2 md:col-span-1 md:row-span-2' : ''
                    }`}
                  >
                    <img
                      src={item.images?.[0]?.url || item.imageUrl}
                      alt={item.title}
                      className={`w-full object-cover transition duration-700 group-hover:scale-105 ${
                        i === 0 ? 'h-[320px] md:h-full md:min-h-[500px]' : 'h-52 md:h-60'
                      }`}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-ink/0 transition-all duration-500 group-hover:bg-ink/20" />
                    <div className="absolute bottom-0 left-0 right-0 translate-y-full p-4 transition-transform duration-400 group-hover:translate-y-0">
                      <p className="font-display text-xl font-medium text-white drop-shadow">
                        {item.title}
                      </p>
                      {item.category && (
                        <p className="text-2xs font-medium uppercase tracking-widest text-white/65">
                          {item.category}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 text-center">
                <Link to="/portfolio" className="btn-outline">
                  View Full Portfolio <ArrowRight size={14} strokeWidth={1.5} />
                </Link>
              </div>
            </>
          ) : (
            <div className="py-16 text-center">
              <p className="font-display text-3xl text-ink/20">No portfolio items yet</p>
              <p className="mt-2 text-sm text-ink/35">Upload images from the Admin Dashboard</p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 3 — SHOP / NEW ARRIVALS
      ══════════════════════════════════════════ */}
      {newest.length > 0 && (
        <section className="section-pad bg-cream">
          <div className="container-wide px-6 md:px-12 lg:px-20">
            <div className="mb-12 flex items-end justify-between">
              <SectionTitle eyebrow="Shop" title="New Arrivals" align="left" />
              <Link
                to="/shop"
                className="hidden items-center gap-2 text-2xs font-medium uppercase tracking-widest text-ink/45 transition hover:text-ink md:inline-flex"
              >
                Shop All <ArrowRight size={13} strokeWidth={1.5} />
              </Link>
            </div>
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {newest.map((product, i) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
            <div className="mt-10 text-center md:hidden">
              <Link to="/shop" className="btn-outline">Shop All</Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          SECTION 4 — ABOUT
      ══════════════════════════════════════════ */}
      {feed.about && (
        <section className="section-pad bg-white">
          <div className="container-wide px-6 md:px-12 lg:px-20">
            <div className="grid items-center gap-16 md:grid-cols-2">
              {/* Image */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                {feed.about.aboutImageUrl ? (
                  <img
                    src={feed.about.aboutImageUrl}
                    alt="About HOK Interior Designs"
                    className="aspect-[4/5] w-full object-cover bg-sand"
                    loading="lazy"
                  />
                ) : (
                  <div className="aspect-[4/5] w-full bg-sand flex items-center justify-center">
                    <p className="text-sm text-ink/30">No image uploaded</p>
                  </div>
                )}
                <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full border border-sand/50" />
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, delay: 0.15 }}
              >
                <p className="eyebrow mb-4">About HOK</p>
                <h2 className="font-display text-5xl font-medium leading-tight text-ink md:text-6xl">
                  {feed.about.vision || 'Crafting Spaces That Inspire'}
                </h2>
                <p className="mt-6 text-base leading-relaxed text-ink/55">
                  {feed.about.story || feed.about.companyDescription}
                </p>
                {feed.about.mission && (
                  <div className="mt-6 border-l-2 border-clay pl-5">
                    <p className="text-sm leading-relaxed text-ink/55">{feed.about.mission}</p>
                  </div>
                )}
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link to="/about" className="btn-primary">
                    Learn More <ArrowRight size={14} strokeWidth={1.5} />
                  </Link>
                  <Link to="/portfolio" className="btn-outline">
                    Our Work
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
