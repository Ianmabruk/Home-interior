import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Trash2,
  Eye,
  Reply,
  Search,
  CheckCircle2,
  X,
  Calendar,
  User,
  MessageSquare,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '../../services/api'
import { emitAdminDataChanged } from '../../utils/adminEvents'

export const ContactsDashboard = () => {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewItem, setViewItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/messages')
      setContacts(Array.isArray(res.data) ? res.data : [])
    } catch {
      setContacts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const handler = () => { load() }
    window.addEventListener('admin:data-changed', handler)
    return () => window.removeEventListener('admin:data-changed', handler)
  }, [load])

  const markRead = async (id) => {
    try {
      await api.patch(`/messages/${id}/read`, {})
      load()
      emitAdminDataChanged({ type: 'messages-changed' })
      toast.success('Marked as read.')
    } catch {
      toast.error('Failed to mark as read.')
    }
  }

  const reply = async (id) => {
    if (!replyText.trim()) return
    try {
      await api.post('/messages/reply', { messageId: id, reply: replyText.trim() })
      setReplyingTo(null)
      setReplyText('')
      load()
      emitAdminDataChanged({ type: 'messages-changed' })
      toast.success('Reply sent successfully.')
    } catch {
      toast.error('Failed to send reply.')
    }
  }

  const deleteItem = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/messages/${deleteId}`)
      setDeleteId(null)
      load()
      emitAdminDataChanged({ type: 'messages-changed' })
      toast.success('Contact deleted successfully.')
    } catch {
      toast.error('Failed to delete contact.')
    }
  }

  const filtered = contacts.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.subject?.toLowerCase().includes(q) ||
      c.content?.toLowerCase().includes(q)
    )
  })

  const ViewModal = () => {
    if (!viewItem) return null
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm"
          onClick={() => setViewItem(null)}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-5">
            <h3 className="font-display text-2xl text-[var(--primary)]">Message Details</h3>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setViewItem(null)}
              className="p-2 rounded-full hover:bg-[var(--bg)] transition-colors"
            >
              <X size={18} />
            </motion.button>
          </div>
          <div className="space-y-3">
            {[
              { icon: User, label: 'Name', value: viewItem.name },
              { icon: Mail, label: 'Email', value: viewItem.email },
              { icon: MessageSquare, label: 'Subject', value: viewItem.subject || '—' },
              { icon: Calendar, label: 'Date', value: viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleString() : '—' },
            ].map((field, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-gradient-to-r from-[var(--bg)] to-[var(--secondary)]/10 rounded-xl p-3"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] flex-shrink-0">
                  {field.icon ? <field.icon size={14} /> : <span className="inline-block h-3 w-3 rounded-full bg-white/10" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70">{field.label}</p>
                  <p className="text-sm text-[var(--primary)] mt-0.5 font-medium break-all">{field.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--border)] pt-4 mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 mb-2">Message</p>
            <p className="text-sm leading-relaxed text-[var(--primary)] bg-gradient-to-r from-[var(--bg)] to-[var(--secondary)]/10 rounded-xl p-4 whitespace-pre-wrap">
              {viewItem.content}
            </p>
          </div>
          {viewItem.reply && (
            <div className="border-t border-[var(--border)] pt-4 mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/70 mb-2">Reply</p>
              <p className="text-sm leading-relaxed text-[var(--success)] bg-[var(--success)]/5 rounded-xl p-4 whitespace-pre-wrap">
                {viewItem.reply}
              </p>
            </div>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setViewItem(null)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Close
            </motion.button>
            {!viewItem.isRead && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { markRead(viewItem._id || viewItem.id); setViewItem(null) }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--accent)] bg-white px-4 py-2.5 text-2xs font-semibold uppercase tracking-widest text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
              >
                <CheckCircle2 size={12} />
                Mark Read
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-3xl text-[var(--primary)]">Contacts</h2>
          <p className="text-sm text-[var(--primary)]/50 mt-1">{contacts.length} messages</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <motion.div whileHover={{ scale: 1.02 }} className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-x-1/2 text-[var(--primary)]/50"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none placeholder:text-[var(--primary)]/35 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition pl-9 max-w-xs"
              placeholder="Search contacts..."
            />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-xl border border-[var(--border)]/60 rounded-2xl p-5 shadow-[0_10px_40px_rgba(42,36,31,0.06)] overflow-hidden"
      >
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-white/60 border border-[var(--border)]/60 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--secondary)]/30 to-[var(--accent)]/10 flex items-center justify-center mb-4 text-[var(--primary)]/30">
              <Mail size={32} />
            </div>
            <p className="font-display text-xl text-[var(--primary)]/30">No messages</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Name</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Email</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Subject</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Message</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Date</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <motion.tr
                    key={c._id || c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`group border-b border-[var(--border)]/50 transition-colors duration-150 hover:bg-[var(--bg)]/40 ${!c.isRead ? 'bg-[var(--accent)]/5' : ''}`}
                  >
                    <td className="px-4 py-3.5 text-[var(--primary)]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)]/10 to-[var(--secondary)]/40 flex items-center justify-center text-[var(--accent)] text-xs font-semibold">
                          {(c.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--primary)]/50 max-w-xs truncate">{c.email}</td>
                    <td className="px-4 py-3.5 text-[var(--primary)]/50 max-w-xs truncate">{c.subject || '—'}</td>
                    <td className="px-4 py-3.5 text-[var(--primary)]/50 max-w-xs truncate">{c.content}</td>
                    <td className="px-4 py-3.5 text-[var(--primary)]/50">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setViewItem(c)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-white px-3 py-1.5 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                          <Eye size={12} />
                          View
                        </motion.button>
                        {!c.isRead && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => markRead(c._id || c.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-[var(--success)] hover:bg-[var(--success)]/10 transition"
                          >
                            <CheckCircle2 size={12} />
                            Read
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDeleteId(c._id || c.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-[var(--error)] hover:bg-[var(--error)]/10 transition"
                        >
                          <Trash2 size={12} />
                          Delete
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
        {viewItem && <ViewModal key="view-modal" />}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-[0_30px_80px_rgba(0,0,0,0.2)]"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--error)]/10 flex items-center justify-center text-[var(--error)]">
                <Trash2 size={24} />
              </div>
              <h3 className="font-display text-xl text-[var(--primary)] text-center mb-2">Delete this message?</h3>
              <p className="text-sm text-[var(--primary)]/50 text-center mb-6">This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteId(null)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-2xs font-semibold uppercase tracking-widest text-[var(--primary)]/70 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={deleteItem}
                  className="rounded-full bg-[var(--error)] px-4 py-2.5 text-2xs font-semibold uppercase tracking-widest text-white transition hover:bg-[var(--error)] hover:shadow-lg"
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

export default ContactsDashboard
