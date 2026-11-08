import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Mic, FileText, BarChart3, TrendingUp, Award, Play, ArrowRight, Zap, Clock, Target, Star, ChevronRight } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { dashboardApi } from '../api/api'
import { resumeApi } from '../api/resume'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

function StatCard({ label, value, sub, color, icon: Icon }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
      <div className={`w-10 h-10 rounded-xl ${color} bg-opacity-10 flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
      <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{label}</p>
      {sub && <p className="text-xs text-green-500 mt-1">{sub}</p>}
    </motion.div>
  )
}

function SkeletonCard() {
  return <div className="card p-5 space-y-3"><div className="skeleton h-10 w-10 rounded-xl" /><div className="skeleton h-7 w-16" /><div className="skeleton h-3 w-24" /></div>
}

// ── Your Next Step card ───────────────────────────────────────────────────────
interface NextStepProps { stats: any; resume: any; resumeLoading: boolean }

const STEPS = [
  {
    key: 'resume',
    icon: FileText,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    gradient: 'from-blue-500 to-indigo-600',
    border: 'border-blue-500/15',
    cardBg: 'bg-blue-500/5',
    title: 'Upload Your Resume',
    desc: 'Upload your resume to begin your personalized InterviewOS journey.',
    btn: 'Upload Resume',
    path: '/resume-jd',
  },
  {
    key: 'analyze',
    icon: Target,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    gradient: 'from-violet-500 to-purple-600',
    border: 'border-violet-500/15',
    cardBg: 'bg-violet-500/5',
    title: 'Analyze Your Resume',
    desc: 'Analyze your resume to understand your skills and strengths.',
    btn: 'Analyze Resume',
    path: '/resume-jd',
  },
  {
    key: 'jd',
    icon: Zap,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    gradient: 'from-orange-500 to-amber-600',
    border: 'border-orange-500/15',
    cardBg: 'bg-orange-500/5',
    title: 'Add Your Target Job',
    desc: 'Add a Job Description to compare your skills with the role requirements.',
    btn: 'Add Job Description',
    path: '/resume-jd',
  },
  {
    key: 'interview',
    icon: Mic,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    gradient: 'from-emerald-500 to-green-600',
    border: 'border-emerald-500/15',
    cardBg: 'bg-emerald-500/5',
    title: 'Start Your AI Interview',
    desc: 'Practice with an interview personalized to your resume and target role.',
    btn: 'Start Interview',
    path: '/interview-setup',
  },
  {
    key: 'skillgap',
    icon: BarChart3,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    gradient: 'from-pink-500 to-rose-600',
    border: 'border-pink-500/15',
    cardBg: 'bg-pink-500/5',
    title: 'Review Your Skill Gap',
    desc: 'See which skills you need to improve for your target role.',
    btn: 'View Skill Gap',
    path: '/skill-gap',
  },
  {
    key: 'progress',
    icon: TrendingUp,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    gradient: 'from-cyan-500 to-blue-600',
    border: 'border-cyan-500/15',
    cardBg: 'bg-cyan-500/5',
    title: 'Check Your Progress',
    desc: 'Compare your previous interviews and see how your performance is improving.',
    btn: 'View Progress',
    path: '/history',
  },
  {
    key: 'roadmap',
    icon: Star,
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
    gradient: 'from-teal-500 to-emerald-600',
    border: 'border-teal-500/15',
    cardBg: 'bg-teal-500/5',
    title: 'Continue Your Learning',
    desc: 'Work on your identified skill gaps and prepare for your next interview.',
    btn: 'View Learning Roadmap',
    path: '/roadmap',
  },
]

const STAGE_LABELS = ['Resume', 'Analysis', 'Job Match', 'Interview', 'Skill Gap', 'Roadmap']

function NextStep({ stats, resume, resumeLoading }: NextStepProps) {
  const navigate = useNavigate()

  const hasResume         = !!resume
  const resumeAnalyzed    = hasResume && (resume.ats_score != null || resume.analysis_summary != null)
  const hasJD             = hasResume && resume.jd_id != null
  const interviewsDone    = stats?.total_interviews ?? 0
  const hasSkillGap       = (stats?.readiness_score ?? 0) > 0 && interviewsDone > 0
  const multipleIntervs   = interviewsDone >= 2

  // Which stage is complete: [resume, analysis, jd, interview, skillgap, roadmap]
  const stages = [hasResume, resumeAnalyzed, hasJD, interviewsDone > 0, hasSkillGap, multipleIntervs]
  const completedCount = stages.filter(Boolean).length

  const step = (() => {
    if (!hasResume)           return STEPS[0]
    if (!resumeAnalyzed)      return STEPS[1]
    if (!hasJD)               return STEPS[2]
    if (interviewsDone === 0) return STEPS[3]
    if (!hasSkillGap)         return STEPS[4]
    if (multipleIntervs)      return STEPS[5]
    return STEPS[6]
  })()

  if (resumeLoading) {
    return (
      <div className="card p-5 space-y-3">
        <div className="skeleton h-3 w-24 rounded-lg" />
        <div className="skeleton h-5 w-48 rounded-lg" />
        <div className="skeleton h-3 w-64 rounded-lg" />
        <div className="skeleton h-9 w-36 rounded-xl mt-2" />
      </div>
    )
  }

  const StepIcon = step.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`card p-5 border ${step.border} ${step.cardBg}`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Icon + text */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-sm`}>
            <StepIcon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-0.5">
              Your Next Step
            </p>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">{step.title}</h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{step.desc}</p>
          </div>
        </div>
        {/* CTA */}
        <button
          onClick={() => navigate(step.path)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r ${step.gradient} text-white text-xs font-semibold hover:opacity-90 hover:shadow-md transition-all`}
        >
          {step.btn}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Journey progress bar */}
      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-[var(--color-border-subtle)]">
        {STAGE_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`h-1.5 rounded-full transition-all duration-500 ${stages[i] ? `bg-gradient-to-r ${step.gradient} w-6` : 'bg-[var(--color-border)] w-4'}`} />
            <span className={`text-[9px] font-medium hidden sm:block ${stages[i] ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)]'}`}>
              {label}
            </span>
          </div>
        ))}
        <span className="ml-auto text-[10px] text-[var(--color-text-muted)] flex-shrink-0">
          {completedCount}/{STAGE_LABELS.length} done
        </span>
      </div>
    </motion.div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {

  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [weekly, setWeekly] = useState<any[]>([])
  const [recent, setRecent] = useState<any[]>([])
  const [radar, setRadar] = useState<any[]>([])
  const [resume, setResume] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resumeLoading, setResumeLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, w, r, rd] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getWeeklyProgress(),
          dashboardApi.getRecentInterviews(),
          dashboardApi.getSkillRadar(),
        ])
        setStats(s); setWeekly(w); setRecent(r); setRadar(rd)
      } catch {
        // Use demo data if backend not connected
        setStats({ total_interviews: 0, streak_days: 0, readiness_score: 0, technical_score: 0, communication_score: 0, confidence_score: 0, best_score: 0 })
        setWeekly([])
        setRecent([])
        setRadar([
          { skill: 'Technical', value: 0 }, { skill: 'Communication', value: 0 },
          { skill: 'Confidence', value: 0 }, { skill: 'Problem Solving', value: 0 },
          { skill: 'Projects', value: 0 }, { skill: 'Behavior', value: 0 },
        ])
      } finally { setLoading(false) }
    }
    load()
  }, [])

  // Load resume separately for NextStep logic (lightweight, non-blocking)
  useEffect(() => {
    resumeApi.getLatest()
      .then(r => setResume(r))
      .catch(() => setResume(null))   // null = no resume yet (new user)
      .finally(() => setResumeLoading(false))
  }, [])

  const firstName = user?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {firstName}! 👋
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            {stats?.total_interviews === 0 ? "Let's start your first interview session today." : `You've completed ${stats?.total_interviews} interviews. Keep going!`}
          </p>
        </div>
        <button onClick={() => navigate('/interview-setup')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all">
          <Play className="w-4 h-4" /> Start Interview
        </button>
      </div>

      {/* Stats */}
      <NextStep stats={stats} resume={resume} resumeLoading={resumeLoading} />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) : (<>
          <StatCard label="Interviews Done" value={stats?.total_interviews ?? 0} icon={Mic} color="bg-blue-500" sub={stats?.total_interviews > 0 ? '↑ Great progress!' : 'Start your first!'} />
          <StatCard label="Day Streak" value={`${stats?.streak_days ?? 0}d`} icon={Zap} color="bg-orange-500" />
          <StatCard label="Readiness Score" value={`${stats?.readiness_score ?? 0}%`} icon={Target} color="bg-green-500" sub={stats?.readiness_score >= 70 ? '✓ Interview Ready!' : ''} />
          <StatCard label="Best Score" value={`${stats?.best_score ?? 0}`} icon={Star} color="bg-purple-500" />
        </>)}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Progress Chart */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Weekly Performance</h2>
          {loading ? <div className="skeleton h-48 rounded-xl" /> : weekly.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12 }} />
                <Line type="monotone" dataKey="technical" stroke="#3B82F6" strokeWidth={2} dot={false} name="Technical" />
                <Line type="monotone" dataKey="communication" stroke="#06B6D4" strokeWidth={2} dot={false} name="Communication" />
                <Line type="monotone" dataKey="confidence" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Confidence" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
              <BarChart3 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Complete interviews to see your progress chart</p>
              <button onClick={() => navigate('/interview-setup')} className="mt-3 text-xs text-blue-500 hover:underline">Start first interview →</button>
            </div>
          )}
        </div>

        {/* Radar Chart */}
        <div className="card p-6">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Skill Radar</h2>
          {loading ? <div className="skeleton h-48 rounded-xl" /> : radar.some(r => r.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radar}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                <Radar name="Score" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
              <Brain className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm text-center">Skill data appears after your first interview</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: FileText, label: 'Upload Resume', desc: 'Get ATS score + skill gaps', path: '/resume', color: 'from-blue-500 to-blue-600' },
            { icon: Mic, label: 'Mock Interview', desc: 'Practice with AI recruiter', path: '/interview-setup', color: 'from-purple-500 to-violet-600' },
            { icon: BarChart3, label: 'View Reports', desc: 'Recruiter feedback & scores', path: '/history', color: 'from-orange-500 to-amber-600' },
            { icon: TrendingUp, label: 'Learning Roadmap', desc: 'Personalized study plan', path: '/roadmap', color: 'from-green-500 to-emerald-600' },
          ].map((a) => (
            <Link key={a.path} to={a.path}>
              <motion.div whileHover={{ scale: 1.02 }} className="card p-4 cursor-pointer h-full">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center mb-3`}>
                  <a.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{a.label}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{a.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Interviews */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--color-text-primary)]">Recent Interviews</h2>
          <Link to="/history" className="text-sm text-blue-500 hover:text-blue-400 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
        </div>
        {loading ? (
          <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : recent.length > 0 ? (
          <div className="space-y-3">
            {recent.map((s: any) => (
              <div key={s.session_id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{s.role} {s.company ? `@ ${s.company}` : ''}</p>
                    <p className="text-xs text-[var(--color-text-muted)] capitalize">{s.interview_type} • {new Date(s.started_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {s.overall_score != null && (
                    <span className={`text-sm font-bold ${s.overall_score >= 75 ? 'text-green-500' : s.overall_score >= 55 ? 'text-yellow-500' : 'text-red-400'}`}>
                      {s.overall_score}/100
                    </span>
                  )}
                  {s.report_id && (
                    <Link to={`/report/${s.session_id}`} className="text-xs text-blue-500 hover:underline">Report →</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--color-text-muted)]">
            <Mic className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No interviews yet. Start your first session!</p>
            <button onClick={() => navigate('/interview-setup')}
              className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              Start Interview
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
