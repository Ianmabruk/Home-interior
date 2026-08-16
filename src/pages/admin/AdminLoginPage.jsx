import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, AlertCircle, Shield } from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { PageMeta } from '@hooks/usePageMeta'

export const AdminLoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await login(formData.email, formData.password)
      if (result?.user?.role === 'ADMIN') {
        navigate(location.pathname, { replace: true })
      } else {
        await logout()
        setError('Administrator access required')
      }
    } catch (err) {
      setError(err?.message || 'Invalid email or password')
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
        title="Admin Sign In — HOK Interior Designs"
        description="Administrator access for HOK Interior Designs."
      />
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl border border-[var(--border)]/40 p-8 md:p-12 shadow-[0_10px_40px_rgba(42,36,31,0.06)]">
            <div className="text-center mb-10">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10">
                <Shield className="h-6 w-6 text-[var(--accent)]" strokeWidth={1.5} />
              </div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-3xl md:text-4xl font-medium text-[var(--primary)] mb-2"
              >
                Admin Access
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[var(--primary)]/60"
              >
                Sign in to the administrator dashboard
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

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    autoComplete="current-password"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-luxury-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--primary)]/60">
              <Link to="/" className="text-[var(--accent)] hover:underline">
                Return to site
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default AdminLoginPage
