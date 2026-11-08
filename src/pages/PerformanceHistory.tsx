import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mic, BarChart3, Star, Clock, ChevronRight, Filter, Search } from 'lucide-react'
import { reportsApi } from '../api/api'

function DecisionPill({ decision }: { decision: string }) {
  const map: Record<string, string> = {
    'Strong Hire': 'bg-green-500/10 text-green-400',
    'Hire': 'bg-blue-500/10 text-blue-400',
    'Needs Improvement': 'bg-yellow-500/10 text-yellow-400',
    'No Hire': 'bg-red-500/10 text-red-400',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[decision] || map['Needs Improvement']}`}>{decision}</span>
}

export default function PerformanceHistory() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    reportsApi.getAll().then(setReports).catch(() => setReports([])).finally(() => setLoading(false))
  }, [])

  const filtered = reports.filter(r =>
    r.role?.toLowerCase().includes(search.toLowerCase()) ||
    r.company?.toLowerCase().includes(search.toLowerCase())
  )

  const avgScore = reports.length > 0 ? Math.round(reports.reduce((a, r) => a + r.overall_score, 0) / reports.length) : 0
  const best = reports.length > 0 ? Math.max(...reports.map(r => r.overall_score)) : 0
  const hires = reports.filter(r => r.hiring_decision === 'Hire' || r.hiring_decision === 'Strong Hire').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Performance History</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">All your interview sessions and recruiter reports</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Sessions', value: reports.length, color: 'text-blue-500' },
          { label: 'Average Score', value: `${avgScore}/100`, color: 'text-purple-500' },
          { label: 'Hire Decisions', value: hires, color: 'text-green-500' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by role or company..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((r, i) => (
            <motion.div key={r.report_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/report/${r.session_id}`}>
                <div className="card p-4 hover:border-blue-500/30 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Mic className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {r.role}{r.company ? ` @ ${r.company}` : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <DecisionPill decision={r.hiring_decision} />
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {new Date(r.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-xl font-bold ${r.overall_score >= 75 ? 'text-green-500' : r.overall_score >= 55 ? 'text-yellow-500' : 'text-red-400'}`}>
                          {Math.round(r.overall_score)}
                        </p>
                        <div className="flex gap-0.5 mt-0.5 justify-end">
                          {Array(5).fill(0).map((_, j) => (
                            <Star key={j} className={`w-3 h-3 ${j < Math.round(r.star_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--color-border)]'}`} />
                          ))}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20 text-[var(--color-text-muted)]" />
          <p className="text-[var(--color-text-muted)]">
            {search ? 'No results found' : "No interviews yet. Start your first session to see your history here!"}
          </p>
          {!search && (
            <Link to="/interview-setup">
              <button className="mt-4 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                Start Interview
              </button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
