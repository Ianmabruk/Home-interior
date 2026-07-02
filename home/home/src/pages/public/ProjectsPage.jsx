import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'

const getFirstMedia = (project) => {
  if (Array.isArray(project.media) && project.media.length) return project.media[0]
  if (project.videoUrl) return { type: 'video', url: project.videoUrl }
  if (project.coverImageUrl) return { type: 'image', url: project.coverImageUrl }
  return null
}

export const ProjectsPage = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api
      .get('/content/projects')
      .then((res) => setProjects(res.data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <h1 className="font-display text-5xl">Projects</h1>
      <p className="mt-3 max-w-3xl text-sm text-ink/70">
        Explore interior design projects — videos and images uploaded directly from the admin dashboard.
      </p>

      {loading && (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-beige" />
          ))}
        </div>
      )}

      {!loading && projects.length === 0 && (
        <p className="mt-12 text-center text-sm text-ink/50">No projects published yet.</p>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {projects.map((project, i) => {
          const firstMedia = getFirstMedia(project)
          return (
            <motion.article
              key={project._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-black/10 bg-white shadow-soft"
              onClick={() => setSelected(project)}
            >
              {firstMedia?.type === 'video' ? (
                <video
                  src={firstMedia.url}
                  className="h-72 w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : firstMedia?.type === 'image' ? (
                <img
                  src={firstMedia.url}
                  alt={project.title}
                  className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-72 items-center justify-center bg-beige">
                  <p className="text-sm text-ink/40">No media</p>
                </div>
              )}
              <div className="p-5">
                <h2 className="font-display text-3xl">{project.title}</h2>
                <p className="mt-2 text-sm text-ink/70 line-clamp-2">{project.description}</p>
                {Array.isArray(project.media) && project.media.length > 1 && (
                  <p className="mt-2 text-xs text-orange">{project.media.length} media items</p>
                )}
              </div>
            </motion.article>
          )
        })}
      </div>

      <div className="mt-10 text-center">
        <Link
          to="/portfolio"
          className="rounded-full border border-ink px-6 py-3 text-xs uppercase tracking-[0.16em] transition hover:bg-ink hover:text-white"
        >
          View Portfolio
        </Link>
      </div>

      {/* Full-screen media modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Show all media for selected project */}
            <div className="overflow-y-auto max-h-[75vh]">
              {(selected.media?.length
                ? selected.media
                : [getFirstMedia(selected)].filter(Boolean)
              ).map((m, idx) =>
                m.type === 'video' ? (
                  <video
                    key={idx}
                    src={m.url}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full"
                  />
                ) : (
                  <img key={idx} src={m.url} alt={selected.title} className="w-full object-contain" />
                ),
              )}
            </div>
            <div className="p-5">
              <h2 className="font-display text-3xl">{selected.title}</h2>
              <p className="mt-2 text-sm text-ink/70">{selected.description}</p>
              <button
                onClick={() => setSelected(null)}
                className="mt-4 rounded-full border border-ink px-5 py-2 text-xs uppercase tracking-[0.14em]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
