import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { api } from '../../services/api'
import { PageMeta } from '../../hooks/usePageMeta'

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await api.post('/auth/forgot-password', { email })
      setSuccess('Password reset email sent! Check your inbox.')
    } catch (err) {
      setError(err?.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageMeta
        title="Forgot Password — HOK Interior Designs"
        description="Reset your HOK Interior Designs account password."
      />
      <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-8 md:p-12 shadow-[0_10px_40px_rgba(42,36,31,0.06)]">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--secondary)]/30 text-[var(--accent)]"
          >
            <Mail size={48} strokeWidth={1.5} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl md:text-4xl font-medium text-[var(--primary)] mb-2"
          >
            Forgot Password?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[var(--primary)]/60"
          >
            Enter your email and we&apos;ll send you a link to reset your password.
          </motion.p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-[var(--error)]/10 text-[var(--error)]"
          >
            <AlertCircle size={20} strokeWidth={2} />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-[var(--success)]/10 text-[var(--success)]"
          >
            <CheckCircle size={20} strokeWidth={2} />
            <span className="text-sm">{success}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--primary)] mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="input-luxury"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-luxury-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-[var(--primary)]/60">
            Remember your password?{' '}
            <Link to="/login" className="text-[var(--accent)] font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </>
  )
}

export default ForgotPasswordPage