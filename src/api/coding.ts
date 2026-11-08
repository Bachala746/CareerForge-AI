import api from './client'

export const codingApi = {
  /** Get topics for a specific language */
  getTopics: async (language: string): Promise<string[]> => {
    const res = await api.get(`/coding/topics/${language.toLowerCase()}`)
    return res.data.topics
  },

  /** Generate a question for language + topic + difficulty */
  generate: async (payload: {
    language: string
    topic: string
    difficulty: string
  }) => {
    const res = await api.post('/coding/generate', payload)
    return res.data
  },

  /** Submit code for AI evaluation */
  evaluate: async (payload: {
    code: string
    language: string
    topic: string
    difficulty: string
    problem_title: string
    problem_description: string
  }) => {
    const res = await api.post('/coding/evaluate', payload)
    return res.data
  },
}
