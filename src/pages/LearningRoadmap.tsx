import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, CheckCircle, Lock, ChevronDown, ChevronUp, Calendar, Clock, Zap, RefreshCw } from 'lucide-react'
import { reportsApi, aiApi } from '../api/api'
import toast from 'react-hot-toast'

function WeekCard({ week, index, isUnlocked }: { week: any; index: number; isUnlocked: boolean }) {
  const [open, setOpen] = useState(index === 0)
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
      className={`card overflow-hidden ${!isUnlocked ? 'opacity-60' : ''}`}>
      <button onClick={() => isUnlocked && setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
            isUnlocked ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'
          }`}>
            {isUnlocked ? `W${week.week}` : <Lock className="w-4 h-4" />}
          </div>
          <div>
            <p className="font-semibold text-[var(--color-text-primary)] text-sm">{week.title}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{week.focus} • {week.daily_hours}h/day</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            <Clock className="w-3 h-3" /> {week.daily_hours * 7}h total
          </div>
          {isUnlocked && (open ? <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />)}
        </div>
      </button>

      <AnimatePresence>
        {open && isUnlocked && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-4 border-t border-[var(--color-border)] pt-4">
              {/* Topics */}
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">📚 Topics</p>
                <div className="flex flex-wrap gap-2">
                  {week.topics?.map((t: string, i: number) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400">{t}</span>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">🔗 Resources</p>
                <ul className="space-y-1">
                  {week.resources?.map((r: string, i: number) => (
                    <li key={i} className="text-xs text-[var(--color-text-secondary)] flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">✓</span> {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mini Project */}
              {week.mini_project && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs font-semibold text-purple-400 mb-1">🚀 Mini Project</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{week.mini_project}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function LearningRoadmap() {
  const navigate = useNavigate()
  const [roadmap, setRoadmap] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    reportsApi.getLatestRoadmap().then(setRoadmap).catch(() => setRoadmap(null)).finally(() => setLoading(false))
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const result = await aiApi.generateRoadmap()
      setRoadmap(result)
      toast.success('Personalized roadmap generated! 🗺️')
    } catch (err: any) {
      toast.error(err.message || 'Complete an interview first to generate a roadmap.')
    } finally { setGenerating(false) }
  }

  if (loading) {
    return <div className="space-y-4">{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
  }

  const weeks = roadmap?.weeks || []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Learning Roadmap</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            {roadmap ? `6-week personalized study plan • Generated ${new Date(roadmap.generated_at).toLocaleDateString()}` : 'Complete an interview to get your personalized roadmap'}
          </p>
        </div>
        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all disabled:opacity-60">
          {generating ? <><div className="w-3 h-3 border border-blue-500/20 border-t-blue-500 rounded-full animate-spin" /> Generating...</> : <><RefreshCw className="w-3 h-3" /> Regenerate</>}
        </button>
      </div>

      {/* Focus Skills */}
      {roadmap?.focus_skills?.length > 0 && (
        <div className="card p-4">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">🎯 Focus Areas</p>
          <div className="flex flex-wrap gap-2">
            {roadmap.focus_skills.map((s: string, i: number) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">{s}</span>
            ))}
          </div>
        </div>
      )}

      {weeks.length > 0 ? (
        <div className="space-y-3">
          {weeks.map((week: any, i: number) => (
            <WeekCard key={week.week || i} week={week} index={i} isUnlocked={true} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20 text-[var(--color-text-muted)]" />
          <p className="font-semibold text-[var(--color-text-primary)]">No roadmap yet</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Complete an interview session first, then generate your personalized 6-week plan.</p>
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={() => navigate('/interview-setup')} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              Start Interview
            </button>
            <button onClick={handleGenerate} disabled={generating} className="px-5 py-2 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-60">
              {generating ? 'Generating...' : 'Generate Anyway'}
            </button>
          </div>
        </div>
      )}

      {weeks.length > 0 && (
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Estimated completion: 6 weeks</p>
            <p className="text-xs text-[var(--color-text-muted)]">~{weeks.reduce((a: number, w: any) => a + (w.daily_hours * 7), 0)}h total study time</p>
          </div>
          <div className="w-24 h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full" style={{ width: `${roadmap?.overall_progress || 0}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}
