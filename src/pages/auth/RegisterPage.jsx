import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const RegisterPage = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (!/\d/.test(form.password)) return setError('Password must contain at least one number.')
    setLoading(true)
    try {
      await register(form.fullName, form.email, form.password)
      navigate('/account')
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <div>
        <p className="eyebrow mb-3">Join HOK</p>
        <h1 className="font-display text-5xl font-medium text-ink">Create Account</h1>
      </div>

      {error && (
        <p className="border-l-2 border-red-400 pl-4 text-sm text-red-600">{error}</p>
      )}

      <div className="space-y-6">
        <div>
          <label className="label">Full Name</label>
          <input
            className="input"
            required
            minLength={2}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label">Email Address</label>
          <input
            className="input"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
          />
          <p className="mt-1.5 text-2xs text-ink/35">Min 8 characters, at least 1 number.</p>
        </div>
        <div>
          <label className="label">Confirm Password</label>
          <input
            className="input"
            type="password"
            required
            minLength={8}
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="space-y-4">
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account…' : <>Create Account <ArrowRight size={14} strokeWidth={1.5} /></>}
        </button>
        <p className="text-center text-sm text-ink/45">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-ink transition hover:text-warm">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  )
}
