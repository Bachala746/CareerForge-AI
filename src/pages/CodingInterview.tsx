import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Send, RotateCcw, ChevronRight, CheckCircle, XCircle,
  Code2, BookOpen, Zap, Brain, AlertCircle, Lightbulb,
  BarChart2, Clock, Cpu, ArrowLeft, RefreshCw, Layers
} from 'lucide-react'
import toast from 'react-hot-toast'
import { codingApi } from '../api/coding'

// ─── constants ───────────────────────────────────────────────────────────────

const LANGUAGES = [
  { id: 'python',     label: 'Python',     icon: '🐍', color: 'from-blue-500 to-indigo-600',  desc: 'General purpose · Data Science · Scripting' },
  { id: 'java',       label: 'Java',        icon: '☕', color: 'from-orange-500 to-red-600',   desc: 'Enterprise · Android · Backend' },
  { id: 'javascript', label: 'JavaScript',  icon: '⚡', color: 'from-yellow-400 to-amber-500', desc: 'Web · Node.js · Full-stack' },
  { id: 'mysql',      label: 'MySQL',       icon: '🗄️', color: 'from-cyan-500 to-teal-600',   desc: 'Databases · SQL Queries · Data Analysis' },
]

const DIFFICULTIES = [
  {
    id: 'basic',
    label: 'Basic',
    icon: '🟢',
    color: 'border-emerald-500/40 bg-emerald-500/8 text-emerald-400',
    activeColor: 'border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/20',
    desc: 'Beginner-friendly',
    detail: 'Simple syntax & concepts. Small programs or queries. Perfect for students learning the topic.',
  },
  {
    id: 'medium',
    label: 'Medium',
    icon: '🟡',
    color: 'border-amber-500/40 bg-amber-500/8 text-amber-400',
    activeColor: 'border-amber-500 bg-amber-500/20 shadow-lg shadow-amber-500/20',
    desc: 'Interview preparation',
    detail: 'Multi-step reasoning. Practical problem-solving. More complex conditions and logic.',
  },
  {
    id: 'difficult',
    label: 'Difficult',
    icon: '🔴',
    color: 'border-red-500/40 bg-red-500/8 text-red-400',
    activeColor: 'border-red-500 bg-red-500/20 shadow-lg shadow-red-500/20',
    desc: 'Advanced challenge',
    detail: 'Edge cases & complex algorithms. Deeper understanding required. Suitable for advanced practice.',
  },
]

type Phase = 'select' | 'practice' | 'result'

interface Question {
  title: string
  difficulty: string
  language: string
  topic: string
  description: string
  examples: Array<{ input: string; output: string; explain?: string }>
  constraints: string[]
  starter_code: string
  solution_hint: string
  ai_generated: boolean
}

