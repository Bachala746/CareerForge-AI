import { create } from 'zustand'

interface Question {
  id: number
  question: string
  type: string
  order: number
  has_answer?: boolean
}

interface InterviewSession {
  session_id: number
  company: string
  role: string
  interview_type: string
  personality: string
  interview_mode: 'audio' | 'audio_video'
  status: string
  questions: Question[]
}

interface InterviewState {
  session: InterviewSession | null
  currentQuestionIndex: number
  isRecording: boolean
  isSpeaking: boolean
  timeElapsed: number
  answers: Record<number, string>
  evaluations: Record<number, any>
  interviewMode: 'audio' | 'audio_video'

  setSession: (session: InterviewSession) => void
  nextQuestion: () => void
  prevQuestion: () => void
  setAnswer: (questionId: number, answer: string) => void
  setEvaluation: (questionId: number, evaluation: any) => void
  setRecording: (val: boolean) => void
  setSpeaking: (val: boolean) => void
  setTimeElapsed: (val: number) => void
  setInterviewMode: (mode: 'audio' | 'audio_video') => void
  clearSession: () => void
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  session: null,
  currentQuestionIndex: 0,
  isRecording: false,
  isSpeaking: false,
  timeElapsed: 0,
  answers: {},
  evaluations: {},
  interviewMode: 'audio',

  setSession: (session) => set({
    session,
    currentQuestionIndex: 0,
    answers: {},
    evaluations: {},
    interviewMode: session.interview_mode ?? 'audio',
  }),
  nextQuestion: () => {
    const { session, currentQuestionIndex } = get()
    if (session && currentQuestionIndex < session.questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 })
    }
  },
  prevQuestion: () => {
    const { currentQuestionIndex } = get()
    if (currentQuestionIndex > 0) set({ currentQuestionIndex: currentQuestionIndex - 1 })
  },
  setAnswer: (questionId, answer) => set((s) => ({ answers: { ...s.answers, [questionId]: answer } })),
  setEvaluation: (questionId, evaluation) => set((s) => ({ evaluations: { ...s.evaluations, [questionId]: evaluation } })),
  setRecording: (val) => set({ isRecording: val }),
  setSpeaking: (val) => set({ isSpeaking: val }),
  setTimeElapsed: (val) => set({ timeElapsed: val }),
  setInterviewMode: (mode) => set({ interviewMode: mode }),
  clearSession: () => set({
    session: null, currentQuestionIndex: 0,
    answers: {}, evaluations: {}, isRecording: false, timeElapsed: 0,
    interviewMode: 'audio',
  }),
}))

