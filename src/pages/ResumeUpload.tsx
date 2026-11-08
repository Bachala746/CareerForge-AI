import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle, AlertCircle, Zap, Brain, TrendingUp, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { resumeApi } from '../api/resume'

function SkillBadge({ skill, type }: { skill: string; type: 'found' | 'missing' }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
      type === 'found' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
    }`}>{skill}</span>
  )
}

export default function ResumeUpload() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFile = (f: File) => {
    const allowed = ['.pdf', '.docx', '.txt']
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!allowed.includes(ext)) { toast.error('Only PDF, DOCX, or TXT allowed'); return }
    if (f.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB)'); return }
    setFile(f)
    setAnalysis(null)
    setError('')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const result = await resumeApi.upload(file)
      setAnalysis(result)
      toast.success(`Resume analyzed! ATS Score: ${result.ats_score}% 🎯`)
    } catch (err: any) {
      setError(err.message || 'Upload failed. Make sure the backend is running.')
    } finally { setUploading(false) }
  }

  const atsColor = analysis?.ats_score >= 75 ? '#22C55E' : analysis?.ats_score >= 50 ? '#F59E0B' : '#EF4444'
  const atsLabel = analysis?.ats_score >= 75 ? 'Strong' : analysis?.ats_score >= 50 ? 'Fair' : 'Needs Work'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Resume Analysis</h1>
        <p className="text-[var(--color-text-muted)] text-sm mt-1">Upload your resume for AI-powered ATS scoring and skill analysis</p>
      </div>

      {/* Drop Zone */}
      <div onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
        className={`card p-10 text-center border-2 border-dashed transition-all cursor-pointer ${dragging ? 'border-blue-500 bg-blue-500/5' : 'border-[var(--color-border)] hover:border-blue-500/50'}`}
        onClick={() => document.getElementById('resume-file-input')?.click()}>
        <input id="resume-file-input" type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

        <AnimatePresence mode="wait">
          {file ? (
            <motion.div key="file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <p className="font-semibold text-[var(--color-text-primary)]">{file.name}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              <button onClick={e => { e.stopPropagation(); setFile(null); setAnalysis(null) }}
                className="mt-3 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mx-auto">
                <X className="w-3 h-3" /> Remove
              </button>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mx-auto mb-3">
                <Upload className="w-8 h-8 text-[var(--color-text-muted)]" />
              </div>
              <p className="font-semibold text-[var(--color-text-primary)]">Drop your resume here</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">or click to browse • PDF, DOCX, TXT up to 10MB</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {file && !analysis && (
        <button onClick={handleUpload} disabled={uploading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {uploading ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing with AI...</>
          ) : <><Brain className="w-5 h-5" /> Analyze Resume</>}
        </button>
      )}

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* ATS Score */}
            <div className="card p-6 flex items-center gap-6">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke={atsColor} strokeWidth="8"
                    strokeDasharray={`${(analysis.ats_score / 100) * 2 * Math.PI * 32} ${2 * Math.PI * 32}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black" style={{ color: atsColor }}>{Math.round(analysis.ats_score)}</span>
                  <span className="text-[9px] text-[var(--color-text-muted)]">ATS</span>
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">ATS Score: <span style={{ color: atsColor }}>{atsLabel}</span></p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{analysis.summary}</p>
                <div className="flex gap-3 mt-3">
                  <button onClick={() => navigate('/interview-setup')}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    Start Interview →
                  </button>
                  <button onClick={() => navigate('/job-description')}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors">
                    Match JD →
                  </button>
                </div>
              </div>
            </div>

            {/* Skills Found */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" /> Skills Detected ({analysis.skills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.skills.length > 0 ? analysis.skills.map((s: string) => <SkillBadge key={s} skill={s} type="found" />) :
                  <p className="text-sm text-[var(--color-text-muted)]">No skills extracted. Try uploading a text-readable PDF.</p>}
              </div>
            </div>

            {/* Skills Missing */}
            {analysis.missing_skills?.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" /> Skills to Add ({analysis.missing_skills.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.missing_skills.map((s: string) => <SkillBadge key={s} skill={s} type="missing" />)}
                </div>
              </div>
            )}

            {/* Experience */}
            {analysis.experience?.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Work Experience</h3>
                <div className="space-y-3">
                  {analysis.experience.map((e: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-[var(--color-surface-2)]">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{e.role} @ {e.company}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{e.duration}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
