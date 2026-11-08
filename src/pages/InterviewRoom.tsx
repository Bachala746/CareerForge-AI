import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, Send, CheckCircle, ChevronRight, Clock,
  Brain, BarChart3, Lightbulb, Target, Key, Square, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useInterviewStore } from '../store/interviewStore'
import { interviewsApi } from '../api/interviews'
import VideoInterviewRoom from '../components/interview/VideoInterviewRoom'
import type { CVSession } from '../hooks/useCameraCV'

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

// Live animated waveform shown while recording
function LiveWaveform() {
  return (
    <div className="flex items-center gap-[3px] h-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div key={i} className="w-[3px] rounded-full bg-red-400"
          animate={{ height: ['4px', `${8 + (i % 4) * 5}px`, '4px'] }}
          transition={{ duration: 0.45 + i * 0.04, repeat: Infinity, delay: i * 0.05 }} />
      ))}
    </div>
  )
}

// Animated score bar for AI evaluation
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const w = `${Math.max(4, Math.min(100, value))}%`
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-[var(--color-text-muted)]">{label}</span>
        <span className={`text-xs font-bold ${color}`}>{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: w }} transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${value >= 75 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`} />
      </div>
    </div>
  )
}

export default function InterviewRoom() {
  const navigate = useNavigate()
  const { session, currentQuestionIndex, setAnswer, setEvaluation, nextQuestion, setSession, interviewMode } = useInterviewStore()

  // ── All hooks BEFORE any early return ──────────────────────────────────────
  const [answer, setCurrentAnswer]       = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [submitted, setSubmitted]         = useState<Set<number>>(new Set())
  const [timeElapsed, setTimeElapsed]     = useState(0)
  const [feedback, setFeedback]           = useState<any>(null)
  const [ending, setEnding]               = useState(false)
  const [showModelAnswer, setShowModelAnswer] = useState(false)
  const [isRecording, setIsRecording]     = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(true)
  const [voiceError, setVoiceError]       = useState('')
  const [interimText, setInterimText]     = useState('')
  const [lowConfPhrases, setLowConfPhrases] = useState<string[]>([])  // phrases Chrome flagged as uncertain

  const textareaRef      = useRef<HTMLTextAreaElement>(null)
  const timerRef         = useRef<any>(null)
  const recognitionRef   = useRef<any>(null)
  const finalTextRef     = useRef('')   // accumulated confirmed speech
  const answerRef        = useRef('')   // mirrors answer state for callbacks
  const isRecordingRef   = useRef(false) // user's INTENT to keep recording (survives restarts)
  const restartTimerRef  = useRef<any>(null) // debounce for restart attempts

  const MAX_WORDS = 1000

  // Keep answerRef synced with state
  useEffect(() => { answerRef.current = answer }, [answer])

  // ── Permanently stop recognition (no restart will happen) ─────────────────
  const stopRecognitionNow = useCallback(() => {
    isRecordingRef.current = false
    clearTimeout(restartTimerRef.current)
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    setIsRecording(false)
    setInterimText('')
  }, [])

  // Timer + cleanup
  useEffect(() => {
    if (!session) { navigate('/interview-setup'); return }
    timerRef.current = setInterval(() => setTimeElapsed(t => t + 1), 1000)
    return () => {
      clearInterval(timerRef.current)
      clearTimeout(restartTimerRef.current)
      stopRecognitionNow()
    }
  }, [session, navigate, stopRecognitionNow])

  // ── Speech recognition refs ───────────────────────────────────────────────
  // lastBoundaryPhraseRef: stores the LAST final phrase from a session that just
  // ended, so we can detect and skip ONLY the exact session-boundary replay.
  // (Not a broad endsWith check — only fires for the very first result of a new session.)
  const lastBoundaryPhraseRef = useRef<string>('')
  const isFirstResultOfSession = useRef(true)
  const restartDelayRef        = useRef(400)
  const errorCountRef          = useRef(0)
  const preemptTimerRef        = useRef<any>(null)  // 55s pre-emptive restart

  const launchRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR || !isRecordingRef.current) return

    // Mark that the next onresult is the first of a fresh session
    isFirstResultOfSession.current = true

    const rec = new SR()
    rec.continuous      = true
    rec.interimResults  = true
    rec.lang            = 'en-IN'   // Indian English — better accuracy for Indian-accented speech
    rec.maxAlternatives = 1

    rec.onstart = () => {
      errorCountRef.current   = 0
      restartDelayRef.current = 400

      // Pre-emptive restart at 55 s — before Chrome's ~60s hard session cap.
      // This prevents Chrome from silently cutting a word mid-delivery.
      clearTimeout(preemptTimerRef.current)
      preemptTimerRef.current = setTimeout(() => {
        if (!isRecordingRef.current) return
        // Store last confirmed phrase before we stop, for boundary-replay guard
        const words   = finalTextRef.current.trim().split(/\s+/)
        // capture last ~6 words as the boundary phrase
        lastBoundaryPhraseRef.current = words.slice(-6).join(' ').toLowerCase()
        // Nullify onend so it doesn't trigger a second restart
        if (recognitionRef.current) {
          const old = recognitionRef.current
          recognitionRef.current = null
          old.onend = () => {}
          try { old.stop() } catch {}
        }
        // Restart immediately (mic is still ours, just starting a new session)
        setTimeout(() => {
          if (isRecordingRef.current) launchRecognition()
        }, 250)
      }, 55_000)
    }

    rec.onresult = (event: any) => {
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          const trimmed = t.trim()
          if (!trimmed) continue

          // ── Session-boundary replay guard (surgical) ──────────────────────
          // Chrome sometimes replays the last phrase of the previous session as
          // the very first final result of a new session. We only check for this
          // on the FIRST final result after a session restart, and only if it
          // exactly matches the boundary phrase we saved.
          if (isFirstResultOfSession.current && lastBoundaryPhraseRef.current) {
            const incoming = trimmed.toLowerCase()
            const boundary = lastBoundaryPhraseRef.current
            // Skip if the boundary phrase ENDS WITH the incoming text
            // (i.e. the new session is replaying the tail of the previous session)
            if (boundary.endsWith(incoming) || incoming === boundary) {
              // Consumed the boundary guard — clear it so subsequent results are NOT filtered
              lastBoundaryPhraseRef.current = ''
              isFirstResultOfSession.current = false
              continue
            }
          }
          // After first final result, boundary guard is done for this session
          isFirstResultOfSession.current = false
          lastBoundaryPhraseRef.current  = ''
          // ─────────────────────────────────────────────────────────────────

          // ── Phrase-level confidence check ─────────────────────────────────
          // Chrome provides a single confidence score for each final phrase
          // (not per word). Range: 0–1. Values of 0, NaN, or undefined mean
          // the browser did not supply a usable confidence reading.
          // We NEVER alter the recognized text — we only collect the phrase for
          // the review panel so the user can check and correct it manually.
          const rawConf = event.results[i][0].confidence
          const conf    = typeof rawConf === 'number' && !isNaN(rawConf) ? rawConf : null
          if (conf !== null && conf > 0 && conf < 0.75) {
            // Phrase was recognized but with low confidence — show for review
            setLowConfPhrases(prev => [...prev, trimmed])
          }
          // ─────────────────────────────────────────────────────────────────

          const sep = finalTextRef.current.length > 0 && !finalTextRef.current.endsWith(' ') ? ' ' : ''
          finalTextRef.current += sep + trimmed

          // Auto-stop at word limit
          const wc = finalTextRef.current.trim().split(/\s+/).filter(Boolean).length
          if (wc >= MAX_WORDS) {
            isRecordingRef.current = false
            setIsRecording(false)
            setInterimText('')
            setCurrentAnswer(finalTextRef.current)
            clearTimeout(preemptTimerRef.current)
            toast('1,000 word limit reached — recording stopped.', { icon: '\u270b', duration: 4000 })
            try { rec.stop() } catch {}
            return
          }
        } else {
          // Interim (in-progress) result — show live but do NOT commit
          interim = t
          // Any interim result also means this is no longer the session's first result
          isFirstResultOfSession.current = false
        }
      }

      // Show confirmed text + live interim preview
      const base = finalTextRef.current
      const sep2 = base.length > 0 && !base.endsWith(' ') && interim ? ' ' : ''
      setCurrentAnswer(base + (interim ? sep2 + interim : ''))
      setInterimText(interim)
    }

    rec.onerror = (event: any) => {
      const err = event.error
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        clearTimeout(preemptTimerRef.current)
        setVoiceError(
          'Microphone blocked. Click the lock icon in the Chrome address bar → Allow microphone → Refresh.'
        )
        isRecordingRef.current = false
        recognitionRef.current = null
        setIsRecording(false)
        setInterimText('')
      } else if (err === 'no-speech') {
        // Silence — Chrome will fire onend, which will restart. Nothing to do here.
        setInterimText('')
      } else if (err === 'aborted') {
        // We called rec.stop() — onend handles everything
        setInterimText('')
      } else if (err === 'network') {
        errorCountRef.current += 1
        restartDelayRef.current = Math.min(3000, 600 * errorCountRef.current)
        setVoiceError('Network hiccup — reconnecting... captured text is safe.')
        setTimeout(() => setVoiceError(''), 5000)
        setInterimText('')
        recognitionRef.current = null
      } else {
        errorCountRef.current += 1
        restartDelayRef.current = Math.min(3000, 500 * errorCountRef.current)
        setVoiceError(`Voice: ${err} — reconnecting...`)
        setTimeout(() => setVoiceError(''), 4000)
        setInterimText('')
        recognitionRef.current = null
      }
    }

    rec.onend = () => {
      clearTimeout(preemptTimerRef.current)
      recognitionRef.current = null
      setInterimText('')

      if (!isRecordingRef.current) {
        setIsRecording(false)
        return
      }

      // Bail if too many consecutive errors
      if (errorCountRef.current >= 6) {
        isRecordingRef.current = false
        setIsRecording(false)
        setVoiceError('Speech recognition stopped after repeated errors. Click Voice Input to try again.')
        return
      }

      // Save last ~6 words as boundary phrase before restarting
      const words = finalTextRef.current.trim().split(/\s+/)
      lastBoundaryPhraseRef.current = words.slice(-6).join(' ').toLowerCase()

      // Auto-restart
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = setTimeout(() => {
        if (!isRecordingRef.current) return
        const wc = finalTextRef.current.trim().split(/\s+/).filter(Boolean).length
        if (wc >= MAX_WORDS) {
          isRecordingRef.current = false
          setIsRecording(false)
          toast('1,000 word limit reached — recording stopped.', { icon: '\u270b', duration: 4000 })
          return
        }
        launchRecognition()
      }, restartDelayRef.current)
    }

    recognitionRef.current = rec
    try {
      rec.start()
    } catch {
      // InvalidStateError: mic still releasing from previous session
      recognitionRef.current = null
      if (isRecordingRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (isRecordingRef.current) launchRecognition()
        }, 800)
      }
    }
  }, [])   // reads only refs — no state deps needed

  // ── Start voice recording ──────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setVoiceSupported(false)
      setVoiceError('Speech recognition requires Google Chrome. Please open this page in Chrome.')
      return
    }
    const wc = answerRef.current.trim().split(/\s+/).filter(Boolean).length
    if (wc >= MAX_WORDS) {
      toast('Answer already at 1,000 word limit. Edit manually or Submit.', { icon: '\u270b' })
      return
    }
    setVoiceError('')
    errorCountRef.current        = 0
    restartDelayRef.current      = 400
    lastBoundaryPhraseRef.current = ''
    isFirstResultOfSession.current = true
    finalTextRef.current         = answerRef.current  // keep any text already typed
    isRecordingRef.current       = true
    setLowConfPhrases([])    // clear previous session's uncertain phrases
    setIsRecording(true)
    toast('Listening... speak now', { duration: 2000 })
    launchRecognition()
  }, [launchRecognition])

  // ── Stop voice recording ───────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false
    clearTimeout(restartTimerRef.current)
    clearTimeout(preemptTimerRef.current)
    setInterimText('')
    setCurrentAnswer(finalTextRef.current)
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    setIsRecording(false)
    toast.success('Recording stopped. Review and edit your answer, then Submit.')
    setTimeout(() => textareaRef.current?.focus(), 150)
  }, [])

  // ── Early return AFTER all hooks ────────────────────────────────────────────
  if (!session) return null

  const questions = session.questions || []
  const currentQ  = questions[currentQuestionIndex]
  const totalQ    = questions.length
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // Submit answer to backend
  const doSubmit = async () => {
    if (isRecording) stopRecognitionNow()
    const finalAnswer = answer.trim()
    if (!finalAnswer) { toast.error('Please type or speak your answer first'); return }
    if (!currentQ) return
    setSubmitting(true)
    setShowModelAnswer(false)
    try {
      const result = await interviewsApi.submitAnswer(session.session_id, {
        question_id: currentQ.id,
        answer_text: finalAnswer,
        duration_secs: timeElapsed,
        generate_followup: currentQuestionIndex < totalQ - 1,
        total_questions: totalQ,
      })
      setAnswer(currentQ.id, finalAnswer)
      setEvaluation(currentQ.id, result.evaluation)
      setFeedback(result.evaluation)
      setSubmitted(prev => new Set(prev).add(currentQ.id))
      if (result.followup_question) {
        setSession({ ...session, questions: [...questions, result.followup_question] })
      }
      const score = result.evaluation?.overall_score ?? result.evaluation?.technical_score ?? 0
      const emoji = score >= 75 ? 'Great' : score >= 50 ? 'Good' : 'Keep Practicing'
      toast.success(`Submitted! ${emoji} — Score: ${Math.round(score)}/100`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit answer')
    } finally { setSubmitting(false) }
  }

  const handleNext = () => {
    stopRecognitionNow()
    setCurrentAnswer('')
    setFeedback(null)
    setShowModelAnswer(false)
    setInterimText('')
    setLowConfPhrases([])
    finalTextRef.current = ''
    nextQuestion()
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  const handleEnd = async (cvSession?: CVSession | null) => {
    stopRecognitionNow()
    setEnding(true)
    try {
      // Store CV data locally (no backend needed, privacy-preserving)
      if (cvSession && session?.session_id) {
        localStorage.setItem(
          `cv-session-${session.session_id}`,
          JSON.stringify(cvSession)
        )
      }
      await interviewsApi.endSession(session!.session_id)
      toast.success('Interview complete! Generating report...')
      navigate(`/report/${session!.session_id}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to end session')
      navigate('/history')
    } finally { setEnding(false) }
  }

  const isLastQuestion     = currentQuestionIndex >= totalQ - 1
  const isCurrentSubmitted = currentQ ? submitted.has(currentQ.id) : false
  const answeredCount      = submitted.size
  const wordCount          = answer.trim() ? answer.trim().split(/\s+/).length : 0

  // ── Video interview mode: delegate to VideoInterviewRoom ────────────────────
  if (interviewMode === 'audio_video') {
    return (
      <VideoInterviewRoom
        session={session}
        currentQuestionIndex={currentQuestionIndex}
        submitted={submitted}
        feedback={feedback}
        ending={ending}
        showModelAnswer={showModelAnswer}
        answer={answer}
        isRecording={isRecording}
        voiceError={voiceError}
        interimText={interimText}
        wordCount={wordCount}
        MAX_WORDS={MAX_WORDS}
        lowConfPhrases={lowConfPhrases}
        clearLowConf={() => setLowConfPhrases([])}
        setCurrentAnswer={setCurrentAnswer}
        startRecording={startRecording}
        stopRecording={stopRecording}
        doSubmit={doSubmit}
        handleNext={handleNext}
        handleEnd={handleEnd}
        setShowModelAnswer={setShowModelAnswer}
        formatTime={formatTime}
        timeElapsed={timeElapsed}
        onCVSample={async () => {}}
      />
    )
  }

  // ── Audio interview mode (existing layout, unchanged) ───────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* Header */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {session.company ? `${session.role} @ ${session.company}` : session.role}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] capitalize">
              {session.interview_type} · {session.personality}
              {(session as any).resume_loaded && <span className="ml-1 text-green-400">· personalized</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm font-mono text-[var(--color-text-muted)]">
            <Clock className="w-4 h-4" /> {formatTime(timeElapsed)}
          </div>
          <button onClick={handleEnd} disabled={ending}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50">
            {ending ? 'Ending...' : 'End & Report'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
          <motion.div animate={{ width: `${(answeredCount / Math.max(totalQ, 1)) * 100}%` }}
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full" />
        </div>
        <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">
          {answeredCount}/{totalQ} answered · Q{currentQuestionIndex + 1}
        </span>
      </div>

      {/* Question card */}
      {currentQ && (
        <motion.div key={currentQ.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">AI</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 capitalize font-medium">{currentQ.type}</span>
                {currentQ.context && <span className="text-[10px] text-[var(--color-text-muted)] truncate max-w-xs">{currentQ.context}</span>}
              </div>
              <p className="text-[var(--color-text-primary)] font-medium leading-relaxed">{currentQ.question}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Answer area */}
      <div className="card p-6 space-y-4">

        {/* Mic permission / error */}
        {voiceError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{voiceError}</span>
          </div>
        )}

        {/* Live recording indicator — only when active */}
        <AnimatePresence>
          {isRecording && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <motion.div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"
                animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
              <LiveWaveform />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-red-400 font-semibold">Recording — speak now</p>
                {interimText && (
                  <p className="text-[10px] text-[var(--color-text-muted)] italic truncate">Hearing: "{interimText}"</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Row: label + mic/stop button */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">Your Answer</label>
          {!isCurrentSubmitted && (
            isRecording ? (
              <button onClick={stopRecording}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors shadow-lg shadow-red-500/30">
                <Square className="w-3.5 h-3.5 fill-white" /> Stop Recording
              </button>
            ) : (
              <button onClick={startRecording} disabled={!voiceSupported}
                title={voiceSupported ? 'Click to start voice input (Chrome required)' : 'Not supported — use Chrome'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] text-xs hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 transition-all disabled:opacity-40">
                <Mic className="w-3.5 h-3.5" />
                {voiceSupported ? 'Voice Input' : 'Chrome Only'}
              </button>
            )
          )}
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={e => {
              setCurrentAnswer(e.target.value)
              finalTextRef.current = e.target.value
            }}
            disabled={isCurrentSubmitted}
            placeholder={
              isRecording
                ? 'Listening... words appear here as you speak'
                : voiceSupported
                  ? 'Type your answer, or click Voice Input to speak...'
                  : 'Type your answer here...'
            }
            rows={6}
            className="w-full resize-none rounded-xl border bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-sm p-4 placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-60"
            style={{ borderColor: isRecording ? 'rgba(239,68,68,0.5)' : 'var(--color-border)' }}
          />
          {isRecording && (
            <motion.div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500"
              animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          )}
        </div>

        {/* Uncertain-phrases review panel */}
        {lowConfPhrases.length > 0 && !isCurrentSubmitted && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="p-3 rounded-xl border border-amber-500/25 bg-amber-500/8 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Review before submitting — Chrome was less certain about these phrases:
              </p>
              <button onClick={() => setLowConfPhrases([])}
                className="text-[10px] text-amber-400/60 hover:text-amber-400 transition-colors flex-shrink-0">
                Dismiss
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {lowConfPhrases.map((p, i) => (
                <span key={i}
                  className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-amber-500/12 border border-amber-500/30 text-amber-300">
                  "{p}"
                </span>
              ))}
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              The transcript above contains the exact recognized words — edit the textarea directly to correct anything.
            </p>
          </motion.div>
        )}

        {/* Footer: word count + action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${wordCount >= 950 ? 'text-red-400' : wordCount >= 800 ? 'text-yellow-400' : 'text-[var(--color-text-muted)]'}`}>
              {wordCount} / {MAX_WORDS} words
            </span>
            {isRecording && <span className="text-xs text-red-400 font-medium animate-pulse">● Recording</span>}
            {wordCount >= MAX_WORDS && <span className="text-xs text-red-400 font-semibold">Limit reached</span>}
          </div>
          <div className="flex items-center gap-3">
            {isCurrentSubmitted && !isLastQuestion && (
              <button onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all">
                Next Question <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {isCurrentSubmitted && isLastQuestion ? (
              <button onClick={handleEnd} disabled={ending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-60">
                <BarChart3 className="w-4 h-4" /> {ending ? 'Generating...' : 'Get My Report'}
              </button>
            ) : !isCurrentSubmitted ? (
              <button onClick={doSubmit} disabled={submitting || !answer.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-60">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Evaluating...</>
                  : <><Send className="w-4 h-4" /> Submit Answer</>}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* AI Feedback panel */}
      <AnimatePresence>
        {feedback && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="card p-5 space-y-4 border-l-4 border-blue-500">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">AI Evaluation</span>
              </div>
              {feedback.overall_score !== undefined && (
                <div className={`text-lg font-black px-3 py-1 rounded-lg ${
                  feedback.overall_score >= 75 ? 'bg-green-500/10 text-green-400'
                  : feedback.overall_score >= 50 ? 'bg-yellow-500/10 text-yellow-400'
                  : 'bg-red-500/10 text-red-400'}`}>
                  {Math.round(feedback.overall_score)}/100
                </div>
              )}
            </div>

            {/* 6 score bars */}
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: 'Technical Accuracy', value: feedback.technical_score ?? 0 },
                { label: 'Communication',      value: feedback.communication_score ?? 0 },
                { label: 'Completeness',       value: feedback.completeness_score ?? 0 },
                { label: 'Clarity',            value: feedback.clarity_score ?? 0 },
                { label: 'Confidence',         value: feedback.confidence_score ?? 0 },
                { label: 'Relevance',          value: feedback.relevance_score ?? 0 },
              ].map(s => (
                <ScoreBar key={s.label} label={s.label} value={s.value}
                  color={s.value >= 75 ? 'text-green-500' : s.value >= 50 ? 'text-yellow-500' : 'text-red-400'} />
              ))}
            </div>

            {feedback.feedback && (
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border)] pt-3">
                {feedback.feedback}
              </p>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              {feedback.strengths?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-green-400 mb-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> STRENGTHS
                  </p>
                  <ul className="space-y-1">
                    {feedback.strengths.slice(0, 3).map((s: string, i: number) => (
                      <li key={i} className="text-xs text-[var(--color-text-secondary)] flex items-start gap-1.5">
                        <span className="text-green-500 flex-shrink-0">+</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.improvements?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-orange-400 mb-1.5 flex items-center gap-1">
                    <Target className="w-3 h-3" /> IMPROVE
                  </p>
                  <ul className="space-y-1">
                    {feedback.improvements.slice(0, 3).map((s: string, i: number) => (
                      <li key={i} className="text-xs text-[var(--color-text-secondary)] flex items-start gap-1.5">
                        <span className="text-orange-400 flex-shrink-0">!</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {(feedback.keywords_used?.length > 0 || feedback.keywords_missed?.length > 0) && (
              <div className="border-t border-[var(--color-border)] pt-3">
                <p className="text-[10px] font-semibold text-[var(--color-text-muted)] mb-2 flex items-center gap-1">
                  <Key className="w-3 h-3" /> KEYWORDS
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {feedback.keywords_used?.slice(0, 5).map((k: string, i: number) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">&#10003; {k}</span>
                  ))}
                  {feedback.keywords_missed?.slice(0, 4).map((k: string, i: number) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">&#10007; {k}</span>
                  ))}
                </div>
              </div>
            )}

            {feedback.model_answer && (
              <div className="border-t border-[var(--color-border)] pt-3">
                <button onClick={() => setShowModelAnswer(!showModelAnswer)}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  <Lightbulb className="w-3.5 h-3.5" />
                  {showModelAnswer ? 'Hide model answer' : 'Show model answer'}
                </button>
                <AnimatePresence>
                  {showModelAnswer && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mt-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{feedback.model_answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
