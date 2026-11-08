import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mic, Brain, Briefcase, Clock, ChevronRight, Zap, AlertCircle, FileText, CheckCircle, Video } from 'lucide-react'
import toast from 'react-hot-toast'
import { interviewsApi } from '../api/interviews'
import { resumeApi } from '../api/resume'
import { useInterviewStore } from '../store/interviewStore'

const interviewTypes = [
  { id: 'mixed', label: 'Mixed', desc: 'HR + Technical + Behavioral', icon: Brain, color: 'from-blue-500 to-cyan-500' },
  { id: 'hr', label: 'HR Round', desc: 'Behavioral & culture fit', icon: Mic, color: 'from-purple-500 to-pink-500' },
  { id: 'technical', label: 'Technical', desc: 'Deep technical questions', icon: Zap, color: 'from-orange-500 to-amber-500' },
  { id: 'coding', label: 'Coding', desc: 'Algorithms & data structures', icon: Briefcase, color: 'from-green-500 to-emerald-500' },
]

const personalities = [
  { id: 'friendly', label: 'Friendly HR', desc: 'Warm and encouraging' },
  { id: 'strict', label: 'Strict Lead', desc: 'No hand-holding, deep technical' },
  { id: 'startup', label: 'Startup CTO', desc: 'Fast-paced, practical focus' },
  { id: 'corporate', label: 'Corporate', desc: 'Formal, process-oriented' },
]

const experienceLevels = [
  { id: 'fresher', label: 'Fresher', desc: '0-1 years' },
  { id: 'junior', label: 'Junior', desc: '1-3 years' },
  { id: 'mid', label: 'Mid-Level', desc: '3-6 years' },
  { id: 'senior', label: 'Senior', desc: '6+ years' },
]

