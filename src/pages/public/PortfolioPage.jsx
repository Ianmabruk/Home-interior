import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload } from '../../utils/adminEvents'
import { getOptimizedUrl } from '../../utils/cloudinaryHelpers'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const ProjectCard = ({ item }) => (
  <motion.article
    variants={itemVariants}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: '-40px' }}
    className="group cursor-pointer"
  >
    <Link
      to={`/portfolio/${item.id}`}
      className="block bg-white rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(42,36,31,0.04)] hover:shadow-[0_20px_60px_rgba(42,36,31,0.08)] transition-all duration-500"
      aria-label={`View ${item.title} project`}
    >
      <div className="relative aspect-square overflow-hidden">
        {item.imageUrl ? (
          <img
            src={getOptimizedUrl(item.imageUrl, { width: 800, crop: 'limit' })}
            alt={item.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="h-full w-full bg-[var(--secondary)]/30" />
        )}
        {item.featured && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 left-3 z-10"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-white text-[10px] font-semibold uppercase tracking-widest rounded-full shadow-lg">
              Featured
            </span>
          </motion.div>
        )}
      </div>

      <div className="p-5 md:p-6 border-t border-[var(--border)]/40 bg-white text-center">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-xl md:text-2xl font-normal text-[var(--primary)] leading-tight mb-4"
        >
          {item.title}
        </motion.h3>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            type="button"
            className="btn-luxury-primary group inline-flex items-center gap-2 text-[10px] px-6 py-2.5 rounded-full whitespace-nowrap hover:scale-105 active:scale-95"
          >
            View Project
            <ArrowRight size={12} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>
    </Link>
  </motion.article>
)

export const PortfolioPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const loadPortfolio = () => {
    api.get('/portfolio')
      .then((res) => setItems(res.data || []))
      .catch((err) => {
        console.warn('[PORTFOLIO] Failed to load:', err?.message)
        setItems([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPortfolio() }, [])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'portfolio-changed') loadPortfolio()
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <div className="absolute inset-0">
          {items.length > 0 && items[0]?.imageUrl ? (
            <img
              src={getOptimizedUrl(items[0].imageUrl, { width: 1920, crop: 'limit' })}
              alt="Portfolio showcase"
              className="h-full w-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[var(--primary)] via-[var(--primary)]/80 to-[var(--primary)]/60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/85 via-[var(--primary)]/50 to-[var(--primary)]/30" />
        </div>
        <div className="relative z-10 flex h-full items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center px-6"
          >
            <h1 className="font-display text-5xl font-normal leading-tight text-white md:text-7xl lg:text-8xl tracking-wide">
              PORTFOLIO
            </h1>
            <p className="mt-4 text-base md:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
              A curated collection of our completed interior design projects across residential, commercial, and hospitality spaces.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="bg-[var(--secondary)]/30 py-12 px-6 md:px-12 lg:px-20 border-y border-[var(--border)]/40">
        <div className="container-wide mx-auto max-w-4xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Ready to Start Your Project?</p>
          <h2 className="font-display text-3xl md:text-4xl font-normal text-[var(--primary)] mb-6 leading-tight">
            Let&apos;s Create Something Beautiful Together
          </h2>
          <p className="text-base md:text-lg text-[var(--primary)]/60 mb-8 leading-relaxed">
            From concept to completion, we guide you through every step of the design journey.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/virtual-design"
              className="btn-luxury-primary group px-8 py-4 text-[11px] rounded-xl"
            >
              Explore Virtual Design
              <ArrowRight size={14} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-consultation'))}
              className="btn-luxury-secondary group px-8 py-4 text-[11px] rounded-xl"
            >
              Book Consultation
            </button>
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--bg)] pt-12">
        <div className="container-wide px-6 md:px-12 lg:px-20">
          {loading && (
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="group">
                  <div className="skeleton aspect-square w-full rounded-3xl" />
                  <div className="mt-4 space-y-2 text-center">
                    <div className="skeleton h-3 w-20 mx-auto" />
                    <div className="skeleton h-5 w-24 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-24 text-center"
            >
              <p className="font-display text-3xl text-[var(--primary)]/30">No projects found</p>
            </motion.div>
          )}

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-50px' }}
            className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {items.map((item) => (
              <ProjectCard key={item.id} item={item} />
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section-pad bg-[var(--primary)]">
        <div className="container-wide px-6 md:px-12 lg:px-20 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--secondary)]/50 mb-4">Start Your Journey</p>
          <h2 className="font-display text-4xl font-normal text-white md:text-5xl lg:text-6xl leading-[1.05] mb-6">
            Ready to Transform Your Space?
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-base text-white/50 leading-relaxed mb-10">
            Let&apos;s discuss your vision and create an interior that reflects your unique style.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-consultation'))}
              className="btn-luxury-primary group px-8 py-4 text-[11px] rounded-xl"
            >
              Book Consultation
            </button>
            <Link
              to="/virtual-design"
              className="group btn-luxury-secondary px-8 py-4 text-[11px] rounded-xl"
            >
              View Virtual Design
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}