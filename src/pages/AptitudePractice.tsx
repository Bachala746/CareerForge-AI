import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainCircuit, ChevronRight, CheckCircle, XCircle, RotateCcw,
  Clock, Target, Trophy, AlertCircle, Lightbulb, BarChart2,
  ChevronLeft, Play, BookOpen, Layers
} from 'lucide-react'
import toast from 'react-hot-toast'
import { aptitudeApi } from '../api/aptitude'

// ─── data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'quantitative',
    label: 'Quantitative Aptitude',
    icon: '🔢',
    color: 'from-blue-500 to-indigo-600',
    border: 'border-blue-500',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    desc: 'Numbers, percentages, profit/loss, time & work',
  },
  {
    id: 'logical',
    label: 'Logical Reasoning',
    icon: '🧩',
    color: 'from-purple-500 to-violet-600',
    border: 'border-purple-500',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    desc: 'Series, analogies, puzzles, blood relations',
  },
  {
    id: 'verbal',
    label: 'Verbal Ability',
    icon: '📝',
    color: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-500',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    desc: 'Vocabulary, grammar, comprehension',
  },
  {
    id: 'data_interpretation',
    label: 'Data Interpretation',
    icon: '📊',
    color: 'from-amber-500 to-orange-600',
    border: 'border-amber-500',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    desc: 'Tables, graphs, charts, caselets',
  },
]

const DIFFICULTIES = [
  {
    id: 'basic',
    label: 'Basic',
    icon: '🟢',
    color: 'text-emerald-400',
    active: 'border-emerald-500 bg-emerald-500/10 shadow-emerald-500/20',
    desc: 'Beginner friendly',
    detail: 'Fundamental concepts, simple calculations.',
  },
  {
    id: 'medium',
    label: 'Medium',
    icon: '🟡',
    color: 'text-amber-400',
    active: 'border-amber-500 bg-amber-500/10 shadow-amber-500/20',
    desc: 'Placement level',
    detail: 'Multi-step reasoning, moderate complexity.',
  },
  {
    id: 'difficult',
    label: 'Difficult',
    icon: '🔴',
    color: 'text-red-400',
    active: 'border-red-500 bg-red-500/10 shadow-red-500/20',
    desc: 'Advanced challenge',
    detail: 'Complex problems, edge cases.',
  },
]

const QUESTION_COUNT = 5

interface MCQ {
  question: string
  options: string[]
  correct: number
  explanation: string
}

interface Session {
  category: string
  category_label: string
  topic: string
  difficulty: string
  questions: MCQ[]
  ai_generated: boolean
}

type Phase = 'select' | 'quiz' | 'result'

// ─── timer hook ───────────────────────────────────────────────────────────────
function useTimer() {
  const [elapsed, setElapsed] = useState(0)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)
  const start = () => { ref.current = setInterval(() => setElapsed(s => s + 1), 1000) }
  const stop  = () => { if (ref.current) clearInterval(ref.current) }
  const reset = () => { stop(); setElapsed(0) }
  const fmt   = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return { elapsed, start, stop, reset, fmt }
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
      <motion.div className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }} />
    </div>
  )
}

