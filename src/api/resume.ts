import api from './client'

export const resumeApi = {
  upload: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  getLatest: async () => {
    const res = await api.get('/resume/latest')
    return res.data
  },

  getById: async (id: number) => {
    const res = await api.get(`/resume/${id}`)
    return res.data
  },
}

export const jdApi = {
  analyze: async (data: { jd_text: string; company?: string; role_title?: string }) => {
    const res = await api.post('/ai/analyze-jd', data)
    return res.data
  },
}
