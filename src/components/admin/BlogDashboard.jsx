import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '../../services/api'
import { ADMIN_DATA_CHANGED_EVENT, getAdminDataChangedPayload, dispatchAdminDataChanged } from '../../utils/adminEvents'
import BlogStatsBar from '../blog/BlogStatsBar'
import BlogTable from '../blog/BlogTable'
import BlogForm from '../blog/BlogForm'

const ITEMS_PER_PAGE = 20

const BlogDashboard = () => {
  const [blogs, setBlogs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBlog, setEditingBlog] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOption, setSortOption] = useState('createdAt:desc')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })

  const loadBlogs = useCallback(async (params) => {
    const p = params || {
      page,
      search: searchTerm,
      status: statusFilter,
      sort: sortOption,
    }
    try {
      const query = new URLSearchParams({
        page: String(p.page || 1),
        limit: String(ITEMS_PER_PAGE),
        sort: p.sort || 'createdAt:desc',
      })
      if (p.search) query.set('search', p.search)
      if (p.status && p.status !== 'all') query.set('status', p.status)

      const res = await api.get(`/admin/blog?${query.toString()}`)
      const data = Array.isArray(res.data) ? res.data : res.data?.items || []
      setBlogs(data)
      setMeta({
        total: res.meta?.total || data.length,
        totalPages: res.meta?.totalPages || Math.ceil((res.meta?.total || data.length) / ITEMS_PER_PAGE),
      })
    } catch (err) {
      console.error('[BlogDashboard] load error:', err?.message)
      toast.error(`Failed to load blogs: ${err?.message || 'Unknown error'}`)
      setBlogs([])
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, statusFilter, sortOption])

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/blog/stats')
      setStats(res.data || {})
    } catch (err) {
      console.error('[BlogDashboard] stats error:', err?.message)
      setStats({ totalPosts: 0, publishedPosts: 0, draftPosts: 0, totalImages: 0, totalVideos: 0, totalViews: 0 })
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBlogs()
  }, [loadBlogs])

  useEffect(() => {
    loadStats()
    loadBlogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handler = (event) => {
      const payload = getAdminDataChangedPayload(event)
      if (payload?.type === 'blog-changed') {
        loadBlogs()
        loadStats()
      }
    }
    window.addEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
    return () => window.removeEventListener(ADMIN_DATA_CHANGED_EVENT, handler)
  }, [loadBlogs, loadStats])

  const handleCreate = () => {
    setEditingBlog(null)
    setShowForm(true)
  }

  const handleEdit = (blogItem) => {
    setEditingBlog(blogItem)
    setShowForm(true)
  }

  const handleDelete = (id) => {
    setBlogs((prev) => prev.filter((b) => (b.id || b._id) !== id))
    loadStats()
    dispatchAdminDataChanged('blog-changed')
  }

  const handleTogglePublish = (id, newStatus) => {
    setBlogs((prev) =>
      prev.map((b) => ((b.id || b._id) === id ? { ...b, published: newStatus } : b))
    )
    dispatchAdminDataChanged('blog-changed')
  }

  const handleSaved = () => {
    setShowForm(false)
    setEditingBlog(null)
    loadBlogs()
    loadStats()
    dispatchAdminDataChanged('blog-changed')
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingBlog(null)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <BlogStatsBar stats={stats} loading={statsLoading} />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[var(--primary)]">Blog Dashboard</h1>
          <p className="text-sm text-[var(--primary)]/50 mt-1">
            {meta.total} posts • Page {page} of {meta.totalPages || 1}
          </p>
        </div>
        <button onClick={handleCreate} className="btn-luxury-primary inline-flex items-center gap-2">
          <Plus size={16} />
          New Blog Post
        </button>
      </div>

      <BlogTable
        blogs={blogs}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onTogglePublish={handleTogglePublish}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
        page={page}
        setPage={setPage}
        totalPages={meta.totalPages}
        clearFilters={clearFilters}
      />

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.15)] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border/50 px-6 py-4 flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold text-[var(--primary)]">
                    {editingBlog ? 'Edit Blog Post' : 'New Blog Post'}
                  </h2>
                  <button
                    onClick={handleCloseForm}
                    className="rounded-xl p-2 text-[var(--primary)]/40 hover:bg-[var(--secondary)]/30"
                  >
                    ×
                  </button>
                </div>
                <div className="p-6">
                  <BlogForm
                    blog={editingBlog}
                    onSaved={handleSaved}
                    onCancel={handleCloseForm}
                  />
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BlogDashboard
