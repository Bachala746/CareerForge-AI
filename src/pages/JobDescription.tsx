import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FileSearch, Building2, Briefcase, CheckCircle, X, TrendingUp, Zap, AlertCircle, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { jdApi } from '../api/resume'

function MatchMeter({ score }: { score: number }) {
  const color = score >= 75 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444'
  const label = score >= 75 ? 'Strong Match' : score >= 50 ? 'Moderate Match' : 'Low Match'
  return (
    <div className="text-center">
      <div className="relative w-28 h-28 mx-auto mb-2">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border)" strokeWidth="10" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${(score / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black" style={{ color }}>{Math.round(score)}%</span>
        </div>
      </div>
      <p className="text-sm font-semibold" style={{ color }}>{label}</p>
    </div>
  )
}

export default function JobDescription() {
  const navigate = useNavigate()
  const [jdText, setJdText] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!jdText.trim() || jdText.length < 50) { setError('Please paste a complete job description (min 50 characters)'); return }
    setError('')
    setAnalyzing(true)
    try {
      const data = await jdApi.analyze({ jd_text: jdText, company, role_title: role })
      setResult(data)
      toast.success(`Match score: ${Math.round(data.match_score)}% 🎯`)
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Make sure backend is running.')
    } finally { setAnalyzing(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Job Description Analysis</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">Paste any JD to see how well your resume matches and what topics to study</p>
      </div>

      {/* Input Form */}
      <div className="card p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Company (optional)</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Google, Amazon..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Role Title (optional)</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input value={role} onChange={e => setRole(e.target.value)} placeholder="Software Engineer"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-[var(--color-text-muted)] mb-1">Job Description <span className="text-red-400">*</span></label>
          <textarea value={jdText} onChange={e => setJdText(e.target.value)} rows={10}
            placeholder="Paste the full job description here...&#10;&#10;We are looking for a talented Software Engineer to join our team. The ideal candidate should have experience with Python, React, SQL..."
            className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-sm resize-none placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{jdText.length} characters</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <button onClick={handleAnalyze} disabled={analyzing || !jdText.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {analyzing ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
          ) : <><FileSearch className="w-4 h-4" /> Analyze JD</>}
        </button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Match Score */}
            <div className="card p-6 flex flex-col sm:flex-row items-center gap-6">
              <MatchMeter score={result.match_score} />
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">Difficulty Prediction</p>
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                    result.difficulty === 'Hard' ? 'bg-red-500/10 text-red-400' :
                    result.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'
                  }`}>{result.difficulty}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">Focus Areas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.focus_areas?.map((f: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Required vs Missing Skills */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" /> You Have
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.your_skills?.slice(0, 12).map((s: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{s}</span>
                  ))}
                  {(!result.your_skills || result.your_skills.length === 0) && (
                    <p className="text-xs text-[var(--color-text-muted)]">Upload your resume first to see matches.</p>
                  )}
                </div>
              </div>
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500" /> Need to Learn
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.missing_skills?.map((s: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{s}</span>
                  ))}
                  {(!result.missing_skills || result.missing_skills.length === 0) && (
                    <p className="text-xs text-green-400">Great match! No critical skills missing.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/interview-setup')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all">
                <Zap className="w-4 h-4" /> Practice for This Role
              </button>
              <button onClick={() => navigate('/roadmap')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all">
                <TrendingUp className="w-4 h-4" /> Study Missing Skills
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