// ─── Result stat card ─────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`card p-4 flex items-center gap-3`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-black text-[var(--color-text-primary)]">{value}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AptitudePractice() {
  const [phase, setPhase]       = useState<Phase>('select')
  const [selCat, setSelCat]     = useState('')
  const [selTopic, setSelTopic] = useState('')
  const [selDiff, setSelDiff]   = useState('')
  const [topics, setTopics]     = useState<string[]>([])
  const [topicsLoading, setTopicsLoading] = useState(false)

  const [session, setSession]   = useState<Session | null>(null)
  const [loading, setLoading]   = useState(false)

  // Quiz state
  const [qIdx, setQIdx]         = useState(0)
  const [answers, setAnswers]   = useState<(number | null)[]>([])
  const [revealed, setRevealed] = useState<boolean[]>([])
  const [showExpl, setShowExpl] = useState(false)

  const timer = useTimer()

  const catObj  = CATEGORIES.find(c => c.id === selCat)
  const diffObj = DIFFICULTIES.find(d => d.id === selDiff)
  const canStart = !!selCat && !!selTopic && !!selDiff

  // Load topics when category changes
  useEffect(() => {
    if (!selCat) { setTopics([]); setSelTopic(''); return }
    setTopicsLoading(true)
    setSelTopic('')
    aptitudeApi.getTopics(selCat)
      .then(t => setTopics(t))
      .catch(() => toast.error('Failed to load topics'))
      .finally(() => setTopicsLoading(false))
  }, [selCat])

  const startQuiz = useCallback(async () => {
    if (!canStart) return
    setLoading(true)
    try {
      const data = await aptitudeApi.generate({
        category: selCat, topic: selTopic, difficulty: selDiff, count: QUESTION_COUNT,
      })
      setSession(data)
      setAnswers(new Array(data.questions.length).fill(null))
      setRevealed(new Array(data.questions.length).fill(false))
      setQIdx(0)
      setShowExpl(false)
      setPhase('quiz')
      timer.reset()
      timer.start()
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }, [canStart, selCat, selTopic, selDiff, timer])

  const selectAnswer = (optIdx: number) => {
    if (revealed[qIdx]) return  // prevent re-answer
    const newAnswers  = [...answers]
    const newRevealed = [...revealed]
    newAnswers[qIdx]  = optIdx
    newRevealed[qIdx] = true
    setAnswers(newAnswers)
    setRevealed(newRevealed)
    setShowExpl(false)
  }

  const goNext = () => {
    if (!session) return
    setShowExpl(false)
    if (qIdx < session.questions.length - 1) {
      setQIdx(q => q + 1)
    } else {
      timer.stop()
      setPhase('result')
    }
  }

  const goPrev = () => { if (qIdx > 0) { setShowExpl(false); setQIdx(q => q - 1) } }

  const resetAll = () => {
    timer.stop(); timer.reset()
    setPhase('select'); setSession(null)
    setAnswers([]); setRevealed([])
    setQIdx(0); setShowExpl(false)
  }

  // ── Results ──────────────────────────────────────────────────────────────────
  const correctCount   = session ? answers.filter((a, i) => a === session.questions[i].correct).length : 0
  const attempted      = answers.filter(a => a !== null).length
  const incorrectCount = attempted - correctCount
  const unanswered     = (session?.questions.length ?? 0) - attempted
  const score          = session ? Math.round((correctCount / session.questions.length) * 100) : 0
  const accuracy       = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0

  // ────────────────────────────────────────────────────────────────────────────
  //  SELECT PHASE
  // ────────────────────────────────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] flex items-center justify-center gap-3">
            <BrainCircuit className="w-8 h-8 text-purple-500" /> Aptitude Practice
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm">
            Select your aptitude type, topic, and difficulty to get AI-generated MCQs.
          </p>
        </div>

        {/* Step 1 — Category */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">1</div>
            <h2 className="font-bold text-[var(--color-text-primary)]">Select Aptitude Type</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setSelCat(cat.id)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  selCat === cat.id
                    ? `${cat.border} ${cat.bg} shadow-lg`
                    : 'border-[var(--color-border)] hover:border-purple-500/40'
                }`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${selCat === cat.id ? cat.text : 'text-[var(--color-text-primary)]'}`}>
                      {cat.label}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{cat.desc}</p>
                  </div>
                  {selCat === cat.id && <CheckCircle className={`w-4 h-4 ${cat.text} flex-shrink-0`} />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 — Topic */}
        <AnimatePresence>
          {selCat && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} className="card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">2</div>
                <h2 className="font-bold text-[var(--color-text-primary)]">
                  Select Topic
                  <span className={`ml-2 text-xs font-normal ${catObj?.text}`}>({catObj?.label})</span>
                </h2>
              </div>
              {topicsLoading ? (
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <motion.div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full"
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                  Loading topics...
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topics.map(topic => (
                    <button key={topic} onClick={() => setSelTopic(topic)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selTopic === topic
                          ? `${catObj?.border} ${catObj?.bg} ${catObj?.text}`
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-purple-500/40'
                      }`}>
                      {topic}
                    </button>
                  ))}
                </div>
              )}
              {selTopic && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  ✓ Selected: <span className={`${catObj?.text} font-medium`}>{selTopic}</span>
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
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">3</div>
                <h2 className="font-bold text-[var(--color-text-primary)]">Select Difficulty</h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {DIFFICULTIES.map(d => (
                  <button key={d.id} onClick={() => setSelDiff(d.id)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all shadow-lg ${
                      selDiff === d.id ? d.active : 'border-[var(--color-border)] hover:border-purple-500/30 shadow-none'
                    }`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{d.icon}</span>
                      <span className={`font-bold text-sm ${selDiff === d.id ? d.color : 'text-[var(--color-text-primary)]'}`}>
                        {d.label}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)]">{d.desc}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{d.detail}</p>
                    {selDiff === d.id && <CheckCircle className={`absolute top-3 right-3 w-4 h-4 ${d.color}`} />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start */}
        <AnimatePresence>
          {canStart && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-center gap-2 flex-wrap text-sm text-[var(--color-text-muted)] mb-4">
                <span className="px-3 py-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                  {catObj?.icon} {catObj?.label}
                </span>
                <ChevronRight className="w-4 h-4" />
                <span className="px-3 py-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                  {selTopic}
                </span>
                <ChevronRight className="w-4 h-4" />
                <span className="px-3 py-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                  {diffObj?.icon} {diffObj?.label}
                </span>
                <span className="px-3 py-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                  {QUESTION_COUNT} Questions
                </span>
              </div>
              <button onClick={startQuiz} disabled={loading}
                className="w-full py-4 rounded-xl text-white font-bold text-base
                           bg-gradient-to-r from-purple-600 to-violet-500
                           hover:shadow-xl hover:shadow-purple-500/30 transition-all
                           disabled:opacity-60 flex items-center justify-center gap-3">
                {loading ? (
                  <><motion.div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity }} />
                    Generating questions...</>
                ) : (
                  <><Play className="w-5 h-5" /> Start Practice <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  //  QUIZ PHASE
  // ────────────────────────────────────────────────────────────────────────────
  if (phase === 'quiz' && session) {
    const q   = session.questions[qIdx]
    const ans = answers[qIdx]
    const rev = revealed[qIdx]
    const isLast = qIdx === session.questions.length - 1

    return (
      <div className="max-w-2xl mx-auto space-y-4 pb-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={resetAll}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Exit
          </button>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              session.ai_generated
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
            }`}>
              {session.ai_generated ? '🤖 AI Generated' : '📚 Curated'}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-muted)]">
              <Clock className="w-3.5 h-3.5" /> {timer.fmt(timer.elapsed)}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap text-[10px] text-[var(--color-text-muted)]">
          <span className={`px-2 py-0.5 rounded-full font-medium ${catObj?.bg} ${catObj?.text}`}>
            {catObj?.icon} {session.category_label}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)]">
            {session.topic}
          </span>
          <span className={`px-2 py-0.5 rounded-full font-medium ${
            selDiff === 'basic' ? 'bg-emerald-500/10 text-emerald-400' :
            selDiff === 'medium' ? 'bg-amber-500/10 text-amber-400' :
            'bg-red-500/10 text-red-400'
          }`}>
            {diffObj?.icon} {diffObj?.label}
          </span>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>Question {qIdx + 1} of {session.questions.length}</span>
            <span>{answers.filter(a => a !== null).length} answered</span>
          </div>
          <ProgressBar value={qIdx + 1} max={session.questions.length} color="bg-purple-500" />
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div key={qIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
            className="card p-6 space-y-5">
            <p className="text-base font-semibold text-[var(--color-text-primary)] leading-relaxed">
              {q.question}
            </p>

            {/* Options */}
            <div className="space-y-2.5">
              {q.options.map((opt, i) => {
                const isSelected = ans === i
                const isCorrect  = i === q.correct
                let cls = 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-purple-500/40 hover:bg-[var(--color-surface-2)]'
                if (rev) {
                  if (isCorrect) cls = 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  else if (isSelected) cls = 'border-red-500 bg-red-500/10 text-red-400'
                  else cls = 'border-[var(--color-border)] text-[var(--color-text-muted)] opacity-60'
                } else if (isSelected) {
                  cls = 'border-purple-500 bg-purple-500/10 text-purple-400'
                }
                return (
                  <button key={i} onClick={() => selectAnswer(i)} disabled={rev}
                    className={`w-full p-3.5 rounded-xl border-2 text-left text-sm font-medium transition-all flex items-center gap-3 ${cls}`}>
                    <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      rev && isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' :
                      rev && isSelected && !isCorrect ? 'border-red-500 bg-red-500 text-white' :
                      'border-current'
                    }`}>
                      {['A', 'B', 'C', 'D'][i]}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {rev && isCorrect  && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                    {rev && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>

            {/* After reveal */}
            {rev && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                {/* Result badge */}
                <div className={`flex items-center gap-2 p-3 rounded-xl mb-3 ${
                  ans === q.correct
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  {ans === q.correct
                    ? <><CheckCircle className="w-4 h-4 text-emerald-400" /><span className="text-sm font-semibold text-emerald-400">Correct!</span></>
                    : <><XCircle className="w-4 h-4 text-red-400" /><span className="text-sm font-semibold text-red-400">Incorrect. Correct answer: {['A','B','C','D'][q.correct]}</span></>
                  }
                </div>

                {/* Explanation toggle */}
                {!showExpl ? (
                  <button onClick={() => setShowExpl(true)}
                    className="flex items-center gap-1.5 text-xs text-yellow-400 hover:underline">
                    <Lightbulb className="w-3.5 h-3.5" /> Show explanation
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs font-bold text-yellow-400 mb-1 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" /> Explanation
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {q.explanation}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button onClick={goPrev} disabled={qIdx === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--color-border)]
                       text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]
                       transition-all disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {session.questions.map((_, i) => (
              <button key={i} onClick={() => { setQIdx(i); setShowExpl(false) }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === qIdx ? 'bg-purple-500 scale-125' :
                  answers[i] !== null
                    ? answers[i] === session.questions[i].correct ? 'bg-emerald-500' : 'bg-red-500'
                    : 'bg-[var(--color-border)]'
                }`} />
            ))}
          </div>

          {!rev ? (
            <button onClick={() => { const na = [...answers]; na[qIdx] = -1; const nr = [...revealed]; nr[qIdx] = true; setAnswers(na); setRevealed(nr) }}
              className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text-muted)]
                         hover:bg-[var(--color-surface-2)] transition-all">
              Skip
            </button>
          ) : isLast ? (
            <button onClick={goNext}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500
                         text-white text-sm font-bold hover:shadow-lg transition-all">
              <Trophy className="w-4 h-4" /> Finish
            </button>
          ) : (
            <button onClick={goNext}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500
                         text-white text-sm font-semibold hover:shadow-lg transition-all">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  //  RESULT PHASE
  // ────────────────────────────────────────────────────────────────────────────
  if (phase === 'result' && session) {
    const grade = score >= 80 ? { label: 'Excellent!', color: 'text-emerald-400', emoji: '🏆' }
                : score >= 60 ? { label: 'Good Job!',  color: 'text-blue-400',    emoji: '👍' }
                : score >= 40 ? { label: 'Keep Practicing', color: 'text-amber-400', emoji: '📚' }
                :               { label: 'Needs Work', color: 'text-red-400',     emoji: '💪' }

    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-10">
        {/* Score hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="card p-8 text-center space-y-3">
          <div className="text-5xl">{grade.emoji}</div>
          <h2 className={`text-2xl font-black ${grade.color}`}>{grade.label}</h2>
          <div className="flex items-center justify-center gap-2">
            <span className="text-5xl font-black text-[var(--color-text-primary)]">{score}</span>
            <span className="text-2xl text-[var(--color-text-muted)] font-light">/ 100</span>
          </div>
          <ProgressBar value={score} max={100}
            color={score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'} />
          <p className="text-xs text-[var(--color-text-muted)]">
            {catObj?.icon} {session.category_label} · {session.topic} · {diffObj?.label}
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Total Questions" value={session.questions.length}
            icon={<BookOpen className="w-5 h-5 text-blue-400" />} color="bg-blue-500/10" />
          <StatCard label="Correct" value={correctCount}
            icon={<CheckCircle className="w-5 h-5 text-emerald-400" />} color="bg-emerald-500/10" />
          <StatCard label="Incorrect" value={incorrectCount}
            icon={<XCircle className="w-5 h-5 text-red-400" />} color="bg-red-500/10" />
          <StatCard label="Skipped" value={unanswered}
            icon={<AlertCircle className="w-5 h-5 text-amber-400" />} color="bg-amber-500/10" />
          <StatCard label="Accuracy" value={`${accuracy}%`}
            icon={<Target className="w-5 h-5 text-purple-400" />} color="bg-purple-500/10" />
          <StatCard label="Time Taken" value={timer.fmt(timer.elapsed)}
            icon={<Clock className="w-5 h-5 text-cyan-400" />} color="bg-cyan-500/10" />
        </div>

        {/* Per-question review */}
        <div className="card p-5 space-y-3">
          <p className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" /> Answer Review
          </p>
          <div className="space-y-2">
            {session.questions.map((q, i) => {
              const userAns = answers[i]
              const isCorrect = userAns === q.correct
              const skipped   = userAns === null || userAns === -1
              return (
                <div key={i} className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                  skipped ? 'border-amber-500/20 bg-amber-500/5' :
                  isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' :
                  'border-red-500/20 bg-red-500/5'
                }`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    skipped ? 'bg-amber-500/20 text-amber-400' :
                    isCorrect ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>Q{i+1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--color-text-secondary)] leading-snug truncate">{q.question}</p>
                    <p className="text-[10px] mt-1">
                      {skipped ? (
                        <span className="text-amber-400">Skipped</span>
                      ) : isCorrect ? (
                        <span className="text-emerald-400">Correct: {['A','B','C','D'][q.correct]}) {q.options[q.correct]}</span>
                      ) : (
                        <>
                          <span className="text-red-400">Your answer: {['A','B','C','D'][userAns!]}) </span>
                          <span className="text-emerald-400"> Correct: {['A','B','C','D'][q.correct]})</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <button onClick={startQuiz}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)]
                       text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all">
            <RotateCcw className="w-4 h-4" /> Try Again (same settings)
          </button>
          <button onClick={resetAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500
                       text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all ml-auto">
            <Layers className="w-4 h-4" /> New Practice Session
          </button>
        </div>
      </div>
    )
  }

  return null
}
