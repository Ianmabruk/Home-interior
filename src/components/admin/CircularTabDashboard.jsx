import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud, Save, RefreshCw, Image as ImageIcon, Check, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '../../services/api'
import { compressImages } from '../../utils/imageCompression'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'

const SECTIONS = [
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'services', label: 'Services' },
  { key: 'virtual_design', label: 'Virtual Design' },
  { key: 'shop_with_us', label: 'Shop With Us' },
  { key: 'blog', label: 'Blog' },
  { key: 'about_us', label: 'About Us' },
  { key: 'socials', label: 'Socials' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'work_with_us', label: 'Work With Us' },
]

export const CircularTabDashboard = () => {
  const [previews, setPreviews] = useState({})
  const [files, setFiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/circular-tabs')
      const data = Array.isArray(res.data) ? res.data : res.data?.data || []
      const tabsMap = {}
      const previewMap = {}
      for (const tab of data) {
        tabsMap[tab.key] = tab
        previewMap[tab.key] = tab.imageUrl || null
      }
      setTabs(tabsMap)
      setPreviews(previewMap)
      setFiles({})
    } catch {
      toast.error('Failed to load circular tabs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleImageSelect = async (key, fileList) => {
    const file = fileList?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB')
      return
    }

    try {
      const compressed = await compressImages([file], { maxWidth: 800, maxHeight: 800, quality: 0.85 })
      const finalFile = compressed[0] || file
      const preview = URL.createObjectURL(finalFile)

      setFiles((prev) => ({ ...prev, [key]: finalFile }))
      setPreviews((prev) => ({ ...prev, [key]: preview }))
    } catch {
      toast.error('Failed to process image')
    }
  }

  const handleSave = async (key) => {
    const file = files[key]

    if (!file) {
      toast.error('Please select an image first')
      return
    }

    setSaving((prev) => ({ ...prev, [key]: true }))

    try {
      const payload = new FormData()
      payload.append('image', file)

      await api.patch(`/admin/circular-tabs/${key}`, payload)

      toast.success(`${getLabel(key)} circular tab image updated!`)
      dispatchAdminDataChanged('circular-tabs-changed')
      await loadData()
    } catch (err) {
      toast.error(err?.message || `Failed to update ${getLabel(key)} circular tab`)
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }))
    }
  }

  const handleRemoveImage = async (key) => {
    setSaving((prev) => ({ ...prev, [key]: true }))

    try {
      await api.delete(`/admin/circular-tabs/${key}/image`)

      toast.success(`${getLabel(key)} circular tab image removed!`)
      dispatchAdminDataChanged('circular-tabs-changed')
      await loadData()
    } catch (err) {
      toast.error(err?.message || `Failed to remove ${getLabel(key)} circular tab image`)
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }))
    }
  }

  const getLabel = (key) => {
    const section = SECTIONS.find((s) => s.key === key)
    return section?.label || key
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl text-[var(--primary)]">Homepage Circular Tabs</h2>
        <p className="text-sm text-[var(--primary)]/60 mt-1">
          Manage the circular tab images displayed on the homepage for each section. Changes appear immediately on the homepage.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SECTIONS.map((section, index) => {
          const key = section.key
          const preview = previews[key]
          const isSaving = saving[key]
          const hasNewFile = !!files[key]

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl border border-[var(--border)]/60 overflow-hidden shadow-sm"
            >
              <div className="p-4 border-b border-[var(--border)]/40 bg-[var(--bg)]/30">
                <h3 className="font-display text-lg text-[var(--primary)]">{section.label}</h3>
                <p className="text-[10px] text-[var(--primary)]/50 mt-0.5">
                  Homepage circular tab image
                </p>
              </div>

              <div className="p-4">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-[var(--bg)]/50 mb-4 border-2 border-dashed border-[var(--border)]/40">
                  {preview ? (
                    <>
                      <img
                        src={preview}
                        alt={`${section.label} circular tab`}
                        className="h-full w-full object-cover"
                      />
                      {hasNewFile && (
                        <div className="absolute top-2 left-2 bg-[var(--accent)] text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                          New
                        </div>
                      )}
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-[var(--accent)]/5 transition-colors">
                      <UploadCloud size={32} className="text-[var(--primary)]/30 mb-2" />
                      <span className="text-sm text-[var(--primary)]/50">Click to upload</span>
                      <span className="text-[10px] text-[var(--primary)]/30 mt-1">PNG, JPG, WebP</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageSelect(key, e.target.files)}
                      />
                    </label>
                  )}
                </div>

                {preview && (
                  <div className="flex gap-2 mb-3">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageSelect(key, e.target.files)}
                      />
                      <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-white text-xs text-[var(--primary)]/70 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                        <ImageIcon size={14} />
                        Replace
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(key)}
                      disabled={isSaving}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[var(--error)]/30 bg-white text-xs text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleSave(key)}
                  disabled={isSaving || !hasNewFile}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent)]/90 transition-colors"
                >
                  {isSaving ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>

                {hasNewFile && (
                  <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-[var(--success)]">
                    <Check size={12} />
                    <span>Image ready. Click Save to update homepage.</span>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="bg-[var(--accent)]/10 rounded-2xl p-6">
        <h3 className="font-display text-lg text-[var(--primary)] mb-2">How it works</h3>
        <ul className="text-sm text-[var(--primary)]/70 space-y-1">
          <li>1. Upload a circular tab image for each section</li>
          <li>2. Click "Save Changes" to update the homepage circular tab</li>
          <li>3. The homepage will automatically display the new image</li>
          <li>4. Changes persist across page refreshes and deployments</li>
        </ul>
      </div>
    </div>
  )
}

export default CircularTabDashboard