export default function InterviewSetup() {
  const navigate = useNavigate()
  const setSession = useInterviewStore((s) => s.setSession)

  const [interviewMode, setInterviewMode] = useState<'audio' | 'audio_video'>('audio')
  const [form, setForm] = useState({
    company: '',
    role: 'Software Engineer',
    interview_type: 'mixed',
    personality: 'friendly',
    difficulty: 'adaptive',
    duration_minutes: 30,
    experience_level: 'junior',
    question_count: 8,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resumeInfo, setResumeInfo] = useState<any>(null)
  const [loadingResume, setLoadingResume] = useState(true)

  useEffect(() => {
    resumeApi.getLatest()
      .then(data => { if (data) setResumeInfo(data) })
      .catch(() => {})
      .finally(() => setLoadingResume(false))
  }, [])

  const update = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  const handleStart = async () => {
    if (!form.role.trim()) { setError('Please enter a job role'); return }
    setError('')
    setLoading(true)
    try {
      const session = await interviewsApi.setup({ ...form, interview_mode: interviewMode })
      setSession(session)
      const ctx = session.resume_loaded ? 'Personalized from your resume' : 'Generic questions (upload resume for personalization)'
      toast.success(`Interview started! ${ctx}`)
      navigate('/interview-room')
    } catch (err: any) {
      setError(err.message || 'Failed to start interview. Is the backend running?')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Set Up Your Interview</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">Configure your AI interviewer for a personalized experience</p>
      </div>

      {/* ── Mode Selection ── */}
      <div className="card p-6">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-1">Choose Your Interview Mode</h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Select how you want to practice</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Audio only */}
          <button onClick={() => setInterviewMode('audio')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${interviewMode === 'audio' ? 'border-blue-500 bg-blue-500/8' : 'border-[var(--color-border)] hover:border-blue-500/40'}`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">Audio Interview</p>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Microphone only · No camera required</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Voice input + AI evaluation</p>
              </div>
            </div>
            {interviewMode === 'audio' && (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-blue-400 font-semibold">
                <CheckCircle className="w-3 h-3" /> Selected
              </div>
            )}
          </button>

          {/* Audio + Video */}
          <button onClick={() => setInterviewMode('audio_video')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${interviewMode === 'audio_video' ? 'border-indigo-500 bg-indigo-500/8' : 'border-[var(--color-border)] hover:border-indigo-500/40'}`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">Video Interview</p>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Microphone + Camera · Realistic online experience</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">AI Interviewer + Visual analysis + Voice</p>
              </div>
            </div>
            {interviewMode === 'audio_video' && (
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-indigo-400 font-semibold">
                <CheckCircle className="w-3 h-3" /> Selected — camera will be requested
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Resume / JD context banner */}
      <div className={`card p-4 border-l-4 ${resumeInfo ? 'border-green-500' : 'border-yellow-500'}`}>
        <div className="flex items-start gap-3">
          {resumeInfo
            ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            : <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          }
          <div className="flex-1 min-w-0">
            {resumeInfo ? (
              <>
                <p className="text-sm font-semibold text-green-400">✓ Resume loaded — questions will be personalized</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
                  Using: <span className="text-[var(--color-text-secondary)]">{resumeInfo.filename}</span>
                  {resumeInfo.skills?.length > 0 && ` · ${resumeInfo.skills.length} skills detected`}
                  {(resumeInfo.resume_score || resumeInfo.ats_score) ? ` · Score: ${Math.round(resumeInfo.resume_score || resumeInfo.ats_score)}/100` : ''}
                </p>
              </>
            ) : loadingResume ? (
              <p className="text-sm text-[var(--color-text-muted)]">Checking for saved resume...</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-yellow-400">No resume found — generic questions will be used</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  <button onClick={() => navigate('/resume-jd')} className="underline text-blue-400 hover:text-blue-300">
                    Upload your resume
                  </button>{' '}for personalized questions based on your actual projects and skills
                </p>
              </>
            )}
          </div>
          <FileText className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Company & Role */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-[var(--color-text-primary)]">Target Position</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1.5">Company (optional)</label>
            <input value={form.company} onChange={e => update('company', e.target.value)} placeholder="e.g. Google, Amazon..."
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1.5">Job Role <span className="text-red-400">*</span></label>
            <input value={form.role} onChange={e => update('role', e.target.value)} placeholder="e.g. Software Engineer"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
          </div>
        </div>
      </div>

      {/* Interview Type */}
      <div className="card p-6">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Interview Type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {interviewTypes.map(t => (
            <button key={t.id} onClick={() => update('interview_type', t.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${form.interview_type === t.id ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--color-border)] hover:border-blue-500/40'}`}>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center mb-2`}>
                <t.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">{t.label}</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Interviewer Personality */}
      <div className="card p-6">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Interviewer Personality</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {personalities.map(p => (
            <button key={p.id} onClick={() => update('personality', p.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${form.personality === p.id ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--color-border)] hover:border-blue-500/40'}`}>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{p.label}</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Experience, Duration & Question Count */}
      <div className="card p-6">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Experience Level, Duration & Questions</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">Experience Level</p>
            <div className="grid grid-cols-2 gap-2">
              {experienceLevels.map(l => (
                <button key={l.id} onClick={() => update('experience_level', l.id)}
                  className={`p-2.5 rounded-xl border-2 text-left transition-all ${form.experience_level === l.id ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--color-border)] hover:border-blue-500/40'}`}>
                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">{l.label}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{l.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">Duration: <span className="text-blue-500 font-semibold">{form.duration_minutes} min</span></p>
            <input type="range" min={15} max={60} step={15} value={form.duration_minutes} onChange={e => update('duration_minutes', +e.target.value)}
              className="w-full accent-blue-500" />
            <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1">
              <span>15 min</span><span>30 min</span><span>45 min</span><span>60 min</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">Questions: <span className="text-blue-500 font-semibold">{form.question_count}</span></p>
            <input type="range" min={4} max={12} step={2} value={form.question_count} onChange={e => update('question_count', +e.target.value)}
              className="w-full accent-blue-500" />
            <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1">
              <span>4</span><span>6</span><span>8</span><span>10</span><span>12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error message — shown when setup fails */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-400">Unable to start interview</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-[var(--color-text-muted)] hover:text-red-400 transition-colors">
            ✕
          </button>
        </div>
      )}

      {/* Start Button */}
      <button onClick={handleStart} disabled={loading}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-base hover:shadow-xl hover:shadow-blue-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-3">
        {loading ? (
          <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating personalized questions...</>
        ) : (
          <><Mic className="w-5 h-5" /> Start Interview Session <ChevronRight className="w-5 h-5" /></>
        )}
      </button>
    </div>
  )
}
