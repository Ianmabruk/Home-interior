import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Instagram,
  Facebook,
  Loader2,
  Check,
} from 'lucide-react'
import { FaTiktok, FaPinterest } from 'react-icons/fa'
import { toast } from 'react-hot-toast'
import { api } from '../../services/api'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'

const SOCIAL_PLATFORMS = [
  { key: 'tiktok', label: 'TikTok', icon: FaTiktok, placeholder: 'https://tiktok.com/@yourhandle', color: '#000000' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/yourhandle', color: '#E4405F' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/yourpage', color: '#1877F2' },
  { key: 'pinterest', label: 'Pinterest', icon: FaPinterest, placeholder: 'https://pinterest.com/yourprofile', color: '#BD081C' },
]

const INITIAL_SOCIALS = {
  tiktok: '',
  instagram: '',
  facebook: '',
  pinterest: '',
}

export const SocialLinksDashboard = () => {
  const [socials, setSocials] = useState(INITIAL_SOCIALS)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  const loadSocials = useCallback(async () => {
    try {
      const res = await api.get('/socials')
      const data = res.data || {}
      setSocials({ ...INITIAL_SOCIALS, ...data })
    } catch {
      setSocials(INITIAL_SOCIALS)
    }
  }, [])

  useEffect(() => {
    loadSocials()
  }, [loadSocials])

  useEffect(() => {
    const handler = () => { loadSocials() }
    window.addEventListener('admin:data-changed', handler)
    return () => window.removeEventListener('admin:data-changed', handler)
  }, [loadSocials])

  const handleChange = (key, value) => {
    setSocials({ ...socials, [key]: value })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setStatus({ type: '', message: '' })
    try {
      await api.post('/admin/socials', socials)
      setStatus({ type: 'success', message: 'Social links saved successfully' })
      dispatchAdminDataChanged('socials-changed')
      toast.success('Social links updated successfully')
    } catch (err) {
      setStatus({ type: 'error', message: err?.message || 'Failed to save social links' })
      toast.error(err?.message || 'Failed to save social links')
    } finally {
      setSaving(false)
      setTimeout(() => setStatus({ type: '', message: '' }), 4000)
    }
  }

  const validateUrl = (url) => {
    if (!url) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const isValid = SOCIAL_PLATFORMS.every(p => validateUrl(socials[p.key]))

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">Social Links</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">Manage social media profile links for footer and socials page</p>
        </div>
      </motion.div>

      <AnimatePresence>
        {status.message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`toast flex items-center gap-2 mb-5 px-4 py-3 text-sm rounded-xl border shadow-lg ${
              status.type === 'error'
                ? 'bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/20'
                : 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
            }`}
          >
            <span>{status.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSave}
        className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] space-y-5"
      >
        <div>
          <h3 className="font-display text-xl text-[var(--primary)]">Social Media Links</h3>
          <p className="text-[10px] text-[var(--primary)]/50 mt-1">Enter the full URL for each social media profile. Leave empty to hide.</p>
        </div>

        <div className="space-y-4">
          {SOCIAL_PLATFORMS.map((platform) => {
            const Icon = platform.icon
            const urlValid = validateUrl(socials[platform.key])
            return (
              <div key={platform.key} className="space-y-1">
                <label className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">
                  <div className="w-8 h-8 rounded-lg bg-[var(--secondary)]/30 flex items-center justify-center text-[var(--primary)]/60" style={{ color: platform.color }}>
                    <Icon size={18} strokeWidth={1.5} />
                  </div>
                  {platform.label}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={socials[platform.key]}
                    onChange={(e) => handleChange(platform.key, e.target.value)}
                    placeholder={platform.placeholder}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12 ${
                      socials[platform.key] && !urlValid
                        ? 'border-[var(--error)] focus:border-[var(--error)]'
                        : 'border-[var(--border)] focus:border-[var(--accent)]'
                    }`}
                  />
                  {socials[platform.key] && !urlValid && (
                    <span className="absolute right-3 top-1/2 -translate-x-1/2 text-[var(--error)]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </span>
                  )}
                  {socials[platform.key] && urlValid && (
                    <span className="absolute right-3 top-1/2 -translate-x-1/2 text-[var(--success)]">
                      <Check size={16} strokeWidth={2} />
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full rounded-full bg-[var(--accent)] text-white py-3 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--accent)] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={saving || !isValid}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving...' : 'Save Social Links'}
        </motion.button>
      </motion.form>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)]"
      >
        <h3 className="font-display text-lg text-[var(--primary)] mb-4">Live Preview</h3>
        <p className="text-[10px] text-[var(--primary)]/50 mb-4">How the social links will appear on the homepage footer and socials page</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SOCIAL_PLATFORMS.map((platform) => {
            const Icon = platform.icon
            const url = socials[platform.key]
            return (
              <a
                key={platform.key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex flex-col items-center p-4 rounded-xl border transition-all duration-300 ${
                  url
                    ? 'bg-white border-[var(--border)] hover:border-[var(--accent)]/40 hover:shadow-[0_10px_30px_rgba(42,36,31,0.08)] cursor-pointer'
                    : 'bg-[var(--bg)]/30 border-[var(--border)]/40 opacity-50 cursor-not-allowed'
                }`}
                aria-label={url ? `Follow us on ${platform.label}` : `${platform.label} link not configured`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  url ? 'bg-[var(--secondary)]/30 group-hover:bg-[var(--accent)]/10' : 'bg-[var(--secondary)]/10'
                }`} style={{ color: platform.color }}>
                  <Icon size={24} className={`transition-colors duration-300 ${
                    url ? 'text-[var(--primary)] group-hover:text-[var(--accent)]' : 'text-[var(--primary)]/30'
                  }`} strokeWidth={1.5} />
                </div>
                <span className={`mt-2 text-sm font-medium ${url ? 'text-[var(--primary)]' : 'text-[var(--primary)]/30'}`}>
                  {platform.label}
                </span>
                {url && (
                  <span className="mt-1 text-[10px] text-[var(--primary)]/50">Configured</span>
                )}
              </a>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

export default SocialLinksDashboard