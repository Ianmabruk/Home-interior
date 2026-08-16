import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { PageMeta } from '@hooks/usePageMeta'

export const SignupPage = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', phone: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const { register, login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await register(formData.fullName, formData.email, formData.password, formData.phone)
      if (result?.needsLogin) {
        await login(formData.email, formData.password)
        navigate('/orders', { replace: true })
        setSuccess('Account created successfully!')
      } else {
        setSuccess('Account created. You can now sign in.')
        setTimeout(() => navigate('/login', { replace: true }), 1500)
      }
    } catch (err) {
      setError(err?.message || 'We could not create your account. Please check your information and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <>
      <PageMeta
        title="Create Account — HOK Interior Designs"
        description="Sign up for a HOK Interior Designs account."
      />
      <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-8 md:p-12 shadow-[0_10px_40px_rgba(42,36,31,0.06)]">
        <div className="text-center mb-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl md:text-4xl font-medium text-[var(--primary)] mb-2"
          >
            Create Account
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[var(--primary)]/60"
          >
            Join HOK Interior Designs to track orders and save favorites.
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-[var(--primary)] mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              autoComplete="name"
              className="input-luxury"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--primary)] mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="input-luxury"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-[var(--primary)] mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              autoComplete="tel"
              className="input-luxury"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--primary)] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                autoComplete="new-password"
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
            <p className="mt-1 text-xs text-[var(--primary)]/50">At least 8 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-luxury-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--primary)]/60">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </>
  )
}

export default SignupPage