interface EvalResult {
  passed: boolean
  score: number
  feedback: string
  time_complexity: string
  space_complexity: string
  strengths: string[]
  suggestions: string[]
  test_results: Array<{ description: string; passed: boolean; note: string }>
  ai_review: boolean
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <motion.circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-black" style={{ color }}>{score}</span>
        <span className="text-[9px] text-slate-400 font-medium">/ 100</span>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CodingInterview() {
  const [phase, setPhase]                 = useState<Phase>('select')
  const [selLang, setSelLang]             = useState('')
  const [selTopic, setSelTopic]           = useState('')
  const [selDiff, setSelDiff]             = useState('')
  const [topics, setTopics]               = useState<string[]>([])
  const [topicsLoading, setTopicsLoading] = useState(false)

  const [question, setQuestion]           = useState<Question | null>(null)
  const [qLoading, setQLoading]           = useState(false)
  const [code, setCode]                   = useState('')

  const [evalResult, setEvalResult]       = useState<EvalResult | null>(null)
  const [evaluating, setEvaluating]       = useState(false)
  const [showHint, setShowHint]           = useState(false)

  // Load topics when language changes
  useEffect(() => {
    if (!selLang) { setTopics([]); setSelTopic(''); return }
    setTopicsLoading(true)
    setSelTopic('')
    codingApi.getTopics(selLang)
      .then(t => setTopics(t))
      .catch(() => toast.error('Failed to load topics'))
      .finally(() => setTopicsLoading(false))
  }, [selLang])

  // Start practice — fetch question from backend
  const startPractice = useCallback(async () => {
    if (!selLang || !selTopic || !selDiff) return
    setQLoading(true)
    setPhase('practice')
    setQuestion(null)
    setCode('')
    setEvalResult(null)
    setShowHint(false)
    try {
      const q = await codingApi.generate({ language: selLang, topic: selTopic, difficulty: selDiff })
      setQuestion(q)
      setCode(q.starter_code || '')
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate question')
      setPhase('select')
    } finally {
      setQLoading(false)
    }
  }, [selLang, selTopic, selDiff])

  // Submit for AI evaluation
  const submitCode = useCallback(async () => {
    if (!question || !code.trim()) return
    setEvaluating(true)
    try {
      const result = await codingApi.evaluate({
        code,
        language: selLang,
        topic: selTopic,
        difficulty: selDiff,
        problem_title: question.title,
        problem_description: question.description,
      })
      setEvalResult(result)
      setPhase('result')
    } catch (err: any) {
      toast.error(err.message || 'Evaluation failed')
    } finally {
      setEvaluating(false)
    }
  }, [question, code, selLang, selTopic, selDiff])

  // Try a new question with same settings
  const tryAgain = () => startPractice()

  // Reset everything
  const resetAll = () => {
    setPhase('select')
    setQuestion(null)
    setCode('')
    setEvalResult(null)
    setShowHint(false)
  }

  const langObj  = LANGUAGES.find(l => l.id === selLang)
  const diffObj  = DIFFICULTIES.find(d => d.id === selDiff)
  const canStart = !!selLang && !!selTopic && !!selDiff

  // ── SELECTION SCREEN ────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] flex items-center justify-center gap-3">
            <Code2 className="w-8 h-8 text-blue-500" /> Coding Practice
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm">
            Select your language, topic, and difficulty — get AI-generated questions tailored to your choice.
          </p>
        </div>

        {/* Step 1 — Language */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">1</div>
            <h2 className="font-bold text-[var(--color-text-primary)]">Select Programming Language</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {LANGUAGES.map(lang => (
              <button key={lang.id} onClick={() => setSelLang(lang.id)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all group ${
                  selLang === lang.id
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'border-[var(--color-border)] hover:border-blue-500/40'
                }`}>
                {selLang === lang.id && (
                  <div className="absolute inset-0 rounded-xl bg-blue-500/8" />
                )}
                <div className="relative z-10">
                  <div className="text-2xl mb-2">{lang.icon}</div>
                  <p className="font-bold text-[var(--color-text-primary)] text-sm">{lang.label}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 leading-tight">{lang.desc}</p>
                </div>
                {selLang === lang.id && (
                  <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 — Topic */}
        <AnimatePresence>
          {selLang && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} className="card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">2</div>
                <h2 className="font-bold text-[var(--color-text-primary)]">
                  Select Topic
                  <span className="ml-2 text-xs font-normal text-blue-400">({langObj?.label})</span>
                </h2>
              </div>
              {topicsLoading ? (
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <motion.div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                  Loading topics...
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topics.map(topic => (
                    <button key={topic} onClick={() => setSelTopic(topic)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selTopic === topic
                          ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-blue-500/40 hover:text-blue-400'
                      }`}>
                      {topic}
                    </button>
                  ))}
                </div>
              )}
              {selTopic && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  ✓ Selected: <span className="text-blue-400 font-medium">{selTopic}</span>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3 — Difficulty */}
        <AnimatePresence>
          {selTopic && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} className="card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">3</div>
                <h2 className="font-bold text-[var(--color-text-primary)]">Select Difficulty Level</h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {DIFFICULTIES.map(d => (
                  <button key={d.id} onClick={() => setSelDiff(d.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                      selDiff === d.id ? d.activeColor : `border-[var(--color-border)] hover:${d.color}`
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{d.icon}</span>
                      <span className="font-bold text-[var(--color-text-primary)]">{d.label}</span>
                    </div>
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">{d.desc}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">{d.detail}</p>
                    {selDiff === d.id && (
                      <CheckCircle className="absolute top-3 right-3 w-4 h-4 text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start button */}
        <AnimatePresence>
          {canStart && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              {/* Summary */}
              <div className="flex items-center justify-center gap-2 flex-wrap text-sm text-[var(--color-text-muted)] mb-4">
                <span className="px-3 py-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                  {langObj?.icon} {langObj?.label}
                </span>
                <ChevronRight className="w-4 h-4" />
                <span className="px-3 py-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                  {selTopic}
                </span>
                <ChevronRight className="w-4 h-4" />
                <span className="px-3 py-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                  {diffObj?.icon} {diffObj?.label}
                </span>
              </div>
              <button onClick={startPractice}
                className="w-full py-4 rounded-xl text-white font-bold text-base bg-gradient-to-r from-blue-600 to-cyan-500
                           hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-3">
                <Play className="w-5 h-5" /> Start Practice Session <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ── PRACTICE SCREEN ─────────────────────────────────────────────────────────
  if (phase === 'practice') {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] -m-6 p-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex-shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={resetAll} className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <div className="h-4 w-px bg-[var(--color-border)]" />
            {question ? (
              <>
                <span className="font-semibold text-sm text-[var(--color-text-primary)] truncate">{question.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                  question.difficulty === 'Basic' ? 'bg-emerald-500/15 text-emerald-400' :
                  question.difficulty === 'Medium' ? 'bg-amber-500/15 text-amber-400' :
                  'bg-red-500/15 text-red-400'}`}>
                  {question.difficulty}
                </span>
                <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0 hidden sm:block">
                  {langObj?.icon} {question.language} · {question.topic}
                </span>
              </>
            ) : (
              <span className="text-sm text-[var(--color-text-muted)] flex items-center gap-2">
                <motion.div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
                  animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                Generating question...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={tryAgain} disabled={qLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[var(--color-border)]
                         text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all disabled:opacity-50">
              <RefreshCw className="w-3 h-3" /> New Question
            </button>
            <button onClick={submitCode} disabled={!question || !code.trim() || evaluating}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500
                         text-white text-xs font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-60">
              {evaluating ? (
                <><motion.div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity }} /> Evaluating...</>
              ) : (
                <><Send className="w-3 h-3" /> Submit & Evaluate</>
              )}
            </button>
          </div>
        </div>

        {/* Main split */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — Problem */}
          <div className="w-[380px] flex-shrink-0 border-r border-[var(--color-border)] overflow-y-auto bg-[var(--color-surface)]">
            {qLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                <motion.div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full"
                  animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Generating your question</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {langObj?.icon} {selLang} · {selTopic} · {diffObj?.label}
                  </p>
                </div>
              </div>
            ) : question ? (
              <div className="p-5 space-y-5">
                {/* Description */}
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Problem</p>
                  <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line">
                    {question.description}
                  </p>
                </div>

                {/* Examples */}
                {question.examples?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Examples</p>
                    {question.examples.map((ex, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[var(--color-surface-2)] font-mono text-xs space-y-1">
                        <div><span className="text-[var(--color-text-muted)]">Input:  </span>
                          <span className="text-[var(--color-text-primary)]">{ex.input}</span></div>
                        <div><span className="text-[var(--color-text-muted)]">Output: </span>
                          <span className="text-emerald-400">{ex.output}</span></div>
                        {ex.explain && (
                          <div className="text-[var(--color-text-muted)] pt-1">💡 {ex.explain}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {question.constraints?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Constraints</p>
                    <ul className="space-y-1">
                      {question.constraints.map((c, i) => (
                        <li key={i} className="text-xs text-[var(--color-text-muted)] font-mono flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>{c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hint */}
                <div>
                  {!showHint ? (
                    <button onClick={() => setShowHint(true)}
                      className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-yellow-400 transition-colors">
                      <Lightbulb className="w-3.5 h-3.5" /> Show hint
                    </button>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-xs font-semibold text-yellow-400 mb-1 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> Hint
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                        {question.solution_hint}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* AI badge */}
                <div className="pt-2 border-t border-[var(--color-border)]">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    question.ai_generated
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}>
                    {question.ai_generated ? '🤖 AI Generated' : '📚 Curated Question'}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Right — Editor */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]">
            {/* Editor header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e3e] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-xs text-[#858585] font-mono">
                {selLang === 'mysql' ? 'solution.sql' : selLang === 'java' ? 'Solution.java' :
                 selLang === 'javascript' ? 'solution.js' : 'solution.py'}
              </span>
              <span className="text-[10px] text-[#858585]">{langObj?.label}</span>
            </div>
            {/* Textarea editor */}
            <div className="flex-1 overflow-hidden">
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full h-full p-5 font-mono text-sm resize-none focus:outline-none border-0"
                style={{ background: '#1e1e1e', color: '#d4d4d4', lineHeight: '1.6', caretColor: '#60a5fa' }}
                spellCheck={false}
                placeholder={`// Write your ${langObj?.label} solution here...`}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── RESULT SCREEN ───────────────────────────────────────────────────────────
  if (phase === 'result' && evalResult && question) {
    const passedTests = evalResult.test_results.filter(t => t.passed).length
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-10">
        {/* Score hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="card p-6 flex flex-col sm:flex-row items-center gap-6">
          <ScoreRing score={evalResult.score} />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              {evalResult.passed
                ? <><CheckCircle className="w-5 h-5 text-emerald-400" /><span className="font-bold text-emerald-400">Solution Accepted</span></>
                : <><XCircle   className="w-5 h-5 text-red-400"     /><span className="font-bold text-red-400">Needs Improvement</span></>
              }
              {evalResult.ai_review
                ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">🤖 AI Review</span>
                : <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">Basic Review</span>
              }
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{evalResult.feedback}</p>
            <div className="flex items-center gap-4 mt-3 flex-wrap justify-center sm:justify-start">
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <Clock className="w-3 h-3" /> {evalResult.time_complexity}
              </span>
              <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <Cpu className="w-3 h-3" /> {evalResult.space_complexity}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {langObj?.icon} {question.language} · {question.topic} · {diffObj?.label}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Strengths */}
          {evalResult.strengths?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="card p-4 space-y-3">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Strengths
              </p>
              <ul className="space-y-2">
                {evalResult.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-[var(--color-text-secondary)] flex items-start gap-2">
                    <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>{s}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Suggestions */}
          {evalResult.suggestions?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="card p-4 space-y-3">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> Suggestions
              </p>
              <ul className="space-y-2">
                {evalResult.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-[var(--color-text-secondary)] flex items-start gap-2">
                    <span className="text-amber-400 flex-shrink-0 mt-0.5">→</span>{s}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* Test results */}
        {evalResult.test_results?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Test Cases</p>
              <span className="text-xs text-emerald-400 font-semibold">
                {passedTests}/{evalResult.test_results.length} Passed
              </span>
            </div>
            <div className="space-y-2">
              {evalResult.test_results.map((t, i) => (
                <div key={i} className={`p-3 rounded-xl text-xs flex items-start gap-3 ${
                  t.passed ? 'bg-emerald-500/8 border border-emerald-500/20' : 'bg-red-500/8 border border-red-500/20'
                }`}>
                  {t.passed
                    ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    : <XCircle   className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  }
                  <div>
                    <span className={`font-semibold ${t.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.description}
                    </span>
                    {t.note && <p className="text-[var(--color-text-muted)] mt-0.5">{t.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex gap-3 flex-wrap">
          <button onClick={tryAgain}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)]
                       text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all">
            <RefreshCw className="w-4 h-4" /> Try New Question
          </button>
          <button onClick={() => { setPhase('practice'); setEvalResult(null) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)]
                       text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all">
            <Code2 className="w-4 h-4" /> Edit Solution
          </button>
          <button onClick={resetAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500
                       text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all ml-auto">
            <Layers className="w-4 h-4" /> Change Language / Topic
          </button>
        </motion.div>
      </div>
    )
  }

  return null
}
