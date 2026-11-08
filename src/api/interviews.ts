import { api } from './client'

export const interviewsApi = {
  setup: async (data: {
    company?: string
    role: string
    interview_type: string
    personality: string
    difficulty: string
    duration_minutes: number
    experience_level: string
    question_count?: number
    interview_mode?: string
  }) => {
    const res = await api.post('/interviews/setup', data)
    return res.data
  },

  getSession: async (sessionId: number) => {
    const res = await api.get(`/interviews/session/${sessionId}`)
    return res.data
  },

  submitAnswer: async (sessionId: number, data: {
    question_id: number
    answer_text: string
    duration_secs?: number
    generate_followup?: boolean
    total_questions?: number
  }) => {
    const res = await api.post(`/interviews/session/${sessionId}/answer`, data)
    return res.data
  },

  endSession: async (sessionId: number) => {
    const res = await api.post(`/interviews/session/${sessionId}/end`)
    return res.data
  },

  getHistory: async (limit = 20) => {
    const res = await api.get(`/interviews/history?limit=${limit}`)
    return res.data
  },

  getActive: async () => {
    const res = await api.get('/interviews/active')
    return res.data
  },
}
