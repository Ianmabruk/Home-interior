import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Trash2, Edit2, Plus, X, Eye } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '../../services/api'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'

const STATUSES = ['NEW', 'CONTACTED', 'IN DISCUSSION', 'APPROVED', 'COMPLETED', 'DECLINED']

const STATUS_COLORS = {
  NEW: 'bg-gray-100 text-gray-700 border-gray-200',
  CONTACTED: 'bg-blue-100 text-blue-700 border-blue-200',
  'IN DISCUSSION': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  DECLINED: 'bg-red-100 text-red-700 border-red-200',
}

export const WorkWithUsDashboard = () => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    budget: '',
    startDate: '',
    timeline: '',
    status: 'NEW',
  })

  const load = async () => {
    try {
      const res = await api.get('/content/work-with-us')
      setSubmissions(res.data || [])
    } catch {
      setSubmissions([])
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await api.get('/content/work-with-us')
        setSubmissions(res.data || [])
      } catch {
        setSubmissions([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const handler = () => {
      api.get('/content/work-with-us')
        .then((res) => setSubmissions(res.data || []))
        .catch(() => {})
    }
    window.addEventListener('admin-data-changed', handler)
    return () => window.removeEventListener('admin-data-changed', handler)
  }, [])

  const resetForm = () => {
    setForm({ fullName: '', phone: '', email: '', budget: '', startDate: '', timeline: '', status: 'NEW' })
    setEditing(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) {
        await api.patch(`/content/work-with-us/${editing}`, { status: form.status })
        toast.success('Status updated successfully')
      } else {
        await api.post('/content/work-with-us', form)
        toast.success('Submission created successfully')
      }
      setShowForm(false)
      resetForm()
      load()
      dispatchAdminDataChanged('work-with-us-changed')
    } catch {
      toast.error('Failed to save submission')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item) => {
    setEditing(item._id || item.id)
    setForm({
      fullName: item.fullName || '',
      phone: item.phone || '',
      email: item.email || '',
      budget: item.budget || '',
      startDate: item.startDate || '',
      timeline: item.timeline || '',
      status: item.status || 'NEW',
    })
    setShowForm(true)
  }

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/content/work-with-us/${id}`, { status: newStatus })
      setSubmissions((prev) => prev.map((s) => ((s._id === id || s.id === id) ? { ...s, status: newStatus } : s)))
      if (viewItem && (viewItem._id === id || viewItem.id === id)) {
        setViewItem((prev) => ({ ...prev, status: newStatus }))
      }
      dispatchAdminDataChanged('work-with-us-changed')
      toast.success('Status updated')
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/content/work-with-us/${deleteId}`)
      setDeleteId(null)
      load()
      dispatchAdminDataChanged('work-with-us-changed')
      toast.success('Submission deleted successfully')
    } catch {
      toast.error('Failed to delete submission')
    }
  }

  const filtered = submissions.filter((s) => {
    if (statusFilter && s.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s._id?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">Work With Us</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">{submissions.length} submissions</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-full bg-[var(--primary)] text-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg flex items-center gap-1.5"
        >
          <Plus size={12} /> New Submission
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-3"
      >
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition pl-9"
            placeholder="Search by name, email, phone..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] overflow-hidden"
      >
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/40 to-[var(--accent)]/10 flex items-center justify-center mb-4 text-[var(--primary)]/20">
              <Plus size={32} />
            </div>
            <p className="font-display text-xl text-[var(--primary)]/30">
              {search ? 'No submissions found' : 'No submissions yet'}
            </p>
            <p className="mt-2 text-sm text-[var(--primary)]/50">Submissions will appear here when customers fill the form</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Name</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Email</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Phone</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Budget</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Timeline</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Start Date</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Status</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Date</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <motion.tr
                    key={s._id || s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group border-b border-[var(--border)]/30 transition-all duration-150 hover:bg-[var(--bg)]/40"
                  >
                    <td className="px-4 py-3.5 text-[var(--primary)]">
                      <div className="font-medium">{s.fullName}</div>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--primary)]/70">{s.email}</td>
                    <td className="px-4 py-3.5 text-[var(--primary)]/70">{s.phone}</td>
                    <td className="px-4 py-3.5 text-[var(--primary)]/70">{s.budget}</td>
                    <td className="px-4 py-3.5 text-[var(--primary)]/70">{s.timeline}</td>
                    <td className="px-4 py-3.5 text-[var(--primary)]/70">{s.startDate || '-'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${STATUS_COLORS[s.status] || STATUS_COLORS.NEW}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--primary)]/60 text-xs">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setViewItem(s)}
                          className="p-2 rounded-lg text-[var(--primary)]/70 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
                          title="View"
                        >
                          <Eye size={14} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEdit(s)}
                          className="p-2 rounded-lg text-[var(--primary)]/70 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDeleteId(s._id || s.id)}
                          className="p-2 rounded-lg text-[var(--error)]/70 hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => { if (!editing) resetForm(); setShowForm(false); }}
          >
            <div className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm" />
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleSubmit}
              className="relative bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(false); }}
                className="absolute top-4 right-4 p-2 rounded-full text-[var(--primary)]/60 hover:text-[var(--primary)] hover:bg-[var(--secondary)]/60 transition-colors"
                aria-label="Close form"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <h3 className="font-display text-xl text-[var(--primary)]">{editing ? 'Edit Submission' : 'New Work With Us Submission'}</h3>
                <p className="text-xs text-[var(--primary)]/50 mt-1">Update the submission details below</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Full Name *</label>
                  <input
                    value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    placeholder="Client full name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Phone *</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                      placeholder="07XXXXXXXX"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Budget *</label>
                    <input
                      value={form.budget}
                      onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                      placeholder="e.g. KES 500,000"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Start Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Timeline *</label>
                  <input
                    value={form.timeline}
                    onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    placeholder="e.g. 3-6 months"
                    required
                  />
                </div>

                {editing && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition h-12"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border)]/50">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => { resetForm(); setShowForm(false); }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="rounded-full bg-[var(--primary)] text-white px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving…' : (editing ? 'Update Submission' : 'Create Submission')}
                  </motion.button>
                </div>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setViewItem(null)}
          >
            <div className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-lg w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-[var(--primary)]/60 hover:text-[var(--primary)] hover:bg-[var(--secondary)]/60 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
              <h3 className="font-display text-xl text-[var(--primary)] mb-4">Submission Details</h3>
              <div className="space-y-3 text-sm">
                <div><span className="text-[var(--primary)]/50">Name:</span> <span className="text-[var(--primary)] font-medium">{viewItem.fullName}</span></div>
                <div><span className="text-[var(--primary)]/50">Email:</span> <span className="text-[var(--primary)]">{viewItem.email}</span></div>
                <div><span className="text-[var(--primary)]/50">Phone:</span> <span className="text-[var(--primary)]">{viewItem.phone}</span></div>
                <div><span className="text-[var(--primary)]/50">Budget:</span> <span className="text-[var(--primary)]">{viewItem.budget}</span></div>
                <div><span className="text-[var(--primary)]/50">Start Date:</span> <span className="text-[var(--primary)]">{viewItem.startDate || '-'}</span></div>
                <div><span className="text-[var(--primary)]/50">Timeline:</span> <span className="text-[var(--primary)]">{viewItem.timeline}</span></div>
                <div><span className="text-[var(--primary)]/50">Status:</span> <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${STATUS_COLORS[viewItem.status] || STATUS_COLORS.NEW}`}>{viewItem.status}</span></div>
                <div><span className="text-[var(--primary)]/50">Submitted:</span> <span className="text-[var(--primary)]">{formatDate(viewItem.createdAt)}</span></div>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--border)]/50">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusUpdate(viewItem._id || viewItem.id, s)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${viewItem.status === s ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-white text-[var(--primary)]/70 border-[var(--border)] hover:border-[var(--accent)]'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteId(null)}
          >
            <div className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--error)]/10 flex items-center justify-center text-[var(--error)]">
                <Trash2 size={24} />
              </div>
              <h3 className="font-display text-xl text-[var(--primary)] text-center mb-2">Delete this submission?</h3>
              <p className="text-sm text-[var(--primary)]/50 text-center mb-6">This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteId(null)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  className="rounded-full bg-[var(--error)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-white transition hover:bg-[var(--error)] hover:shadow-lg"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default WorkWithUsDashboard
