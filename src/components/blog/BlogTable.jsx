import { useState } from 'react'
import {
  Search, Edit, Trash2, Globe, FileText, Play,
  CheckCircle, Loader2,
} from 'lucide-react'
import { api } from '../../services/api'
import { dispatchAdminDataChanged } from '../../utils/adminEvents'
import { formatDateShort, getBlogImageUrl } from '../../utils/blogHelpers'
import { getVideoPosterUrl } from '../../utils/cloudinaryHelpers'
import toast from 'react-hot-toast'

export const BlogTable = ({
  blogs,
  loading,
  onEdit,
  onDelete,
  onTogglePublish,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortOption,
  setSortOption,
  page,
  setPage,
  totalPages,
  clearFilters,
}) => {
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const handleTogglePublish = async (item) => {
    if (!item?.id) return
    const newStatus = !item.published
    setActionLoadingId(item.id + '-toggle')
    try {
      await api.patch(`/admin/blog/${item.id}`, { published: newStatus })
      onTogglePublish?.(item.id, newStatus)
      toast.success(`Blog ${newStatus ? 'published' : 'unpublished'}`)
      dispatchAdminDataChanged('blog-changed')
    } catch (err) {
      toast.error(`Failed to update: ${err?.message || 'Unknown error'}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDelete = async (item) => {
    if (!item?.id) return
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return
    setActionLoadingId(item.id + '-delete')
    try {
      await api.delete(`/admin/blog/${item.id}`)
      onDelete?.(item.id)
      toast.success('Blog deleted')
      dispatchAdminDataChanged('blog-changed')
    } catch (err) {
      toast.error(`Failed to delete: ${err?.message || 'Unknown error'}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  const renderThumbnail = (item) => {
    const imageUrl = getBlogImageUrl(item)
    const videoUrl = item.videoUrl || item.video || null
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={item.title}
          className="h-12 w-12 rounded-lg object-cover"
          loading="lazy"
          decoding="async"
          width={48}
          height={48}
          onError={(e) => { e.target.style.display = 'none' }}
        />
      )
    }
    if (videoUrl) {
      const poster = getVideoPosterUrl(videoUrl)
      return (
        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-[var(--secondary)]/20">
          {poster ? (
            <img src={poster} alt={item.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Play size={14} className="text-white drop-shadow" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <Play size={12} className="text-white drop-shadow" />
          </div>
        </div>
      )
    }
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--secondary)]/20 text-[var(--primary)]/20">
        <FileText size={20} />
      </div>
    )
  }

  const renderStatus = (item) => (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-2xs font-semibold ${
      item.published
        ? 'bg-green-100 text-green-700'
        : 'bg-amber-100 text-amber-700'
    }`}>
      {item.published ? 'Published' : 'Draft'}
    </span>
  )

  const renderActions = (item) => {
    const isLoading = actionLoadingId === item.id + '-toggle' || actionLoadingId === item.id + '-delete'
    return (
      <div className="flex items-center justify-center gap-1">
        {item.published && item.slug && (
          <a
            href={`/blog/${item.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-1.5 text-[var(--primary)]/40 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]"
            title="View post"
          >
            <Globe size={14} />
          </a>
        )}
        <button
          onClick={() => onEdit(item)}
          className="rounded-lg p-1.5 text-[var(--primary)]/40 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]"
          title="Edit"
          disabled={isLoading}
        >
          <Edit size={14} />
        </button>
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            <button
              onClick={() => handleTogglePublish(item)}
              className="rounded-lg p-1.5 text-[var(--primary)]/40 hover:bg-[var(--secondary)]/30 hover:text-[var(--primary)]"
              title={item.published ? 'Unpublish' : 'Publish'}
            >
              <CheckCircle size={14} className={item.published ? 'text-green-600' : ''} />
            </button>
            <button
              onClick={() => handleDelete(item)}
              className="rounded-lg p-1.5 text-[var(--primary)]/40 hover:bg-[var(--secondary)]/30 hover:text-red-600"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="admin-card-glass">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]/30" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm || ''}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-xl border border-border/50 bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--primary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter || 'all'}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-xl border border-border/50 bg-white px-3 py-2 text-xs font-medium text-[var(--primary)]/70 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="rounded-xl border border-border/50 bg-white px-3 py-2 text-xs font-medium text-[var(--primary)]/70 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          >
            <option value="createdAt:desc">Newest First</option>
            <option value="createdAt:asc">Oldest First</option>
            <option value="title:asc">Title (A-Z)</option>
            <option value="title:desc">Title (Z-A)</option>
            <option value="displayOrder:asc">Display Order</option>
            <option value="views:desc">Most Viewed</option>
          </select>

          {(searchTerm || statusFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="rounded-xl px-3 py-2 text-xs font-medium text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30"
              title="Clear filters"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="py-16 text-center text-[var(--primary)]/30">
          <FileText size={48} className="mx-auto mb-4" />
          <p className="font-display text-xl">No blog posts found.</p>
        </div>
      ) : (
        <>
          {/* Desktop table (md+): traditional grid-style table */}
          <div className="hidden w-full md:block">
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--primary)]/50">Thumbnail</th>
                    <th className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--primary)]/50">Title</th>
                    <th className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--primary)]/50">Category</th>
                    <th className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--primary)]/50">Author</th>
                    <th className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--primary)]/50">Created</th>
                    <th className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--primary)]/50">Updated</th>
                    <th className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--primary)]/50">Views</th>
                    <th className="px-4 py-3 text-center text-2xs font-semibold uppercase tracking-wider text-[var(--primary)]/50">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map((item) => (
                    <tr key={item.id || item._id}>
                      <td className="px-4 py-3.5">{renderThumbnail(item)}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-[var(--primary)] line-clamp-1 flex items-center gap-2">
                          {item.featured && <span className="text-[var(--accent)]">★</span>}
                          {item.title}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[var(--primary)]/60">{item.category || '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-[var(--primary)]/60">{item.author || '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-[var(--primary)]/60">{formatDateShort(item.createdAt)}</td>
                      <td className="px-4 py-3.5 text-sm text-[var(--primary)]/60">{formatDateShort(item.updatedAt)}</td>
                      <td className="px-4 py-3.5 text-sm text-[var(--primary)]/60">{item.views || 0}</td>
                      <td className="px-4 py-3.5">{renderActions(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile + tablet card grid (below md): 1-col mobile / 2-col tablet / 3-col desktop */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:hidden">
            {blogs.map((item) => (
              <div key={item.id || item._id} className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-[0_2px_16px_rgba(42,36,31,0.04)]">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">{renderThumbnail(item)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {item.featured && <span className="text-[var(--accent)]">★</span>}
                      <span className="font-medium text-[var(--primary)] line-clamp-1">{item.title}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--primary)]/60">
                      {item.category && <span>{item.category}</span>}
                      {item.author && <span>• {item.author}</span>}
                    </div>
                    <div className="mt-2">{renderStatus(item)}</div>
                    <div className="mt-2 text-xs text-[var(--primary)]/60">
                      Updated {formatDateShort(item.updatedAt)} • {item.views || 0} views
                    </div>
                  </div>
                </div>
                {renderActions(item)}
              </div>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="border-t border-border/50 px-4 py-3.5 flex items-center justify-between">
          <div className="text-xs text-[var(--primary)]/50">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--primary)]/60 hover:bg-[var(--secondary)]/30 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlogTable
