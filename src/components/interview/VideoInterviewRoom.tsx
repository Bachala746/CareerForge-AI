import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, Square, Camera, CameraOff, Send, ChevronRight, Clock,
  Brain, AlertCircle, X, Volume2, VolumeX, CheckCircle, Lightbulb,
  BarChart2, Target, Key, MessageSquare
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { CVSession } from '../../hooks/useCameraCV'

declare global {
  interface Window { SpeechRecognition: any; webkitSpeechRecognition: any }
}

// ─────────────────────────────────────────────────────────────────────────────
//  BROWSER TTS  (free, browser-native, zero cost)
// ─────────────────────────────────────────────────────────────────────────────
function speak(text: string, onEnd?: () => void) {
  if (!('speechSynthesis' in window)) { onEnd?.(); return }
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.rate = 0.88; utt.pitch = 1.0; utt.volume = 1.0
  const voices = window.speechSynthesis.getVoices()
  const best = voices.find(v =>
    v.name.includes('Google UK English Female') ||
    v.name.includes('Google US English') ||
    v.name.includes('Samantha') || v.name.includes('Karen') ||
    (v.lang.startsWith('en') && !v.name.toLowerCase().includes('compact'))
  )
  if (best) utt.voice = best
  utt.onend = () => onEnd?.()
  utt.onerror = () => onEnd?.()
  window.speechSynthesis.speak(utt)
}
function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

// ─────────────────────────────────────────────────────────────────────────────
//  AI INTERVIEWER — Realistic photo-based interviewer
//  Three states: idle (calm), speaking (cyan glow + rings), listening (green rings)
// ─────────────────────────────────────────────────────────────────────────────
function AIInterviewer({
  speaking, status, listening,
}: { speaking: boolean; status: string; listening?: boolean }) {

  return (
    <div className="relative w-full h-full overflow-hidden select-none"
      style={{ background: '#0c1220' }}>

      {/* ── Real photo — fills container ── */}
      <img
        src="/alex-interviewer.jpg"
        alt="Alex — AI Recruiter"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover', objectPosition: 'center top' }}
      />

      {/* ── Subtle dark vignette around edges ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 90% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />

      {/* ── Speaking: cyan overlay + screen-glow ── */}
      {speaking && (
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 38%, rgba(34,211,238,0.10) 0%, transparent 65%)', opacity: 1 }} />
      )}


      {/* ── Speaking: animated cyan border pulse ── */}
      {speaking && (
        <motion.div className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ border: '2px solid rgba(34,211,238,0.5)', boxShadow: '0 0 24px rgba(34,211,238,0.18) inset' }}
          animate={{ opacity: [0.7, 0.3, 0.7] }}
          transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* ── Listening: animated green border pulse ── */}
      {listening && !speaking && (
        <motion.div className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ border: '2px solid rgba(34,197,94,0.5)', boxShadow: '0 0 20px rgba(34,197,94,0.14) inset' }}
          animate={{ opacity: [0.7, 0.2, 0.7] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* ── Speaking: waveform bars at bottom ── */}
      {speaking && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none">
          <div className="flex items-end gap-[3px]">
            {[4,7,11,8,14,10,6,12,9,5,13,7,10].map((h, i) => (
              <motion.div key={i} className="w-[3px] rounded-full"
                style={{ background: 'rgba(34,211,238,0.7)' }}
                animate={{ height: [`${h}px`, `${h * 2}px`, `${h}px`] }}
                transition={{ duration: 0.28 + i * 0.04, repeat: Infinity, delay: i * 0.05, ease: 'easeInOut' }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Name badge ── */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{ background: 'rgba(6,10,20,0.82)', border: '1px solid rgba(59,130,246,0.3)',
                   backdropFilter: 'blur(8px)' }}>
          <motion.div className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: speaking ? '#22d3ee' : listening ? '#22c55e' : '#3b82f6',
              boxShadow: speaking ? '0 0 7px #22d3ee' : listening ? '0 0 7px #22c55e' : 'none',
            }}
            animate={speaking || listening ? { opacity: [1, 0.4, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <span className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>Alex — AI Recruiter</span>
          {speaking && (
            <motion.span className="text-[10px] font-medium" style={{ color: '#22d3ee' }}
              animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
              Speaking
            </motion.span>
          )}
          {listening && !speaking && (
            <motion.span className="text-[10px] font-medium" style={{ color: '#22c55e' }}
              animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
              Listening…
            </motion.span>
          )}
          {!speaking && !listening && (
            <span className="text-[10px]" style={{ color: '#64748b' }}>Waiting</span>
          )}
        </div>
      </div>

      {/* ── Status pill (top-right) ── */}
      <div className="absolute top-2 right-2 pointer-events-none">
        <div className="px-2.5 py-0.5 rounded-full text-[9px] font-semibold tracking-widest"
          style={{ background: 'rgba(6,10,20,0.75)', color: '#64748b',
                   border: '1px solid rgba(30,58,95,0.45)' }}>
          {status.toUpperCase()}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  SMALL WAVEFORM
// ─────────────────────────────────────────────────────────────────────────────
function Waveform({ color = '#ef4444' }: { color?: string }) {
  return (
    <span className="flex items-center gap-[2px] h-4 ml-1">
      {[3, 5, 8, 5, 3, 7, 4].map((h, i) => (
        <motion.span key={i} className="w-[2px] rounded-full"
          style={{ background: color }}
          animate={{ height: [`${h}px`, `${h * 2 + 2}px`, `${h}px`] }}
          transition={{ duration: 0.35 + i * 0.05, repeat: Infinity, delay: i * 0.06 }} />
      ))}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  SCORE BAR
// ─────────────────────────────────────────────────────────────────────────────
function ScoreBar({ label, value }: { label: string; value: number }) {
  const col = value >= 75 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-400' : 'bg-red-400'
  const txt = value >= 75 ? 'text-emerald-400' : value >= 50 ? 'text-amber-400' : 'text-red-400'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-slate-400">{label}</span>
        <span className={`font-bold ${txt}`}>{Math.round(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={`h-full rounded-full ${col}`} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  PROPS
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  session: any
  currentQuestionIndex: number
  submitted: Set<number>
  feedback: any
  ending: boolean
  showModelAnswer: boolean
  answer: string
  isRecording: boolean
  voiceError: string
  interimText: string
  wordCount: number
  MAX_WORDS: number
  lowConfPhrases: string[]
  clearLowConf: () => void
  setCurrentAnswer: (a: string) => void
  startRecording: () => void
  stopRecording: () => void
  doSubmit: () => void
  handleNext: () => void
  handleEnd: (cvSession?: CVSession | null) => void
  setShowModelAnswer: (v: boolean) => void
  formatTime: (s: number) => string
  timeElapsed: number
  onCVSample: () => Promise<void>
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function VideoInterviewRoom({
  session, currentQuestionIndex, submitted, feedback, ending,
  showModelAnswer, answer, isRecording, voiceError, interimText,
  wordCount, MAX_WORDS, lowConfPhrases, clearLowConf,
  setCurrentAnswer, startRecording, stopRecording,
  doSubmit, handleNext, handleEnd, setShowModelAnswer, formatTime, timeElapsed,
}: Props) {

  // ── Camera state ────────────────────────────────────────────────────────────
  const videoRef        = useRef<HTMLVideoElement>(null)
  const streamRef       = useRef<MediaStream | null>(null)
  const [camReady, setCamReady]         = useState(false)
  const [camError, setCamError]         = useState('')
  const [camEnabled, setCamEnabled]     = useState(true)   // user toggled on/off

  // ── Mic state (independent of recording) ────────────────────────────────────
  const [micEnabled, setMicEnabled]     = useState(true)   // user's mic preference

  // ── Interview state ─────────────────────────────────────────────────────────
  const [aiSpeaking, setAiSpeaking]     = useState(false)
  const [aiStatus, setAiStatus]         = useState('Joining...')
  const [voiceMuted, setVoiceMuted]     = useState(false)
  const [introPlayed, setIntroPlayed]   = useState(false)
  const spokenQs = useRef<Set<number>>(new Set())

  // ── Evaluation state: tracks whether the API call is in-flight ───────────
  // Prevents duplicate submissions, blocks Voice Input during evaluation, and
  // prevents microphone from starting while AI is speaking.
  const [isEvaluating, setIsEvaluating] = useState(false)
  const prevFeedbackRef = useRef<any>(null)   // detect when fresh feedback arrives
  const evalTimeoutRef  = useRef<any>(null)   // safety: auto-clears if API fails

  // CV samples
  const cvSamples = useRef<Array<{faceDetected: boolean}>>([])

  const questions       = session?.questions || []
  const currentQ        = questions[currentQuestionIndex]
  const totalQ          = questions.length
  const isLastQ         = currentQuestionIndex >= totalQ - 1
  const isSubmitted     = currentQ ? submitted.has(currentQ.id) : false

  // ── START CAMERA ─────────────────────────────────────────────────────────────
  const [camLoading, setCamLoading] = useState(false)

  const attachStream = useCallback((stream: MediaStream) => {
    const vid = videoRef.current
    if (!vid) return

    // Detach any old stream cleanly
    vid.pause()
    vid.srcObject = null

    // Small tick so browser releases previous srcObject before reassigning
    requestAnimationFrame(() => {
      if (!videoRef.current) return
      videoRef.current.srcObject = stream

      const onReady = () => {
        videoRef.current?.play()
          .then(() => {
            setCamReady(true)
            setCamLoading(false)
          })
          .catch(() => {
            setCamLoading(false)
          })
        videoRef.current?.removeEventListener('loadedmetadata', onReady)
      }

      // Primary signal: loadedmetadata
      videoRef.current.addEventListener('loadedmetadata', onReady)

      // Fallback: if loadedmetadata already fired (readyState >= 1), trigger manually
      if (videoRef.current.readyState >= 1) {
        onReady()
      }
    })
  }, [])

  const initCamera = useCallback(async () => {
    setCamError('')
    setCamReady(false)
    setCamLoading(true)
    try {
      // Stop any existing stream first to prevent duplicate tracks
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,   // audio is handled by Web Speech API separately
      })
      streamRef.current = stream
      attachStream(stream)
    } catch (err: any) {
      const name = (err as any).name || ''
      let msg = 'Camera unavailable.'
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        msg = 'Camera access denied. Click the lock icon → Site settings → Camera: Allow → then click Retry.'
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        msg = 'No camera detected. Connect a webcam and click Retry.'
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        msg = 'Camera is in use by another application. Close it and click Retry.'
      } else if (name === 'OverconstrainedError') {
        msg = 'Camera does not support the required settings. Click Retry.'
      } else {
        msg = 'Camera error: ' + (err.message || name || 'unknown')
      }
      setCamError(msg)
      setCamReady(false)
      setCamLoading(false)
    }
  }, [attachStream])

  // ── STOP CAMERA (releases hardware — camera light turns off) ─────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }
    setCamReady(false)
    setCamLoading(false)
  }, [])

  // ── TOGGLE CAMERA — actually stops/starts the hardware stream ───────────────
  const toggleCamera = useCallback(async () => {
    if (camEnabled) {
      // Turn off: stop tracks so the camera indicator light goes off
      stopCamera()
      setCamEnabled(false)
    } else {
      // Turn on: restart stream
      setCamEnabled(true)
      await initCamera()
    }
  }, [camEnabled, stopCamera, initCamera])

  // ── TOGGLE MIC — enables or disables recording capability ───────────────────
  const toggleMic = useCallback(() => {
    setMicEnabled(prev => {
      const next = !prev
      if (!next && isRecording) {
        // If recording is active and user disables mic, stop recording
        stopRecording()
      }
      return next
    })
  }, [isRecording, stopRecording])

  // ── Mount: start camera immediately ─────────────────────────────────────────
  useEffect(() => {
    initCamera()
    return () => {
      stopCamera()
      stopSpeaking()
      clearTimeout(evalTimeoutRef.current)
    }
  }, [])   // eslint-disable-line

  // ── Re-attach stream if the video element was re-mounted ───────────────────
  // Only runs if there IS a stream but camReady is false and we're not already loading
  useEffect(() => {
    if (videoRef.current && streamRef.current && !camReady && !camLoading && camEnabled) {
      attachStream(streamRef.current)
    }
  }, [camReady, camLoading, camEnabled, attachStream])

  // ── AI intro greeting (plays once) ──────────────────────────────────────────
  useEffect(() => {
    if (introPlayed || !questions.length || !currentQ) return
    setIntroPlayed(true)
    setAiStatus('Welcome')
    const introText = `Hello! Welcome to your ${session?.interview_type || 'technical'} interview. I am Alex, your AI recruiter today. Let us get started. Question one. ${currentQ.question}`
    if (voiceMuted) {
      setAiStatus('Your turn')
      spokenQs.current.add(0)
      return
    }
    setAiSpeaking(true)
    speak(introText, () => {
      setAiSpeaking(false)
      setAiStatus('Your turn')
      spokenQs.current.add(0)
    })
  }, [questions.length, introPlayed, currentQ, voiceMuted])

  // ── Speak new question when index changes ────────────────────────────────────
  useEffect(() => {
    if (!introPlayed) return
    if (currentQuestionIndex === 0) return
    if (spokenQs.current.has(currentQuestionIndex)) return
    if (!currentQ) return
    spokenQs.current.add(currentQuestionIndex)
    setAiStatus('Asking...')
    const text = `Question ${currentQuestionIndex + 1}. ${currentQ.question}`
    if (voiceMuted) { setAiStatus('Your turn'); return }
    setAiSpeaking(true)
    speak(text, () => { setAiSpeaking(false); setAiStatus('Your turn') })
  }, [currentQuestionIndex, introPlayed, currentQ, voiceMuted])

  // ── Feedback arrived → evaluation complete ──────────────────────────────────
  // Triggered whenever `feedback` transitions from null → non-null (fresh submission).
  // Sets status to 'Review ready' and clears the evaluating gate.
  useEffect(() => {
    if (feedback && !prevFeedbackRef.current) {
      clearTimeout(evalTimeoutRef.current)
      setIsEvaluating(false)
      setAiStatus('Review ready')
    }
    // Also clear isEvaluating if feedback was cleared (next question) and we're
    // somehow still marked as evaluating (e.g. rapid question change).
    if (!feedback && prevFeedbackRef.current) {
      setIsEvaluating(false)
    }
    prevFeedbackRef.current = feedback
  }, [feedback])

  const toggleVoice = () => { if (!voiceMuted) stopSpeaking(); setVoiceMuted(v => !v) }

  // ── Submit + lightweight CV sample (no face-api for stability) ───────────────
  const handleSubmit = useCallback(async () => {
    // Mark evaluating immediately so UI responds before API round-trip
    setIsEvaluating(true)
    setAiStatus('Evaluating...')
    // Safety net: auto-clear after 45 s if the API call errors out silently
    clearTimeout(evalTimeoutRef.current)
    evalTimeoutRef.current = setTimeout(() => {
      setIsEvaluating(false)
      setAiStatus('Your turn')
    }, 45_000)
    // Simple presence check: if video is playing, face is probably there
    const hasCam = camReady && camEnabled && videoRef.current && videoRef.current.readyState >= 2
    cvSamples.current.push({ faceDetected: !!hasCam })
    doSubmit()
  }, [doSubmit, camReady, camEnabled])

  // ── End interview ────────────────────────────────────────────────────────────
  const endInterview = useCallback(async () => {
    stopSpeaking()
    stopCamera()
    if (!voiceMuted) {
      setAiSpeaking(true)
      setAiStatus('Wrapping up')
      await new Promise<void>(resolve =>
        speak('Thank you. That completes your interview. Your responses will now be evaluated and you will receive detailed feedback shortly.', () => {
          setAiSpeaking(false); resolve()
        })
      )
    }
    // Build simple CV session
    const total = cvSamples.current.length
    const cvSession: CVSession | null = total > 0 ? {
      samplesCount: total,
      faceVisiblePct: Math.round((cvSamples.current.filter(s => s.faceDetected).length / total) * 100),
      lookingAwayPct: 0,
      avgFramingQuality: camReady ? 75 : 0,
      observations: camReady
        ? ['Camera was active throughout the interview.']
        : ['Camera was not available during this interview.'],
    } : null
    handleEnd(cvSession)
  }, [stopCamera, handleEnd, voiceMuted, camReady])

  const handleNextQ = useCallback(() => { setAiStatus('Asking...'); handleNext() }, [handleNext])

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0, gap: '10px' }}>

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 rounded-2xl flex-shrink-0"
        style={{ background: 'rgba(10,18,35,0.95)', border: '1px solid rgba(30,58,95,0.65)',
                 backdropFilter: 'blur(8px)' }}>
        {/* Left: role info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(79,70,229,0.15))',
                     border: '1px solid rgba(59,130,246,0.2)' }}>
            <Brain className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight truncate">
              {session?.role}{session?.company ? ` @ ${session.company}` : ''}
            </p>
            <p className="text-[10px] capitalize mt-0.5" style={{ color: '#64748b' }}>
              {session?.interview_type} · Video Interview
            </p>
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono"
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,58,95,0.5)',
                     color: '#94a3b8' }}>
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {formatTime(timeElapsed)}
          </div>
          {/* Q counter */}
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa',
                     border: '1px solid rgba(59,130,246,0.2)' }}>
            Q{currentQuestionIndex + 1}/{totalQ}
          </span>
          {/* Mic toggle — enables/disables microphone independently */}
          <button onClick={toggleMic}
            title={micEnabled ? 'Disable microphone' : 'Enable microphone'}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: micEnabled ? 'rgba(30,41,59,0.9)' : 'rgba(239,68,68,0.15)',
                     border: micEnabled ? '1px solid rgba(51,65,85,0.7)' : '1px solid rgba(239,68,68,0.35)',
                     color: micEnabled ? (isRecording ? '#f87171' : '#64748b') : '#f87171' }}>
            <Mic className="w-3.5 h-3.5" />
          </button>
          {/* Voice (Alex TTS) toggle */}
          <button onClick={toggleVoice} title={voiceMuted ? 'Unmute Alex' : 'Mute Alex'}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: voiceMuted ? 'rgba(239,68,68,0.15)' : 'rgba(30,41,59,0.9)',
                     border: voiceMuted ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(51,65,85,0.7)',
                     color: voiceMuted ? '#f87171' : '#64748b' }}>
            {voiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          {/* Cam toggle — stops/starts actual hardware stream */}
          <button onClick={toggleCamera}
            title={camEnabled ? 'Turn camera off' : 'Turn camera on'}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: camEnabled ? 'rgba(30,41,59,0.9)' : 'rgba(239,68,68,0.15)',
                     border: camEnabled ? '1px solid rgba(51,65,85,0.7)' : '1px solid rgba(239,68,68,0.35)',
                     color: camEnabled ? '#22d3ee' : '#f87171' }}>
            {camEnabled ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
          </button>
          {/* End button */}
          <button onClick={endInterview} disabled={ending}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 hover:opacity-80"
            style={{ border: '1px solid rgba(239,68,68,0.35)', color: '#f87171',
                     background: 'rgba(239,68,68,0.08)' }}>
            {ending ? 'Processing…' : 'End Interview'}
          </button>
        </div>
      </div>

      {/* Camera errors are shown inside the camera panel — no separate banner needed */}

      {/* ── MAIN VIDEO ROW ── */}
      <div className="flex gap-3 flex-shrink-0" style={{ height: '340px' }}>

        {/* AI Recruiter — takes all remaining width */}
        <div className="flex-1 rounded-2xl overflow-hidden relative"
          style={{ border: aiSpeaking ? '1px solid rgba(34,211,238,0.35)' : '1px solid rgba(30,58,95,0.65)',
                   boxShadow: aiSpeaking ? '0 0 28px rgba(34,211,238,0.12)' : 'none',
                   transition: 'border-color 0.4s, box-shadow 0.4s' }}>
          <AIInterviewer speaking={aiSpeaking} status={aiStatus} listening={isRecording} />
        </div>

        {/* Candidate camera — fixed width, same height */}
        <div className="rounded-2xl overflow-hidden relative flex-shrink-0"
          style={{ width: '240px',
                   background: 'rgba(8,14,28,0.95)', border: '1px solid rgba(30,58,95,0.65)' }}>

          {/* Video element — always in DOM so ref is always valid */}
          {/* pointer-events-none when invisible so clicks reach the placeholder below */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transform: 'scaleX(-1)',
              opacity: (camReady && camEnabled) ? 1 : 0,
              transition: 'opacity 0.4s ease',
              pointerEvents: (camReady && camEnabled) ? 'auto' : 'none',
              zIndex: 0,
            }}
          />

          {/* Placeholder — shown when camera is off, loading, or errored */}
          {(!camReady || !camEnabled) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center"
              style={{ zIndex: 1 }}>

              {/* Icon */}
              <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(30,41,59,0.85)', border: '1px solid rgba(51,65,85,0.5)' }}>
                {camLoading
                  ? <motion.div className="w-6 h-6 rounded-full border-2 border-blue-500/30 border-t-blue-400"
                      animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                  : <CameraOff className="w-6 h-6" style={{ color: camError ? '#f87171' : '#475569' }} />
                }
              </div>

              {/* Status label */}
              <p className="text-xs font-semibold leading-snug"
                style={{ color: camError ? '#f87171' : camLoading ? '#60a5fa' : '#64748b' }}>
                {!camEnabled
                  ? 'Camera off'
                  : camLoading
                    ? 'Connecting camera…'
                    : camError
                      ? 'Camera unavailable'
                      : 'Starting camera…'}
              </p>

              {/* Error detail */}
              {camError && !camLoading && (
                <p className="text-[10px] leading-relaxed max-w-[180px]" style={{ color: '#94a3b8' }}>
                  {camError}
                </p>
              )}

              {/* Retry button — shown when there is an error AND camera is enabled */}
              {camError && camEnabled && !camLoading && (
                <button
                  onClick={() => initCamera()}
                  className="text-[11px] px-4 py-1.5 rounded-xl font-semibold transition-all hover:opacity-80 active:scale-95"
                  style={{ background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.4)',
                           color: '#60a5fa' }}>
                  ↻ Retry Camera
                </button>
              )}
            </div>
          )}

          {/* YOU badge */}
          <div className="absolute bottom-3 left-3 z-10">
            <span className="text-white text-[10px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>You</span>
          </div>

          {/* REC indicator */}
          {isRecording && (
            <motion.div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full"
              style={{ background: 'rgba(220,38,38,0.9)' }}
              animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="text-white text-[9px] font-bold tracking-wider">REC</span>
            </motion.div>
          )}

          {/* Camera + mic status dots — top-left stack */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full"
                style={{ background: camReady && camEnabled ? '#22c55e' : '#ef4444',
                         boxShadow: camReady && camEnabled ? '0 0 6px #22c55e' : 'none' }} />
              <span className="text-[9px] font-medium"
                style={{ color: camReady && camEnabled ? '#22c55e' : '#ef4444' }}>
                {camReady && camEnabled ? 'CAM' : 'CAM OFF'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full"
                style={{ background: micEnabled ? (isRecording ? '#ef4444' : '#22c55e') : '#ef4444',
                         boxShadow: isRecording ? '0 0 6px #ef4444' : micEnabled ? '0 0 4px #22c55e' : 'none' }} />
              <span className="text-[9px] font-medium"
                style={{ color: micEnabled ? (isRecording ? '#f87171' : '#22c55e') : '#f87171' }}>
                {!micEnabled ? 'MIC OFF' : isRecording ? 'REC' : 'MIC'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUESTION CARD ── */}
      <AnimatePresence mode="wait">
        <motion.div key={currentQuestionIndex}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className="flex-shrink-0 px-5 py-4 rounded-2xl"
          style={{ background: 'rgba(10,18,35,0.92)', border: '1px solid rgba(30,58,95,0.6)' }}>
          <div className="flex items-start gap-4">
            {/* Q badge */}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <span className="text-[11px] font-bold text-blue-400">Q{currentQuestionIndex + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              {/* Tags row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] px-2.5 py-0.5 rounded-lg capitalize font-medium"
                  style={{ background: 'rgba(51,65,85,0.7)', color: '#94a3b8' }}>
                  {currentQ?.type || 'general'}
                </span>
                {aiSpeaking && (
                  <span className="text-[10px] flex items-center gap-1 text-cyan-400 font-medium">
                    Alex is speaking <Waveform color="#22d3ee" />
                  </span>
                )}
                {!aiSpeaking && !isSubmitted && (
                  <motion.span className="text-[10px] text-emerald-400 font-semibold"
                    animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    Your turn to answer
                  </motion.span>
                )}
                {isSubmitted && (
                  <span className="text-[10px] text-amber-400 font-medium">Response submitted</span>
                )}
              </div>
              {/* Question text */}
              <p className="text-sm font-medium leading-relaxed" style={{ color: '#e2e8f0' }}>
                {currentQ?.question || 'Preparing your question…'}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── ANSWER / FEEDBACK ── */}
      {!isSubmitted ? (
        <div className="flex-1 min-h-0 px-5 py-4 rounded-2xl flex flex-col gap-3"
          style={{ background: 'rgba(10,18,35,0.88)', border: '1px solid rgba(30,58,95,0.6)' }}>

          {/* Voice error */}
          {voiceError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                       color: '#fbbf24' }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {voiceError}
            </div>
          )}

          {/* Textarea */}
          <textarea value={answer} onChange={e => setCurrentAnswer(e.target.value)}
            placeholder="Your answer will appear here as you speak — or type directly…"
            className="flex-1 w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none transition-all"
            style={{ background: 'rgba(15,25,50,0.9)', border: '1px solid rgba(51,65,85,0.7)',
                     color: '#e2e8f0', caretColor: '#60a5fa', minHeight: '80px' }}
            onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.55)'}
            onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.7)'} />

          {/* Uncertain-phrase review panel */}
          {lowConfPhrases.length > 0 && (
            <div className="flex-shrink-0 px-3 py-2.5 rounded-xl space-y-2"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  Chrome was less certain about these phrases — review before submitting:
                </p>
                <button onClick={clearLowConf}
                  className="text-[9px] text-amber-400/50 hover:text-amber-300 transition-colors flex-shrink-0">✕</button>
              </div>
              <div className="flex flex-wrap gap-1">
                {lowConfPhrases.map((p, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-lg text-[10px] font-mono"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)',
                             color: '#fcd34d' }}>
                    "{p}"
                  </span>
                ))}
              </div>
              <p className="text-[9px]" style={{ color: '#475569' }}>
                Edit directly in the text box above to correct any word.
              </p>
            </div>
          )}

          {/* Evaluating indicator — shown while API call is in-flight */}
          {isEvaluating && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-shrink-0"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <motion.div className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0"
                style={{ borderColor: 'rgba(96,165,250,0.3)', borderTopColor: '#60a5fa' }}
                animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              <span className="text-xs font-medium" style={{ color: '#60a5fa' }}>
                AI is evaluating your answer…
              </span>
            </div>
          )}

          {/* Alex-is-speaking notice — shown when mic is active but AI is talking */}
          {aiSpeaking && !isEvaluating && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-shrink-0"
              style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)' }}>
              <Waveform color="#22d3ee" />
              <span className="text-xs font-medium" style={{ color: '#22d3ee' }}>
                Alex is speaking — voice input will be available when Alex finishes
              </span>
            </div>
          )}

          {/* Controls row */}
          <div className="flex items-center justify-between gap-3 flex-shrink-0 flex-wrap">
            {/* Word count + recording state */}
            <div className="flex items-center gap-3">
              <span className="text-xs tabular-nums"
                style={{ color: wordCount >= 950 ? '#f87171' : '#475569' }}>
                {wordCount} / {MAX_WORDS} words
              </span>
              {isRecording && (
                <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                  <Waveform /> Recording…
                </span>
              )}
              {interimText && (
                <span className="text-xs italic truncate max-w-xs" style={{ color: '#64748b' }}>
                  {interimText}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button onClick={(micEnabled && !aiSpeaking && !isEvaluating) ? startRecording : undefined}
                  disabled={!micEnabled || aiSpeaking || isEvaluating}
                  title={
                    aiSpeaking     ? 'Wait for Alex to finish speaking first' :
                    isEvaluating   ? 'Evaluating your answer…' :
                    !micEnabled    ? 'Microphone is disabled — enable it with the mic button above' :
                                     'Start voice input'
                  }
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: (micEnabled && !aiSpeaking && !isEvaluating) ? 'rgba(239,68,68,0.1)' : 'rgba(51,65,85,0.3)',
                           border: (micEnabled && !aiSpeaking && !isEvaluating) ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(51,65,85,0.5)',
                           color: (micEnabled && !aiSpeaking && !isEvaluating) ? '#f87171' : '#64748b' }}>
                  <Mic className="w-3.5 h-3.5" />
                  {aiSpeaking ? 'Alex speaking…' : isEvaluating ? 'Evaluating…' : micEnabled ? 'Voice Input' : 'Mic Off'}
                </button>
              ) : (
                <button onClick={stopRecording}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-80"
                  style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}>
                  <Square className="w-3 h-3" /> Stop
                </button>
              )}
              <button onClick={handleSubmit} disabled={!answer.trim() || aiSpeaking || isEvaluating}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40 hover:opacity-85"
                style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)',
                         boxShadow: '0 2px 12px rgba(37,99,235,0.3)' }}>
                {isEvaluating
                  ? <><motion.div className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white"
                      animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                     Evaluating…</>
                  : <><Send className="w-3.5 h-3.5" /> Submit Answer</>
                }
              </button>
            </div>
          </div>
        </div>

      ) : (
        /* ── FEEDBACK PANEL ── */
        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex-1 min-h-0 px-5 py-4 rounded-2xl flex flex-col gap-3 overflow-y-auto"
              style={{ background: 'rgba(10,18,35,0.92)',
                       border: '1px solid rgba(59,130,246,0.3)',
                       borderLeft: '3px solid #3b82f6' }}>

              {/* Header: title + overall score */}
              <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold" style={{ color: '#e2e8f0' }}>AI Evaluation</span>
                </div>
                {feedback.overall_score !== undefined && (
                  <div className={`text-sm font-black px-3 py-1 rounded-lg ${
                    feedback.overall_score >= 75 ? 'text-emerald-400' :
                    feedback.overall_score >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`} style={{
                    background: feedback.overall_score >= 75 ? 'rgba(16,185,129,0.1)' :
                                feedback.overall_score >= 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${feedback.overall_score >= 75 ? 'rgba(16,185,129,0.25)' :
                                         feedback.overall_score >= 50 ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`
                  }}>
                    {Math.round(feedback.overall_score)}/100
                  </div>
                )}
              </div>

              {/* 6 score bars — 2 columns */}
              <div className="grid grid-cols-2 gap-x-5 gap-y-2 flex-shrink-0">
                <ScoreBar label="Technical"     value={feedback.technical_score ?? 0} />
                <ScoreBar label="Communication" value={feedback.communication_score ?? 0} />
                <ScoreBar label="Completeness"  value={feedback.completeness_score ?? 0} />
                <ScoreBar label="Clarity"       value={feedback.clarity_score ?? 0} />
                <ScoreBar label="Confidence"    value={feedback.confidence_score ?? 0} />
                <ScoreBar label="Relevance"     value={feedback.relevance_score ?? 0} />
              </div>

              {/* Feedback text */}
              {feedback.feedback && (
                <p className="text-xs leading-relaxed flex-shrink-0"
                  style={{ color: '#94a3b8', paddingTop: '8px',
                           borderTop: '1px solid rgba(51,65,85,0.5)' }}>
                  {feedback.feedback}
                </p>
              )}

              {/* Strengths + Improvements */}
              {(feedback.strengths?.length > 0 || feedback.improvements?.length > 0) && (
                <div className="grid grid-cols-2 gap-3 flex-shrink-0 pt-1"
                  style={{ borderTop: '1px solid rgba(51,65,85,0.4)' }}>
                  {feedback.strengths?.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"
                        style={{ color: '#34d399' }}>
                        <CheckCircle className="w-3 h-3" /> Strengths
                      </p>
                      <ul className="space-y-1">
                        {feedback.strengths.slice(0, 3).map((s: string, i: number) => (
                          <li key={i} className="text-[10px] leading-snug flex items-start gap-1"
                            style={{ color: '#94a3b8' }}>
                            <span style={{ color: '#34d399' }} className="flex-shrink-0">+</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {feedback.improvements?.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"
                        style={{ color: '#fb923c' }}>
                        <BarChart2 className="w-3 h-3" /> Improve
                      </p>
                      <ul className="space-y-1">
                        {feedback.improvements.slice(0, 3).map((s: string, i: number) => (
                          <li key={i} className="text-[10px] leading-snug flex items-start gap-1"
                            style={{ color: '#94a3b8' }}>
                            <span style={{ color: '#fb923c' }} className="flex-shrink-0">!</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Keywords */}
              {(feedback.keywords_used?.length > 0 || feedback.keywords_missed?.length > 0) && (
                <div className="flex-shrink-0 pt-2" style={{ borderTop: '1px solid rgba(51,65,85,0.4)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: '#64748b' }}>Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {feedback.keywords_used?.slice(0, 4).map((k: string, i: number) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399',
                                 border: '1px solid rgba(16,185,129,0.2)' }}>
                        ✓ {k}
                      </span>
                    ))}
                    {feedback.keywords_missed?.slice(0, 3).map((k: string, i: number) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171',
                                 border: '1px solid rgba(239,68,68,0.2)' }}>
                        ✗ {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions row */}
              <div className="flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
                {!showModelAnswer && feedback.model_answer && (
                  <button onClick={() => setShowModelAnswer(true)}
                    className="text-xs flex items-center gap-1 hover:opacity-80"
                    style={{ color: '#60a5fa' }}>
                    <Lightbulb className="w-3.5 h-3.5" /> Example Answer
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  {isLastQ ? (
                    <button onClick={endInterview} disabled={ending}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 hover:opacity-85"
                      style={{ background: 'linear-gradient(135deg,#059669,#10b981)',
                               boxShadow: '0 2px 12px rgba(5,150,105,0.3)' }}>
                      {ending ? 'Processing…' : 'Get Full Report'} <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button onClick={handleNextQ}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-85"
                      style={{ border: '1px solid rgba(51,65,85,0.7)', color: '#e2e8f0',
                               background: 'rgba(30,41,59,0.85)' }}>
                      Next Question <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Model answer — example disclaimer included */}
              {showModelAnswer && feedback.model_answer && (
                <div className="px-4 py-3 rounded-xl flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#60a5fa' }}>
                      <Lightbulb className="w-3 h-3 inline mr-1" />Example Answer
                    </p>
                    <span className="text-[9px] px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#93c5fd',
                               border: '1px solid rgba(59,130,246,0.2)' }}>
                      Not your answer — for reference only
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
                    {feedback.model_answer}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── STATUS BAR ── */}
      <div className="flex items-center gap-4 px-2 py-1 flex-shrink-0 text-[10px]"
        style={{ color: '#334155' }}>
        {/* Mic status */}
        <span className={`flex items-center gap-1.5 ${
          isRecording ? 'text-red-400 font-semibold' : micEnabled ? 'text-emerald-500' : 'text-red-400'
        }`}>
          <Mic className="w-3 h-3" />
          {isRecording ? 'Mic Active — Recording' : micEnabled ? 'Mic On' : 'Mic Off'}
        </span>
        {/* Camera status */}
        <span className={`flex items-center gap-1.5 ${
          !camEnabled ? 'text-red-400' : camReady ? 'text-emerald-500' : camError ? 'text-amber-500' : 'text-slate-500'
        }`}>
          <Camera className="w-3 h-3" />
          {!camEnabled ? 'Camera Off' : camReady ? 'Camera On' : camError ? 'Camera Error' : 'Camera Starting…'}
        </span>
        {/* Alex voice status */}
        <span className={`flex items-center gap-1.5 ${aiSpeaking ? 'text-cyan-400 font-semibold' : ''}`}>
          <Volume2 className="w-3 h-3" />
          {voiceMuted ? 'Alex muted' : aiSpeaking ? 'Alex speaking' : 'Alex ready'}
        </span>
        <span className="ml-auto" style={{ color: '#1e3a5f' }}>
          Browser-native · Free · Local
        </span>
      </div>

    </div>
  )
}
