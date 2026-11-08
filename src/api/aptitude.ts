import api from './client'

export const aptitudeApi = {
  getTopics: async (category: string): Promise<string[]> => {
    const res = await api.get(`/aptitude/topics/${category.toLowerCase()}`)
    return res.data.topics
  },
  generate: async (payload: {
    category: string
    topic: string
    difficulty: string
    count?: number
  }) => {
    const res = await api.post('/aptitude/generate', payload)
    return res.data
  },
}
