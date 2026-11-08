import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, CheckCircle, AlertCircle, Brain, TrendingUp, X,
  FileSearch, Building2, Briefcase, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import { resumeApi, jdApi } from '../api/resume'

function SkillBadge({ skill, type }: { skill: string; type: 'found' | 'missing' | 'blue' }) {
  const styles: Record<string, string> = {
    found:   'bg-green-500/10 text-green-400 border border-green-500/20',
    missing: 'bg-red-500/10 text-red-400 border border-red-500/20',
    blue:    'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  }
  return <span className={'text-xs px-2.5 py-1 rounded-full font-medium ' + styles[type]}>{skill}</span>
}

function ScoreDial({ score, size = 80 }: { score: number; size?: number }) {
  const r = size * 0.4
  const circ = 2 * Math.PI * r
  const color = score >= 75 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444'
  const label = score >= 75 ? 'Strong' : score >= 50 ? 'Fair' : 'Needs Work'
  const dash = (score / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={size * 0.1} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={size * 0.1}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black leading-none" style={{ fontSize: size * 0.22, color }}>{Math.round(score)}</span>
          <span className="text-[9px] text-[var(--color-text-muted)] leading-none mt-0.5">ATS</span>
        </div>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

function MatchDial({ score }: { score: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const color = score >= 75 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444'
  const label = score >= 75 ? 'Strong Match' : score >= 50 ? 'Moderate Match' : 'Low Match'
  const dash = (score / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-border)" strokeWidth="10" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black" style={{ color }}>{Math.round(score)}%</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

export default function ResumeAndJD() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'resume' | 'jd'>('resume')

  const [file, setFile]           = useState<File | null>(null)
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [resumeResult, setResumeResult] = useState<any>(null)
  const [resumeError,  setResumeError]  = useState('')

  const [jdText,    setJdText]    = useState('')
  const [company,   setCompany]   = useState('')
  const [role,      setRole]      = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [jdResult,  setJdResult]  = useState<any>(null)
  const [jdError,   setJdError]   = useState('')

  const handleFile = (f: File) => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!['.pdf', '.docx', '.txt'].includes(ext)) { toast.error('Only PDF, DOCX, or TXT allowed'); return }
    if (f.size > 10 * 1024 * 1024) { toast.error('File too large (max 10 MB)'); return }
    setFile(f); setResumeResult(null); setResumeError('')
  }
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]; if (f) handleFile(f)
  }, [])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true); setResumeError('')
    try {
      const result = await resumeApi.upload(file)
      setResumeResult(result)
      toast.success('Resume analyzed! ATS Score: ' + Math.round(result.ats_score) + '% \ud83c\udfaf')
    } catch (err: any) {
      setResumeError(err.message || 'Upload failed. Make sure the backend is running.')
    } finally { setUploading(false) }
  }

  const handleAnalyze = async () => {
    if (!jdText.trim() || jdText.length < 50) { setJdError('Please paste a complete job description (min 50 characters)'); return }
    setJdError(''); setAnalyzing(true)
    try {
      const data = await jdApi.analyze({ jd_text: jdText, company, role_title: role })
      setJdResult(data)
      toast.success('Match score: ' + Math.round(data.match_score) + '% \ud83c\udfaf')
    } catch (err: any) {
      setJdError(err.message || 'Analysis failed. Make sure backend is running.')
    } finally { setAnalyzing(false) }
  }

  const tabBase = 'px-5 py-2 rounded-lg text-sm font-semibold transition-all'
  const tabActive = tabBase + ' bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
  const tabInactive = tabBase + ' text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'

  const dropBase = 'card p-10 text-center border-2 border-dashed transition-all cursor-pointer'
  const dropClass = dropBase + (dragging ? ' border-blue-500 bg-blue-500/5' : ' border-[var(--color-border)] hover:border-blue-500/40')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Resume &amp; Job Analysis</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">Upload your resume and match it against any job description &mdash; all in one place</p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-2)] w-fit">
        {(['resume', 'jd'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? tabActive : tabInactive}>
            {t === 'resume' ? '\ud83d\udcc4 Resume Analysis' : '\ud83d\udd0d JD Match'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'resume' && (
          <motion.div key="resume" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
            <div onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
              onClick={() => document.getElementById('resume-file-input')?.click()}
              className={dropClass}>
              <input id="resume-file-input" type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div key="file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3"><FileText className="w-8 h-8 text-blue-500" /></div>
                    <p className="font-semibold text-[var(--color-text-primary)]">{file.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    <button onClick={e => { e.stopPropagation(); setFile(null); setResumeResult(null) }} className="mt-3 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mx-auto">
                      <X className="w-3 h-3" /> Remove
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mx-auto mb-3"><Upload className="w-8 h-8 text-[var(--color-text-muted)]" /></div>
                    <p className="font-semibold text-[var(--color-text-primary)]">Drop your resume here</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">or click to browse &middot; PDF, DOCX, TXT &middot; max 10 MB</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {resumeError && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {resumeError}
              </div>
            )}

            {file && !resumeResult && (
              <button onClick={handleUpload} disabled={uploading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {uploading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing with AI...</> : <><Brain className="w-5 h-5" /> Analyze Resume</>}
              </button>
            )}

            <AnimatePresence>
              {resumeResult && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="card p-6 flex items-center gap-6">
                    <ScoreDial score={resumeResult.ats_score} size={96} />
                    <div className="flex-1">
                      <p className="text-base font-bold text-[var(--color-text-primary)]">Resume ATS Score</p>
                      <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-3">{resumeResult.summary}</p>
                      <div className="flex gap-3 mt-4 flex-wrap">
                        <button onClick={() => navigate('/interview-setup')} className="text-xs px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5">
                          <Zap className="w-3 h-3" /> Start Interview
                        </button>
                        <button onClick={() => setTab('jd')} className="text-xs px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors flex items-center gap-1.5">
                          <FileSearch className="w-3 h-3" /> Match a JD &rarr;
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="card p-5">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" /> Skills Detected ({resumeResult.skills?.length ?? 0})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {resumeResult.skills?.length > 0 ? resumeResult.skills.map((s: string) => <SkillBadge key={s} skill={s} type="found" />) :
                        <p className="text-sm text-[var(--color-text-muted)]">No skills extracted. Try uploading a text-readable PDF.</p>}
                    </div>
                  </div>

                  {resumeResult.missing_skills?.length > 0 && (
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-500" /> Recommended Skills to Add ({resumeResult.missing_skills.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {resumeResult.missing_skills.map((s: string) => <SkillBadge key={s} skill={s} type="missing" />)}
                      </div>
                    </div>
                  )}

                  {resumeResult.experience?.length > 0 && (
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Work Experience</h3>
                      <div className="space-y-2">
                        {resumeResult.experience.map((e: any, i: number) => (
                          <div key={i} className="p-3 rounded-xl bg-[var(--color-surface-2)]">
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{e.role} @ {e.company}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{e.duration}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resumeResult.education?.length > 0 && (
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Education</h3>
                      <div className="space-y-2">
                        {resumeResult.education.map((e: any, i: number) => (
                          <div key={i} className="p-3 rounded-xl bg-[var(--color-surface-2)]">
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{e.degree}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{e.institution}{e.year ? ' \u00b7 ' + e.year : ''}{e.gpa ? ' \u00b7 GPA ' + e.gpa : ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resumeResult.projects?.length > 0 && (
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Projects</h3>
                      <div className="space-y-2">
                        {resumeResult.projects.map((p: any, i: number) => (
                          <div key={i} className="p-3 rounded-xl bg-[var(--color-surface-2)]">
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{p.name}</p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{p.description}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">{p.tech?.map((t: string) => <SkillBadge key={t} skill={t} type="blue" />)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {tab === 'jd' && (
          <motion.div key="jd" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            {!resumeResult && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Resume not uploaded yet</p>
                  <p className="text-xs mt-0.5 text-yellow-400/70">You can still analyze a JD, but skill matching requires your resume.{' '}
                    <button className="underline" onClick={() => setTab('resume')}>Upload now &rarr;</button></p>
                </div>
              </div>
            )}

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
                  placeholder="Paste the full job description here..."
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-sm resize-none placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{jdText.length} characters</p>
              </div>
              {jdError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {jdError}
                </div>
              )}
              <button onClick={handleAnalyze} disabled={analyzing || !jdText.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {analyzing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</> : <><FileSearch className="w-4 h-4" /> Analyze JD</>}
              </button>
            </div>

            <AnimatePresence>
              {jdResult && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="card p-6 flex flex-col sm:flex-row items-center gap-6">
                    <MatchDial score={jdResult.match_score} />
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">Difficulty Prediction</p>
                        <span className="text-sm font-bold px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400">{jdResult.difficulty}</span>
                      </div>
                      {jdResult.focus_areas?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">Focus Areas</p>
                          <div className="flex flex-wrap gap-1.5">
                            {jdResult.focus_areas.map((f: string, i: number) => <span key={i} className="text-xs px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400">{f}</span>)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> You Have</h3>
                      <div className="flex flex-wrap gap-2">
                        {jdResult.your_skills?.length > 0 ? jdResult.your_skills.map((s: string, i: number) => <SkillBadge key={i} skill={s} type="found" />) :
                          <p className="text-xs text-[var(--color-text-muted)]">Upload your resume first to see matches.</p>}
                      </div>
                    </div>
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2"><X className="w-4 h-4 text-red-500" /> Need to Learn</h3>
                      <div className="flex flex-wrap gap-2">
                        {jdResult.missing_skills?.length > 0 ? jdResult.missing_skills.map((s: string, i: number) => <SkillBadge key={i} skill={s} type="missing" />) :
                          <p className="text-xs text-green-400">Great match! No critical skills missing.</p>}
                      </div>
                    </div>
                  </div>

                  {jdResult.preparation_tips && (
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">\ud83d\udca1 Preparation Tips</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">{jdResult.preparation_tips}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => navigate('/interview-setup')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all">
                      <Zap className="w-4 h-4" /> Practice for This Role
                    </button>
                    <button onClick={() => navigate('/roadmap')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all">
                      <TrendingUp className="w-4 h-4" /> Study Missing Skills
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
