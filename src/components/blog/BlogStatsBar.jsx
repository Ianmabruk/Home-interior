import { Clock, FileText, Eye, Image, Video } from 'lucide-react'

export const BlogStatsBar = ({ stats, loading }) => {
  const items = [
    { label: 'Total Posts', value: stats?.totalPosts ?? 0, icon: FileText, color: 'text-[var(--accent)]' },
    { label: 'Published', value: stats?.publishedPosts ?? 0, icon: Clock, color: 'text-green-600' },
    { label: 'Drafts', value: stats?.draftPosts ?? 0, icon: FileText, color: 'text-[var(--primary)]/50' },
    { label: 'Images', value: stats?.totalImages ?? 0, icon: Image, color: 'text-blue-600' },
    { label: 'Videos', value: stats?.totalVideos ?? 0, icon: Video, color: 'text-purple-600' },
    { label: 'Total Views', value: stats?.totalViews ?? 0, icon: Eye, color: 'text-[var(--accent)]' },
  ]

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="metric-card">
          <div className="mb-2 flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--secondary)]/20">
            <item.icon size={20} className={item.color} />
          </div>
          <div className="text-2xl font-bold text-[var(--primary)]">
            {loading ? '—' : item.value}
          </div>
          <div className="text-xs font-medium text-[var(--primary)]/50">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

export default BlogStatsBar
