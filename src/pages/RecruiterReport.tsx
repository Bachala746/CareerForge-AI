import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, TrendingUp, AlertTriangle, CheckCircle, Brain, Mic, Target, BookOpen, ArrowLeft, Download, RefreshCw, Camera, Eye, MonitorPlay } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { reportsApi } from '../api/api'
import toast from 'react-hot-toast'

interface CVSessionData {
  samplesCount: number
  faceVisiblePct: number
  lookingAwayPct: number
  avgFramingQuality: number
  observations: string[]
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 28, c = 2 * Math.PI * r
  const dash = (score / 100) * c
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${c}`} strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[var(--color-text-primary)]">
          {Math.round(score)}
        </span>
      </div>
      <span className="text-xs text-[var(--color-text-muted)] text-center">{label}</span>
    </div>
  )
}

function CVScoreBar({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  const color = value >= 75 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-400'
  const textColor = value >= 75 ? 'text-green-500' : value >= 50 ? 'text-yellow-500' : 'text-red-400'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
        </div>
        <span className={`text-sm font-bold ${textColor}`}>{value}/100</span>
      </div>
      <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`} />
      </div>
    </div>
  )
}

function DecisionBadge({ decision }: { decision: string }) {
  const config: Record<string, { color: string; bg: string; icon: string }> = {
    'Strong Hire': { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', icon: '🏆' },
    'Hire': { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', icon: '✅' },
    'Needs Improvement': { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: '📈' },
    'No Hire': { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: '❌' },
  }
  const c = config[decision] || config['Needs Improvement']
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${c.color} ${c.bg}`}>
      {c.icon} {decision}
    </span>
  )
}

export default function RecruiterReport() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [cvData, setCvData] = useState<CVSessionData | null>(null)


  // Load CV analysis data from localStorage (stored during video interview)
  useEffect(() => {
    if (!sessionId) return
    try {
      const raw = localStorage.getItem(`cv-session-${sessionId}`)
      if (raw) setCvData(JSON.parse(raw))
    } catch {}
  }, [sessionId])

  useEffect(() => {

    const load = async () => {
      if (!sessionId) { navigate('/history'); return }
      try {
        const data = await reportsApi.getBySession(Number(sessionId))
        setReport(data)
      } catch {
        toast.error('Report not found. Generating now...')
        try {
          setGenerating(true)
          const data = await reportsApi.generate(Number(sessionId))
          setReport(data)
        } catch (e: any) {
          toast.error(e.message || 'Could not load report')
          navigate('/history')
        } finally { setGenerating(false) }
      } finally { setLoading(false) }
    }
    load()
  }, [sessionId])

  if (loading || generating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[var(--color-text-muted)] text-sm">{generating ? 'Generating your AI report...' : 'Loading report...'}</p>
      </div>
    )
  }

  if (!report) return null

  const radarData = [
    { skill: 'Technical', value: report.technical_score },
    { skill: 'Communication', value: report.communication_score },
    { skill: 'Confidence', value: report.confidence_score },
    { skill: 'Problem Solving', value: report.problem_solving_score },
    { skill: 'Projects', value: report.projects_score },
    { skill: 'Behavior', value: report.behavioral_score },
  ]

  const stars = Math.round(report.star_rating)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/history')} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to History
      </button>

      {/* Header Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Recruiter Report</h1>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">
              Generated {new Date(report.generated_at).toLocaleDateString('en-US', { dateStyle: 'long' })}
            </p>
          </div>
          <DecisionBadge decision={report.hiring_decision} />
        </div>

        {/* Overall Score + Stars */}
        <div className="flex items-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
              {Math.round(report.overall_score)}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">Overall Score</div>
          </div>
          <div>
            <div className="flex gap-1 mb-1">
              {Array(5).fill(0).map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--color-border)]'}`} />
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{report.star_rating}/5 rating</p>
          </div>
        </div>

        {/* Dimension Scores */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          <ScoreRing score={report.technical_score} label="Technical" color="#3B82F6" />
          <ScoreRing score={report.communication_score} label="Communication" color="#06B6D4" />
          <ScoreRing score={report.confidence_score} label="Confidence" color="#8B5CF6" />
          <ScoreRing score={report.problem_solving_score} label="Problem Solving" color="#F59E0B" />
          <ScoreRing score={report.projects_score} label="Projects" color="#10B981" />
          <ScoreRing score={report.behavioral_score} label="Behavioral" color="#EC4899" />
        </div>
      </motion.div>

      {/* Recruiter Note */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-blue-500" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">Recruiter's Note</h2>
        </div>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed italic">"{report.recruiter_note}"</p>
      </motion.div>

      {/* Executive Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-cyan-500" />
          <h2 className="font-semibold text-[var(--color-text-primary)]">For You — Executive Summary</h2>
        </div>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">{report.executive_summary}</p>
      </motion.div>

      {/* Strengths & Weaknesses */}
      <div className="grid sm:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <h2 className="font-semibold text-[var(--color-text-primary)]">Strengths</h2>
          </div>
          <ul className="space-y-2">
            {report.strengths?.length > 0 ? report.strengths.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                <span className="text-green-500 mt-0.5">✓</span> {s}
              </li>
            )) : <li className="text-sm text-[var(--color-text-muted)]">Complete more questions for detailed feedback.</li>}
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-[var(--color-text-primary)]">Areas to Improve</h2>
          </div>
          <ul className="space-y-2">
            {report.weaknesses?.length > 0 ? report.weaknesses.map((w: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                <span className="text-orange-500 mt-0.5">→</span> {w}
              </li>
            )) : <li className="text-sm text-[var(--color-text-muted)]">No specific weaknesses detected.</li>}
          </ul>
        </motion.div>
      </div>

      {/* Skill Radar + Recommendations */}
      <div className="grid sm:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Skill Radar</h2>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
              <Radar name="Score" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-purple-500" />
            <h2 className="font-semibold text-[var(--color-text-primary)]">Recommendations</h2>
          </div>
          <ul className="space-y-2">
            {report.recommendations?.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                <span className="text-purple-500 mt-0.5 text-xs font-bold">{i + 1}.</span> {r}
              </li>
            ))}
          </ul>
          {report.suggested_topics?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">Study Topics</p>
              <div className="flex flex-wrap gap-2">
                {report.suggested_topics.map((t: string, i: number) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400">{t}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Video Interview Analysis — only shows if video mode was used */}
      {cvData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <MonitorPlay className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--color-text-primary)]">Video Interview Analysis</h2>
              <p className="text-[10px] text-[var(--color-text-muted)]">Based on {cvData.samplesCount} visual sample{cvData.samplesCount !== 1 ? 's' : ''} — observable signals only</p>
            </div>
          </div>

          {/* Score bars */}
          <div className="space-y-3 mb-5">
            <CVScoreBar
              label="Camera Presence"
              value={cvData.faceVisiblePct}
              icon={Camera}
            />
            <CVScoreBar
              label="Visual Engagement (eye contact)"
              value={Math.max(0, 100 - cvData.lookingAwayPct)}
              icon={Eye}
            />
            <CVScoreBar
              label="Camera Framing"
              value={cvData.avgFramingQuality}
              icon={MonitorPlay}
            />
          </div>

          {/* Observations — factual language */}
          {cvData.observations.length > 0 && (
            <div className="pt-4 border-t border-[var(--color-border)]">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Observations</p>
              <ul className="space-y-2">
                {cvData.observations.map((obs, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                    <span className="text-indigo-400 mt-0.5 flex-shrink-0">→</span>
                    {obs}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-4 italic">
                Visual analysis reflects observable signals only (face visibility, gaze direction, camera framing).
                It does not assess personality, honesty, or intelligence.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Actions */}

      <div className="flex flex-wrap gap-3 justify-center pb-4">
        <Link to="/roadmap">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all">
            <TrendingUp className="w-4 h-4" /> Generate Learning Roadmap
          </button>
        </Link>
        <Link to="/interview-setup">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all">
            <Mic className="w-4 h-4" /> Practice Again
          </button>
        </Link>
      </div>
    </div>
  )
}
