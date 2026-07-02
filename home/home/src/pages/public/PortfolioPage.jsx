import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'

const PAGE_SIZE = 12

export const PortfolioPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    api
      .get('/content/portfolio')
      .then((res) => setItems(res.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean))
    return Array.from(set).sort()
  }, [items])

  const filtered = useMemo(() => {
    let next = [...items]
    if (query) {
      const q = query.toLowerCase()
      next = next.filter((i) => i.title?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q))
    }
    if (category) {
      next = next.filter((i) => i.category === category)
    }
    return next
  }, [items, query, category])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleFilter = (cat) => {
    setCategory(cat)
    setPage(1)
  }

  const handleSearch = (e) => {
    setQuery(e.target.value)
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <h1 className="font-display text-5xl">Portfolio</h1>
      <p className="mt-3 max-w-3xl text-sm text-ink/70">
        A curated view of premium interiors delivered by HOK Interior Designs.
      </p>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={handleSearch}
          placeholder="Search portfolio..."
          className="rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30"
        />
        <button
          onClick={() => handleFilter('')}
          className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.14em] transition ${
            !category ? 'bg-ink text-white' : 'border border-black/20 text-ink hover:bg-beige'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleFilter(cat)}
            className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.14em] transition ${
              category === cat ? 'bg-ink text-white' : 'border border-black/20 text-ink hover:bg-beige'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs text-ink/50">{filtered.length} items</p>

      {loading && (
        <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="mb-4 h-64 animate-pulse rounded-2xl bg-beige" />
          ))}
        </div>
      )}

      {!loading && paginated.length === 0 && (
        <p className="mt-12 text-center text-sm text-ink/50">No portfolio items match your search.</p>
      )}

      <div className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {paginated.map((item, index) => (
          <motion.button
            key={item._id}
            onClick={() => setSelected(item)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="mb-4 w-full overflow-hidden rounded-2xl border border-black/10 bg-white text-left shadow-soft transition hover:shadow-md"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full object-cover"
              loading="lazy"
            />
            <div className="p-3">
              <p className="font-display text-2xl">{item.title}</p>
              <p className="text-xs uppercase tracking-[0.15em] text-orange">{item.category}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-full border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] disabled:opacity-40 hover:bg-beige"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-full text-xs font-semibold transition ${
                p === page ? 'bg-ink text-white' : 'border border-black/20 hover:bg-beige'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-full border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.14em] disabled:opacity-40 hover:bg-beige"
          >
            Next
          </button>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selected.imageUrl}
                alt={selected.title}
                className="max-h-[75vh] w-full object-contain"
              />
              <div className="p-4">
                <h2 className="font-display text-3xl">{selected.title}</h2>
                <p className="text-sm text-ink/65">{selected.category}</p>
                <button
                  onClick={() => setSelected(null)}
                  className="mt-3 rounded-full border border-ink px-5 py-2 text-xs uppercase tracking-[0.14em]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
