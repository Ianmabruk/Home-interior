import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export const NotFoundPage = () => {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center"
      >
        <p className="font-display text-[10rem] font-medium leading-none text-linen md:text-[14rem]">404</p>
        <p className="eyebrow -mt-4 mb-4">Page Not Found</p>
        <h1 className="font-display text-4xl font-medium text-ink md:text-5xl">
          This page doesn't exist
        </h1>
        <p className="mt-4 text-sm text-ink/45">
          The page you're looking for may have moved or been removed.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to="/" className="btn-primary">
            Back to Home <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
          <Link to="/portfolio" className="btn-ghost text-ink/50">
            View Portfolio
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
