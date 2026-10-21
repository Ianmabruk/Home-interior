import { useEffect, useState } from 'react'
import { motion } from '@components/common/DynamicMotion'
import { BarChart3, Eye, MousePointerClick, Globe, Clock3 } from 'lucide-react'
import { api } from '../../services/api'

const StatCard = ({ title, value, detail, icon: Icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-[var(--border)] bg-white/80 p-5 shadow-[0_10px_40px_rgba(42,36,31,0.05)]"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]/50">{title}</p>
        <p className="mt-3 font-display text-3xl text-[var(--primary)]">{value}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
        {Icon && <Icon size={22} />}
      </div>
    </div>
    {detail && <p className="mt-3 text-xs text-[var(--primary)]/50">{detail}</p>}
  </motion.div>
)

export const InsightsDashboard = () => {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadInsights = async () => {
      try {
        const res = await api.get('/admin/insights')
        if (active) setInsights(res.data || null)
      } catch {
        if (active) setInsights(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadInsights()
    return () => { active = false }
  }, [])

  if (loading) {
    return <div className="text-sm text-[var(--primary)]/50">Loading website insights…</div>
  }

  const data = insights || {
    totalVisits: 0,
    todayVisits: 0,
    weekVisits: 0,
    topPages: [],
    recentVisits: [],
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-[var(--primary)]">Website Insights</h1>
        <p className="mt-2 text-sm text-[var(--primary)]/50">Real visits captured from the storefront, grouped by page and recency.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total visits" value={data.totalVisits} detail="All tracked visits" icon={Eye} />
        <StatCard title="Today" value={data.todayVisits} detail="Visits in the last 24 hours" icon={Clock3} />
        <StatCard title="This week" value={data.weekVisits} detail="Last 7 days" icon={BarChart3} />
        <StatCard title="Top page" value={data.topPages?.[0]?.visits ?? 0} detail={data.topPages?.[0]?.path || '/'} icon={MousePointerClick} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-5 shadow-[0_10px_40px_rgba(42,36,31,0.05)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <Globe size={20} />
            </div>
            <h2 className="font-display text-2xl text-[var(--primary)]">Top pages</h2>
          </div>

          <div className="space-y-3">
            {data.topPages.length === 0 ? (
              <p className="text-sm text-[var(--primary)]/50">No visits recorded yet.</p>
            ) : (
              data.topPages.map((page, index) => (
                <div key={`${page.path}-${index}`} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--secondary)]/20 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-[var(--primary)]">{page.path}</p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--primary)]/45">Page route</p>
                  </div>
                  <span className="font-display text-xl text-[var(--primary)]">{page.visits}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-5 shadow-[0_10px_40px_rgba(42,36,31,0.05)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <Clock3 size={20} />
            </div>
            <h2 className="font-display text-2xl text-[var(--primary)]">Recent visits</h2>
          </div>

          <div className="space-y-3">
            {data.recentVisits.length === 0 ? (
              <p className="text-sm text-[var(--primary)]/50">No recent activity yet.</p>
            ) : (
              data.recentVisits.map((visit, index) => (
                <div key={`${visit.path}-${visit.createdAt}-${index}`} className="rounded-xl border border-[var(--border)] bg-[var(--secondary)]/20 px-3 py-2">
                  <p className="text-sm font-medium text-[var(--primary)]">{visit.pageTitle}</p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--primary)]/45">
                    <span>{visit.path}</span>
                    <span>{new Date(visit.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InsightsDashboard
