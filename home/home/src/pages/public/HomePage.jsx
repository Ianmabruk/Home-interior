import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SectionTitle } from '../../components/common/SectionTitle'
import { ProductCard } from '../../components/shop/ProductCard'
import { api } from '../../services/api'

const HERO_INTERVAL = 6000

export const HomePage = () => {
  const [feed, setFeed] = useState({ projects: [], portfolio: [], about: null, virtualDesign: [], products: [] })
  const [loading, setLoading] = useState(true)
  const [heroIndex, setHeroIndex] = useState(0)
  const timerRef = useRef(null)

  const loadFeed = useCallback(() => {
    api
      .get('/content/homepage')
      .then((res) => setFeed(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const heroMedia = useMemo(() => {
    const items = []
    feed.projects.forEach((project) => {
      if (Array.isArray(project.media) && project.media.length) {
        project.media.forEach((m) =>
          items.push({ ...m, title: project.title, description: project.description }),
        )
        return
      }
      if (project.videoUrl) {
        items.push({ type: 'video', url: project.videoUrl, title: project.title, description: project.description })
      }
      if (project.coverImageUrl) {
        items.push({ type: 'image', url: project.coverImageUrl, title: project.title, description: project.description })
      }
    })
    return items
  }, [feed.projects])

  useEffect(() => {
    if (heroMedia.length < 2) return
    timerRef.current = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroMedia.length)
    }, HERO_INTERVAL)
    return () => window.clearInterval(timerRef.current)
  }, [heroMedia.length])

  const goToHero = (index) => {
    window.clearInterval(timerRef.current)
    setHeroIndex(index)
    timerRef.current = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroMedia.length)
    }, HERO_INTERVAL)
  }

  const newest = useMemo(
    () => [...feed.products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4),
    [feed.products],
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="h-[78vh] min-h-[520px] w-full animate-pulse rounded-3xl bg-beige" />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-beige" />
          ))}
        </div>
      </div>
    )
  }

  const current = heroMedia[heroIndex]

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-black">
        <div className="relative h-[78vh] min-h-[520px] w-full md:h-[92vh]">
          <AnimatePresence mode="wait">
            {heroMedia.length ? (
              <motion.div
                key={`${current?.url}-${heroIndex}`}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                {current?.type === 'video' ? (
                  <video
                    src={current.url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={current?.url}
                    alt={current?.title || 'HOK Interior Design'}
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />

                {/* Hero text overlay */}
                {current?.title && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="absolute bottom-20 left-0 right-0 px-6 text-center md:bottom-24 md:px-16"
                  >
                    <p className="font-display text-3xl font-semibold text-white drop-shadow-lg md:text-5xl">
                      {current.title}
                    </p>
                    {current.description && (
                      <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 md:text-base">
                        {current.description}
                      </p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-ink to-ink/80">
                <div className="text-center">
                  <p className="font-display text-5xl text-white md:text-7xl">HOK</p>
                  <p className="mt-2 text-sm uppercase tracking-[0.3em] text-orange">Interior Designs</p>
                  <p className="mt-4 text-sm text-white/60">Upload project media from the Admin Dashboard</p>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Dot navigation */}
          {heroMedia.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2 px-4">
              {heroMedia.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToHero(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === heroIndex ? 'w-8 bg-orange' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Hero slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Portfolio Preview ── */}
      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="Portfolio" title="Curated Interiors" body="" />
          {feed.portfolio.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
              {feed.portfolio.slice(0, 6).map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="group overflow-hidden rounded-2xl"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-56 w-full object-cover transition duration-500 group-hover:scale-105 md:h-72"
                    loading="lazy"
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-sm text-ink/50">No portfolio items yet.</p>
          )}
          <div className="mt-8 text-center">
            <Link
              to="/portfolio"
              className="inline-block rounded-full border border-ink px-8 py-3 text-xs uppercase tracking-[0.18em] transition hover:bg-ink hover:text-white"
            >
              View Full Portfolio
            </Link>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      {feed.about && (
        <section className="bg-white px-4 py-16 md:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src={feed.about.aboutImageUrl}
                alt="About HOK Interior Designs"
                className="h-[460px] w-full rounded-3xl object-cover bg-beige shadow-soft"
                loading="lazy"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <p className="text-xs uppercase tracking-[0.28em] text-orange">About HOK</p>
              <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
                Crafting Spaces That Inspire
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-ink/70 md:text-base">
                {feed.about.story || feed.about.companyDescription}
              </p>
              {feed.about.mission && (
                <p className="mt-4 text-sm text-ink/65">
                  <span className="font-semibold text-ink">Mission:</span> {feed.about.mission}
                </p>
              )}
              {feed.about.vision && (
                <p className="mt-2 text-sm text-ink/65">
                  <span className="font-semibold text-ink">Vision:</span> {feed.about.vision}
                </p>
              )}
              <Link
                to="/about"
                className="mt-8 inline-block rounded-full bg-orange px-8 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition hover:bg-orange/85"
              >
                Learn More
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Virtual Showroom ── */}
      {feed.virtualDesign.length > 0 && (
        <section className="px-4 py-16 md:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionTitle eyebrow="Virtual Interior Design" title="Virtual Showroom" body="" />
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {feed.virtualDesign.map((item, i) => (
                <motion.article
                  key={item._id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="overflow-hidden rounded-2xl bg-white shadow-soft"
                >
                  <video
                    src={item.videoUrl}
                    className="h-56 w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                  <div className="p-4">
                    <h4 className="font-display text-2xl">{item.title}</h4>
                    {item.description && (
                      <p className="mt-1 text-sm text-ink/65 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                to="/virtual-interior-design"
                className="inline-block rounded-full border border-ink px-8 py-3 text-xs uppercase tracking-[0.18em] transition hover:bg-ink hover:text-white"
              >
                Enter Showroom
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── New Arrivals ── */}
      {newest.length > 0 && (
        <section className="bg-white px-4 py-16 md:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionTitle eyebrow="Shop" title="New Arrivals" body="" />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {newest.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                to="/shop"
                className="inline-block rounded-full border border-ink px-8 py-3 text-xs uppercase tracking-[0.18em] transition hover:bg-ink hover:text-white"
              >
                Shop All
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
