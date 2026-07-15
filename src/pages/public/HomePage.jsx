import { motion, useScroll, useTransform } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Brush, LayoutGrid, Armchair, ClipboardList } from 'lucide-react'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import PositionedImage from '../../components/common/PositionedImage'
import { NewsletterForm } from '../../components/common/NewsletterForm'

const sortByOrderThenDate = (items) =>
  [...(items || [])].sort((a, b) => {
    const orderDiff = (a.order || 0) - (b.order || 0)
    if (orderDiff !== 0) return orderDiff
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  })

const WHAT_WE_DO_ITEMS = [
  {
    icon: Brush,
    title: 'Interior Design',
    description: 'Bespoke interiors that reflect your personality, crafted with premium materials and timeless aesthetics.',
  },
  {
    icon: LayoutGrid,
    title: 'Space Planning',
    description: 'Thoughtful layouts that maximize flow, light, and functionality for spaces that feel effortlessly balanced.',
  },
  {
    icon: Armchair,
    title: 'Custom Furniture',
    description: 'One-of-a-kind furniture pieces designed and crafted to complement your unique interior vision.',
  },
  {
    icon: ClipboardList,
    title: 'Project Management',
    description: 'End-to-end oversight ensuring every detail is delivered on time, on budget, and to the highest standard.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
}

const ParallaxImage = ({ src, alt, settings, className, sizes, aspect = 'aspect-[4/3]' }) => {
  const ref = useRef(null)
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 600], [0, -40])

  return (
    <div ref={ref} className={`relative overflow-hidden ${aspect}`}>
      <motion.div style={{ y }} className="h-[110%] w-full -mt-[5%]">
        <PositionedImage
          src={src}
          alt={alt}
          settings={settings}
          className={className}
          loading="lazy"
          sizes={sizes}
        />
      </motion.div>
    </div>
  )
}

