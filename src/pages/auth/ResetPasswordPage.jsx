import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react'
import { api } from '@services/api'
import { PageMeta } from '@hooks/usePageMeta'

export const ResetPasswordPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [validToken, setValidToken] = useState(null)

  const verifyToken = useCallback(async () => {
    try {
      await api.post('/auth/verify-reset-token', { token })
      setValidToken(true)
    } catch {
      setValidToken(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      verifyToken()
    } else {
      setValidToken(false)
    }
  }, [token, verifyToken])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await api.post('/auth/reset-password', { token, password: formData.password })
      setSuccess('Password has been reset successfully. Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (validToken === false) {
    return (
      <>
        <PageMeta
          title="Invalid Reset Link — HOK Interior Designs"
          description="The password reset link is invalid or has expired."
        />
        <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-8 md:p-12 shadow-[0_10px_40px_rgba(42,36,31,0.06)] max-w-md mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--error)]/10 text-[var(--error)]"
          >
            <AlertCircle size={28} strokeWidth={1.5} />
          </motion.div>
          <h1 className="font-display text-3xl font-medium text-[var(--primary)] mb-2">Invalid Reset Link</h1>
          <p className="text-[var(--primary)]/60 mb-6">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="btn-luxury-primary inline-flex items-center gap-2">
            Request New Link
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <PageMeta
        title="Reset Password — HOK Interior Designs"
        description="Create a new password for your HOK Interior Designs account."
      />
      <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-8 md:p-12 shadow-[0_10px_40px_rgba(42,36,31,0.06)] max-w-md mx-auto">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--secondary)]/30 text-[var(--accent)]"
          >
            <Lock size={28} strokeWidth={1.5} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl md:text-4xl font-medium text-[var(--primary)] mb-2"
          >
            Reset Password
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[var(--primary)]/60"
          >
            Enter your new password below. Make sure it&apos;s strong and unique.
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
            <label htmlFor="password" className="block text-sm font-medium text-[var(--primary)] mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                autoComplete="new-password"
                minLength={8}
                className="input-luxury pr-12"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--primary)]/40 hover:text-[var(--primary)]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--primary)] mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                autoComplete="new-password"
                className="input-luxury pr-12"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--primary)]/40 hover:text-[var(--primary)]"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-luxury-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Resetting...
              </>
            ) : (
              'Reset Password'
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

export default ResetPasswordPage