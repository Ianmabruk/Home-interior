import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@services/api'
import { PageMeta } from '@hooks/usePageMeta'

export const TestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await api.get('/testimonials')
        setTestimonials(res.data || [])
      } catch {
        setTestimonials([])
      } finally {
        setLoading(false)
      }
    }
    fetchTestimonials()
  }, [])

  const activeTestimonials = useMemo(() => {
    return testimonials.filter((t) => t.isActive !== false)
  }, [testimonials])

  if (loading) {
    return (
      <main>
        <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-20 md:py-32">
          <div className="container-wide">
            <div className="mb-16 text-center animate-fade-up">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">Testimonials</p>
              <h2 className="font-display text-4xl font-semibold leading-tight text-[var(--primary)] md:text-5xl lg:text-6xl skeleton" />
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-64 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main>
      <PageMeta
        title="Testimonials — HOK Interior Designs"
        description="Read what our clients say about HOK Interior Designs."
      />
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)] via-[var(--primary)]/80 to-[var(--bg)]" />
        <div className="relative z-10 container-wide px-6 md:px-12 lg:px-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-semibold text-white leading-tight"
          >
            Testimonials
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-lg md:text-xl text-white/70 max-w-3xl mx-auto"
          >
            Hear from our clients about their experience working with HOK Interiors.
          </motion.p>
        </div>
      </section>

      <section className="bg-[var(--bg)] px-6 md:px-12 lg:px-20 py-16 md:py-24">
        <div className="container-wide">
          {activeTestimonials.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/40 to-[var(--accent)]/10 flex items-center justify-center mb-4 text-[var(--primary)]/20">
                <Quote size={32} />
              </div>
              <p className="font-display text-xl text-[var(--primary)]/30">
                No testimonials yet
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {activeTestimonials.map((t, i) => (
                <motion.div
                  key={t._id || t.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-[var(--border)]/40 p-6 md:p-8 shadow-[0_10px_40px_rgba(42,36,31,0.06)] flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {t.photoUrl ? (
                        <img src={t.photoUrl} alt={t.clientName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[var(--accent)] text-lg font-semibold">
                          {(t.clientName || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-medium text-[var(--primary)]">{t.clientName}</h3>
                      {t.company && (
                        <p className="text-sm text-[var(--primary)]/60">{t.company}{t.position ? ` — ${t.position}` : ''}</p>
                      )}
                      {!t.company && t.position && (
                        <p className="text-sm text-[var(--primary)]/60">{t.position}</p>
                      )}
                    </div>
                  </div>
                  <div className="mb-4">
                    {renderStars(t.rating)}
                  </div>
                  <p className="text-[var(--primary)]/70 leading-relaxed flex-1">
                    &ldquo;{t.testimonial}&rdquo;
                  </p>
                  {t.project && (
                    <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                      Project: {t.project}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* INTERNAL LINKS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-[var(--primary)]/60 mb-4">Prefer to explore first?</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/portfolio" className="btn-luxury-secondary">View Portfolio</Link>
              <Link to="/services" className="btn-luxury-secondary">Our Services</Link>
              <Link to="/contact" className="btn-luxury-secondary">Contact Us</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}

const renderStars = (rating, size = 14) => (
  <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={size}
        strokeWidth={1.5}
        className={i < rating ? 'text-accentOrange fill-accentOrange' : 'text-[var(--border)]'}
      />
    ))}
  </div>
)

export default TestimonialsPage