export const HomePage = () => {
  const [feed, setFeed] = useState({
    portfolio: [],
    about: null,
  })
  const [loading, setLoading] = useState(true)

  const loadFeed = useCallback(() => {
    const portfolioP = api
      .get('/content/portfolio')
      .then((res) => res.data || [])
      .catch(() => [])
    const aboutP = api
      .get('/content/about')
      .then((res) => res.data || null)
      .catch(() => null)

    return Promise.allSettled([portfolioP, aboutP])
      .then(([portR, aboutR]) => {
        const portfolio = portR.status === 'fulfilled' ? portR.value : []
        const about = aboutR.status === 'fulfilled' ? aboutR.value : null

        const sortedPortfolio = sortByOrderThenDate(portfolio)

        setFeed({
          portfolio: sortedPortfolio,
          about,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadFeed() }, [loadFeed])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type) {
        loadFeed().catch(() => {})
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadFeed])

  if (loading) {
    return (
      <div className="min-h-screen bg-primary">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-borderSubtle border-t-accent" />
        </div>
      </div>
    )
  }

  const featuredProject = feed.portfolio[0]
  const supportingProjects = feed.portfolio.slice(1, 4)

  return (
    <div className="min-h-screen bg-primary text-textPrimaryDark">
      {/* ══════════════════════════════════════════
          SECTION 1 — PORTFOLIO SHOWCASE
      ══════════════════════════════════════════ */}
      <section className="px-6 pt-12 md:px-12 lg:px-20 md:pt-20">
        <div className="container-wide">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="mb-10 text-center md:mb-14"
          >
            <motion.p variants={fadeUp} custom={0} className="text-2xs font-medium uppercase tracking-widest text-accent mb-3">
              Portfolio
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-4xl font-medium leading-tight text-textPrimaryDark md:text-5xl lg:text-6xl">
              Curated Interiors
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mt-4 max-w-2xl mx-auto text-base text-textSecondary">
              Luxury Interior Design Portfolio
            </motion.p>
          </motion.div>

          {feed.portfolio.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-[40vh] items-center justify-center"
            >
              <div className="text-center px-4">
                <p className="font-display text-2xl text-textPrimaryDark/30">No projects yet</p>
                <p className="mt-2 text-sm text-textPrimaryDark/50">Upload projects from the Admin Dashboard</p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
              {featuredProject && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="lg:col-span-7 group relative overflow-hidden rounded-[20px] bg-card border border-borderSubtle shadow-cardHover transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  <ParallaxImage
                    src={featuredProject.imageUrl}
                    alt={featuredProject.title}
                    settings={featuredProject.mediaSettings}
                    className="h-full w-full transition duration-700 group-hover:scale-105"
                    sizes="(min-width:1024px) 57vw, 100vw"
                    aspect="aspect-[4/3] lg:aspect-[4/5]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="p-5 md:p-6">
                    <h3 className="font-display text-xl md:text-2xl font-medium text-textPrimaryDark">{featuredProject.title}</h3>
                    {featuredProject.category && (
                      <p className="mt-1 text-2xs font-medium uppercase tracking-widest text-accent">{featuredProject.category}</p>
                    )}
                    {featuredProject.description && (
                      <p className="mt-2 text-sm leading-relaxed text-textSecondary line-clamp-2">{featuredProject.description}</p>
                    )}
                  </div>
                </motion.div>
              )}

              <div className="lg:col-span-5 flex flex-col gap-4 md:gap-6">
                {supportingProjects.map((item, i) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className="group relative overflow-hidden rounded-[20px] bg-card border border-borderSubtle shadow-cardHover transition-all duration-300 hover:-translate-y-1 cursor-pointer flex-1"
                  >
                    <ParallaxImage
                      src={item.imageUrl}
                      alt={item.title}
                      settings={item.mediaSettings}
                      className="h-full w-full transition duration-700 group-hover:scale-105"
                      sizes="(min-width:1024px) 43vw, 100vw"
                      aspect="aspect-[16/9]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="p-4 md:p-5">
                      <h3 className="font-display text-lg font-medium text-textPrimaryDark">{item.title}</h3>
                      {item.category && (
                        <p className="mt-1 text-2xs font-medium uppercase tracking-widest text-accent">{item.category}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {feed.portfolio.length > 4 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-10 text-center"
            >
              <Link
                to="/portfolio"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-darkBrown px-8 py-3 text-2xs font-medium uppercase tracking-widest text-white transition-all duration-200 hover:bg-textPrimaryDark hover:shadow-lg"
                style={{ height: '48px' }}
              >
                View Full Portfolio <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2 — WHAT WE DO
      ══════════════════════════════════════════ */}
      <section className="bg-secondary px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <div className="container-wide">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="mb-10 md:mb-14 text-center"
          >
            <motion.p variants={fadeUp} custom={0} className="text-2xs font-medium uppercase tracking-widest text-accent mb-3">Services</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="font-display text-4xl font-medium leading-tight text-textPrimaryDark md:text-5xl">
              What We Do
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mt-4 max-w-2xl mx-auto text-base text-textSecondary">
              Comprehensive interior design services tailored to elevate your space.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {WHAT_WE_DO_ITEMS.map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-[16px] bg-card p-6 md:p-8 border border-borderSubtle transition-all duration-300 hover:-translate-y-1 hover:shadow-cardHover"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-borderSubtle text-accent">
                    <Icon size={22} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-lg font-medium text-textPrimaryDark mb-2">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-textSecondary">{item.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 3 — ABOUT HOK
      ══════════════════════════════════════════ */}
      <section className="px-6 md:px-12 lg:px-20">
        <div className="container-wide py-16 md:py-24">
          <div className="grid items-center gap-10 sm:gap-12 md:grid-cols-2 md:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {feed.about?.aboutImageUrl ? (
                <ParallaxImage
                  src={feed.about.aboutImageUrl}
                  alt="Workspace"
                  settings={feed.about.mediaSettings}
                  loading="lazy"
                  sizes="(min-width:768px) 50vw, 100vw"
                  aspect="aspect-[4/3] sm:aspect-[4/5]"
                  className="h-full w-full transition duration-700"
                />
              ) : (
                <div className="w-full rounded-[28px] bg-secondary flex aspect-[4/3] items-center justify-center sm:aspect-[4/5] shadow-cardHover">
                  <p className="text-sm text-textPrimaryDark/30">Premium workspace</p>
                </div>
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-2xs font-medium uppercase tracking-widest text-accent mb-4">About HOK</p>
              <h2 className="font-display text-3xl font-medium leading-tight text-textPrimaryDark sm:text-4xl md:text-4xl lg:text-5xl">
                Crafting Excellence
              </h2>
              {feed.about?.story && (
                <p className="mt-3 text-sm leading-relaxed text-textSecondary sm:text-base sm:mt-4">
                  {feed.about.story}
                </p>
              )}
              {feed.about?.companyDescription && (
                <p className="mt-3 text-sm leading-relaxed text-textSecondary sm:text-base">
                  {feed.about.companyDescription}
                </p>
              )}
              {feed.about?.mission && (
                <div className="mt-5 border-l-4 border-accent pl-5 sm:mt-6">
                  <p className="text-sm leading-relaxed text-textPrimaryDark/70 sm:text-base">{feed.about.mission}</p>
                </div>
              )}
              {feed.about?.vision && (
                <div className="mt-4 border-l-4 border-borderSubtle pl-5">
                  <p className="text-sm leading-relaxed text-textPrimaryDark/70 sm:text-base">{feed.about.vision}</p>
                </div>
              )}
              <div className="mt-8">
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-darkBrown px-8 py-3 text-2xs font-medium uppercase tracking-widest text-white transition-all duration-200 hover:bg-textPrimaryDark hover:shadow-lg"
                  style={{ height: '48px' }}
                >
                  Learn More <ArrowRight size={14} strokeWidth={1.5} />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 4 — NEWSLETTER
      ══════════════════════════════════════════ */}
      <section className="bg-footerBlack px-6 md:px-12 lg:px-20">
        <div className="container-wide py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xs font-medium uppercase tracking-widest text-accent mb-3"
            >
              Newsletter
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-display text-3xl md:text-4xl font-medium text-white mb-4"
            >
              Design Notes & Curated Drops
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-sm text-white/60 mb-8"
            >
              Subscribe to receive the latest design inspiration, new arrivals, and exclusive offers.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <NewsletterForm />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
