import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { PageMeta } from '../../hooks/usePageMeta'

export const NotFoundPage = () => {
  return (
    <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <PageMeta
        title="Page Not Found — HOK Interior Designs"
        description="The page you're looking for doesn't exist."
      />
      <div className="text-center max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 inline-flex h-24 w-24 items-center justify-center rounded-full bg-[var(--secondary)]/30 text-[var(--primary)]/30"
        >
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-6xl md:text-8xl font-semibold text-[var(--primary)] leading-tight mb-4"
        >
          404
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-2xl md:text-3xl text-[var(--primary)] mb-4"
        >
          Page Not Found
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-[var(--primary)]/60 mb-8 max-w-md mx-auto"
        >
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-300 hover:bg-[var(--accent)] hover:shadow-[0_8px_30px_rgba(232,154,67,0.15)] hover:-translate-y-0.5"
          >
            <Home size={14} strokeWidth={1.5} />
            Back to Home
          </Link>
          <Link
            to="/portfolio"
            className="group inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--primary)] transition-all duration-300 hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <Search size={14} strokeWidth={1.5} />
            Explore Projects
          </Link>
        </motion.div>
      </div>
    </main>
  )
}

export default NotFoundPage