import { AnimatePresence, motion } from 'framer-motion'
import { Maximize2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../services/api'

export const VirtualDesignPage = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [fullscreen, setFullscreen] = useState(null)
  const fullscreenRef = useRef(null)

  useEffect(() => {
    api
      .get('/content/virtual-design')
      .then((res) => setItems(res.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!query) return items
    const q = query.toLowerCase()
    return items.filter(
      (i) => i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q),
    )
  }, [items, query])

  const openFullscreen = (item) => {
    setFullscreen(item)
    document.body.style.overflow = 'hidden'
  }

  const closeFullscreen = () => {
    setFullscreen(null)
    document.body.style.overflow = ''
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <h1 className="font-display text-5xl">Virtual Interior Design</h1>
      <p className="mt-3 max-w-3xl text-sm text-ink/70">
        Immersive walkthroughs, luxury showcases, and interior design experiences.
      </p>

      {/* Search */}
      <div className="mt-8">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search showroom..."
          className="w-full max-w-sm rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange/30"
        />
      </div>

      {loading && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-beige" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="mt-12 text-center text-sm text-ink/50">
          {items.length === 0 ? 'No showroom content yet.' : 'No results match your search.'}
        </p>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item, i) => (
          <motion.article
            key={item._id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-soft"
          >
            <div className="relative">
              <video
                src={item.videoUrl}
                className="h-64 w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              />
              <button
                onClick={() => openFullscreen(item)}
                className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/70"
                aria-label="Full screen"
              >
                <Maximize2 size={16} />
              </button>
            </div>
            <div className="p-4">
              <h3 className="font-display text-2xl">{item.title}</h3>
              {item.description && (
                <p className="mt-1 text-sm text-ink/65 line-clamp-2">{item.description}</p>
              )}
              {item.services?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.services.map((s, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-beige px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-ink/70"
                    >
                      {s.title}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={() => openFullscreen(item)}
                className="mt-4 rounded-full border border-ink px-5 py-2 text-xs uppercase tracking-[0.14em] transition hover:bg-ink hover:text-white"
              >
                Watch Full Screen
              </button>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Full-screen modal */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          >
            <button
              onClick={closeFullscreen}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <video
              ref={fullscreenRef}
              src={fullscreen.videoUrl}
              controls
              autoPlay
              loop
              playsInline
              className="max-h-screen w-full object-contain"
            />
            <div className="absolute bottom-6 left-0 right-0 px-6 text-center">
              <p className="font-display text-2xl text-white drop-shadow">{fullscreen.title}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
