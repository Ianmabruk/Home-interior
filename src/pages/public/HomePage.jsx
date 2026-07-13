import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import PositionedImage from '../../components/common/PositionedImage'
import { getOptimizedVideoUrl, getVideoPosterUrl } from '../../utils/cloudinaryHelpers'

const sortByOrderThenDate = (items) =>
  [...(items || [])].sort((a, b) => {
    const orderDiff = (a.order || 0) - (b.order || 0)
    if (orderDiff !== 0) return orderDiff
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  })

const SERVICES = [
  {
    title: 'Interior Design',
    description: 'Custom residential and commercial interiors.',
    icon: '✦',
  },
  {
    title: 'Space Planning',
    description: 'Efficient layouts maximizing usability.',
    icon: '◎',
  },
  {
    title: 'Custom Furniture',
    description: 'Bespoke furniture and décor solutions.',
    icon: '❖',
  },
  {
    title: 'Project Management',
    description: 'End-to-end project execution.',
    icon: '◈',
  },
]

export const HomePage = () => {
  const [feed, setFeed] = useState({
    projects: [],
    portfolio: [],
    about: null,
  })
  const [loading, setLoading] = useState(true)
  const [heroVideoUrl, setHeroVideoUrl] = useState(null)
  const [heroPosterUrl, setHeroPosterUrl] = useState(null)
  const heroVideoRef = useRef(null)

  const loadFeed = useCallback(() => {
    const projectsP = api
      .get('/content/projects')
      .then((res) => res.data || [])
      .catch(() => [])
    const portfolioP = api
      .get('/content/portfolio')
      .then((res) => res.data || [])
      .catch(() => [])
    const aboutP = api
      .get('/content/about')
      .then((res) => res.data || null)
      .catch(() => null)

    return Promise.allSettled([projectsP, portfolioP, aboutP])
      .then(([projR, portR, aboutR]) => {
        const projects = projR.status === 'fulfilled' ? projR.value : []
        const portfolio = portR.status === 'fulfilled' ? portR.value : []
        const about = aboutR.status === 'fulfilled' ? aboutR.value : null

        const sortedProjects = sortByOrderThenDate(projects)
        const sortedPortfolio = sortByOrderThenDate(portfolio)

        setFeed({
          projects: sortedProjects,
          portfolio: sortedPortfolio,
          about,
        })

        const heroProject = sortedProjects.find((p) => p.videoUrl) || sortedProjects[0]
        if (heroProject) {
          setHeroVideoUrl(heroProject.videoUrl || (Array.isArray(heroProject.media) && heroProject.media.find((m) => m?.type === 'video' && m.url)?.url))
          setHeroPosterUrl(heroProject.coverImageUrl || (Array.isArray(heroProject.media) && heroProject.media.find((m) => m?.url)?.url))
        }
      })
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

  // Ensure hero video autoplays on all devices
  useEffect(() => {
    const v = heroVideoRef.current
    if (!v || !heroVideoUrl) return
    v.muted = true
    v.play().catch(() => {})
  }, [heroVideoUrl])

  if (loading) {
    return (
      <div className="min-h-screen bg-bgPrimary">
        <div className="container-wide section-pad">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-4">
            <div className="skeleton col-span-2 aspect-[4/3]" />
            <div className="skeleton aspect-[4/3]" />
            <div className="skeleton aspect-[4/3]" />
            <div className="skeleton aspect-[4/3]" />
            <div className="skeleton aspect-[4/3]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bgPrimary text-textPrimaryDark">
      {/* ══════════════════════════════════════════
          SECTION 1 — HERO VIDEO
      ══════════════════════════════════════════ */}
      <section className="relative w-full px-4 pt-4 md:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[24px] md:rounded-[30px] bg-bgSecondary shadow-2xl shadow-black/10 ring-1 ring-black/5 h-[55vh] md:h-[80vh]">
          {heroVideoUrl ? (
            <video
              ref={heroVideoRef}
              src={getOptimizedVideoUrl(heroVideoUrl, { width: 1280 })}
              poster={heroPosterUrl ? getVideoPosterUrl(heroPosterUrl, { width: 1280 }) : undefined}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bgSecondary">
              <p className="font-display text-2xl text-textPrimaryDark/30">Upload a project video to get started</p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2 — PORTFOLIO PROJECTS
      ══════════════════════════════════════════ */}
      <section className="section-pad bg-bgPrimary">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <div className="mb-10 text-center">
            <p className="text-2xs font-medium uppercase tracking-widest text-accent mb-3">Portfolio</p>
            <h2 className="font-display text-4xl font-medium leading-tight text-textPrimaryDark md:text-5xl">Curated Interiors</h2>
            <p className="mt-4 max-w-2xl mx-auto text-base text-textPrimaryDark/55">Luxury Interior Design Portfolio</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {feed.portfolio.slice(0, 6).map((item, i) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="group relative overflow-hidden rounded-[24px] bg-cardCream shadow-lg shadow-black/5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <PositionedImage
                    src={item.imageUrl}
                    alt={item.title}
                    settings={item.mediaSettings}
                    className="h-full w-full transition duration-500 group-hover:scale-105"
                    loading="lazy"
                    sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl font-medium text-textPrimaryDark">{item.title}</h3>
                  {item.category && (
                    <p className="mt-1 text-2xs font-medium uppercase tracking-widest text-accent">{item.category}</p>
                  )}
                  {item.description && (
                    <p className="mt-2 text-sm leading-relaxed text-textPrimaryDark/60 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {feed.portfolio.length > 6 && (
            <div className="mt-10 text-center">
              <Link to="/portfolio" className="btn-primary">
                View Full Portfolio <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 3 — WHAT WE DO
      ══════════════════════════════════════════ */}
      <section className="section-pad bg-bgSecondary">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <div className="mb-10 text-center">
            <p className="text-2xs font-medium uppercase tracking-widest text-accent mb-3">Services</p>
            <h2 className="font-display text-4xl font-medium leading-tight text-textPrimaryDark md:text-5xl">What We Do</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {SERVICES.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-[20px] bg-cardCream p-6 md:p-8 shadow-lg shadow-black/5 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <span className="text-xl">{service.icon}</span>
                </div>
                <h3 className="font-display text-xl font-medium text-textPrimaryDark">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-textPrimaryDark/60">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 4 — ABOUT HOK
      ══════════════════════════════════════════ */}
      <section className="section-pad bg-bgPrimary">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          <div className="grid items-center gap-10 sm:gap-12 md:grid-cols-2 md:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {feed.about?.aboutImageUrl ? (
                <div className="w-full overflow-hidden rounded-[28px] shadow-xl shadow-black/10 aspect-[4/3] sm:aspect-[4/5]">
                  <PositionedImage
                    src={feed.about.aboutImageUrl}
                    alt="Workspace"
                    settings={feed.about.mediaSettings}
                    loading="lazy"
                    sizes="(min-width:768px) 50vw, 100vw"
                  />
                </div>
              ) : (
                <div className="w-full rounded-[28px] bg-bgSecondary flex aspect-[4/3] items-center justify-center sm:aspect-[4/5] shadow-xl shadow-black/10">
                  <p className="text-sm text-textPrimaryDark/30">Premium workspace</p>
                </div>
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <p className="text-2xs font-medium uppercase tracking-widest text-accent mb-4">About HOK</p>
              <h2 className="font-display text-3xl font-medium leading-tight text-textPrimaryDark sm:text-4xl md:text-4xl lg:text-5xl">
                Crafting Excellence
              </h2>
              {feed.about?.story && (
                <p className="mt-3 text-sm leading-relaxed text-textPrimaryDark/55 sm:text-base sm:mt-4">
                  {feed.about.story}
                </p>
              )}
              {feed.about?.companyDescription && (
                <p className="mt-3 text-sm leading-relaxed text-textPrimaryDark/55 sm:text-base">
                  {feed.about.companyDescription}
                </p>
              )}
              {feed.about?.mission && (
                <div className="mt-5 border-l-4 border-accent pl-5 sm:mt-6">
                  <p className="text-sm leading-relaxed text-textPrimaryDark/70 sm:text-base">{feed.about.mission}</p>
                </div>
              )}
              {feed.about?.vision && (
                <div className="mt-4 border-l-4 border-border pl-5">
                  <p className="text-sm leading-relaxed text-textPrimaryDark/70 sm:text-base">{feed.about.vision}</p>
                </div>
              )}
              <div className="mt-8">
                <Link to="/about" className="btn-primary">
                  Learn More <ArrowRight size={14} strokeWidth={1.5} />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
