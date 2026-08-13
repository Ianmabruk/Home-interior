import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud, X, Save, Shield, Globe, Image as ImageIcon, Mail, Building2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '../../services/api'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'

const INITIAL_SETTINGS = {
  siteName: '',
  supportEmail: '',
  currency: 'USD',
  maintenanceMode: false,
  shippingPolicy: '',
  returnPolicy: '',
  socialLinks: '{}',
  shopBannerImage: '',
}

const SECTIONS = [
  { key: 'general', label: 'General', icon: Globe },
  { key: 'company', label: 'Company', icon: Building2 },
  { key: 'contact', label: 'Contact', icon: Mail },
  { key: 'branding', label: 'Branding', icon: ImageIcon },
  { key: 'security', label: 'Security', icon: Shield },
]

function Section({ title, icon: Icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)]"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
          <Icon size={16} />
        </div>
        <h3 className="font-display text-xl text-[var(--primary)]">{title}</h3>
      </div>
      {children}
    </motion.div>
  )
}

export const SettingsDashboard = () => {
  const [settings, setSettings] = useState(INITIAL_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [activeSection, setActiveSection] = useState('general')
  const [bannerPreview, setBannerPreview] = useState(null)
  const bannerRef = useRef(null)

  const loadSettings = useCallback(async () => {
    try {
      const res = await api.get('/admin/settings')
      const data = res.data?.data || {}
      setSettings({ ...INITIAL_SETTINGS, ...data })
      if (data.shopBannerImage) setBannerPreview(data.shopBannerImage)
    } catch {
      setSettings(INITIAL_SETTINGS)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    const handler = () => loadSettings()
    window.addEventListener('admin-data-changed', handler)
    return () => window.removeEventListener('admin-data-changed', handler)
  }, [loadSettings])

  const handleChange = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0] || null
    if (!file) return
    setSettings((s) => ({ ...s, shopBannerImage: file }))
    setBannerPreview(URL.createObjectURL(file))
  }

  const removeBanner = () => {
    setSettings((s) => ({ ...s, shopBannerImage: null }))
    setBannerPreview(null)
    if (bannerRef.current) bannerRef.current.value = ''
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setStatus({ type: '', message: '' })
    try {
      const payload = new FormData()
      Object.entries(settings).forEach(([key, value]) => {
        if (key === 'shopBannerImage') return
        if (typeof value === 'boolean') {
          payload.append(key, String(value))
        } else {
          payload.append(key, String(value ?? ''))
        }
      })

      const bannerFile = settings.shopBannerImage
      if (bannerFile && bannerFile instanceof File) {
        payload.append('image', bannerFile)
      }

      await api.put('/admin/settings', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (bannerFile && bannerFile instanceof File) {
        await api.post('/admin/settings/shop-banner', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      setStatus({ type: 'success', message: 'Settings saved successfully.' })
      await loadSettings()
      dispatchAdminDataChanged('settings-changed')
      toast.success('Settings saved successfully.')
    } catch (err) {
      const message = err?.message || 'Failed to save settings.'
      setStatus({ type: 'error', message })
      toast.error(message)
    } finally {
      setSaving(false)
      setTimeout(() => setStatus({ type: '', message: '' }), 4000)
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">Settings</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">Manage website configuration and preferences</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="btn-luxury-primary inline-flex items-center gap-2 whitespace-nowrap"
        >
          {saving ? 'Saving...' : <><Save size={16} /> Save Settings</>}
        </motion.button>
      </motion.div>

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

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeSection === s.key
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)] shadow-[0_4px_16px_rgba(232,154,67,0.15)]'
                  : 'text-[var(--primary)]/70 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]'
              }`}
            >
              <s.icon size={18} strokeWidth={1.5} />
              {s.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeSection === 'general' && (
            <Section title="General Settings" icon={Globe}>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Site Name</label>
                  <input
                    value={settings.siteName}
                    onChange={(e) => handleChange('siteName', e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    placeholder="HOK Interior Designs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="KES">KES (KSh)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="maintenanceMode"
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  />
                  <label htmlFor="maintenanceMode" className="text-sm text-[var(--primary)]">Maintenance Mode</label>
                </div>
              </div>
            </Section>
          )}

          {activeSection === 'company' && (
            <Section title="Company Information" icon={Building2}>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Shipping Policy</label>
                  <textarea
                    value={settings.shippingPolicy}
                    onChange={(e) => handleChange('shippingPolicy', e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                    placeholder="Enter shipping policy details..."
                    rows={4}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Return Policy</label>
                  <textarea
                    value={settings.returnPolicy}
                    onChange={(e) => handleChange('returnPolicy', e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition resize-none"
                    placeholder="Enter return policy details..."
                    rows={4}
                  />
                </div>
              </div>
            </Section>
          )}

          {activeSection === 'contact' && (
            <Section title="Contact Information" icon={Mail}>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Support Email</label>
                  <input
                    value={settings.supportEmail}
                    onChange={(e) => handleChange('supportEmail', e.target.value)}
                    type="email"
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                     placeholder="info@hokinteriors.co.ke"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Social Links (JSON)</label>
                  <textarea
                    value={settings.socialLinks}
                    onChange={(e) => handleChange('socialLinks', e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition font-mono text-xs resize-none"
                    placeholder='{"instagram": "url", "facebook": "url", "pinterest": "url", "tiktok": "url"}'
                    rows={3}
                  />
                </div>
              </div>
            </Section>
          )}

          {activeSection === 'branding' && (
            <Section title="Branding" icon={ImageIcon}>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 mb-2 block">Shop Banner Image</label>
                  <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                  {bannerPreview ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img src={bannerPreview} alt="Shop banner" className="w-full h-48 object-cover" />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={removeBanner}
                        className="absolute top-2 right-2 bg-[var(--primary)]/90 backdrop-blur-sm text-white p-2 rounded-full hover:bg-[var(--primary)] shadow-lg"
                      >
                        <X size={14} />
                      </motion.button>
                    </div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      onClick={() => bannerRef.current?.click()}
                      className="border-2 border-dashed border-[var(--border)] rounded-2xl p-8 text-center cursor-pointer hover:border-[var(--accent)] transition-colors"
                    >
                      <UploadCloud size={32} className="mx-auto mb-3 text-[var(--accent)]" />
                      <p className="text-sm text-[var(--primary)]">Click to upload shop banner</p>
                      <p className="text-[10px] text-[var(--primary)]/50 mt-1">PNG, JPG up to 10MB</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </Section>
          )}

          {activeSection === 'security' && (
            <Section title="Security" icon={Shield}>
              <div className="space-y-4">
                <p className="text-sm text-[var(--primary)]/60">Password changes and admin profile management are handled through the account panel.</p>
                <div className="p-4 rounded-xl bg-[var(--secondary)]/20 border border-[var(--border)]">
                  <p className="text-xs text-[var(--primary)]/50">Current user: <span className="font-medium text-[var(--primary)]">Admin</span></p>
                  <p className="text-xs text-[var(--primary)]/50 mt-1">Role: <span className="font-medium text-[var(--primary)]">Administrator</span></p>
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsDashboard
