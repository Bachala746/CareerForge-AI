import api from './client'

export const reportsApi = {
  getBySession: async (sessionId: number) => {
    const res = await api.get(`/reports/session/${sessionId}`)
    return res.data
  },

  getAll: async () => {
    const res = await api.get('/reports/all')
    return res.data
  },

  generate: async (sessionId: number) => {
    const res = await api.post(`/reports/generate/${sessionId}`)
    return res.data
  },

  getLatestRoadmap: async () => {
    const res = await api.get('/reports/roadmap/latest')
    return res.data
  },
}

export const dashboardApi = {
  getStats: async () => {
    const res = await api.get('/dashboard/stats')
    return res.data
  },

  getWeeklyProgress: async () => {
    const res = await api.get('/dashboard/weekly-progress')
    return res.data
  },

  getRecentInterviews: async () => {
    const res = await api.get('/dashboard/recent-interviews')
    return res.data
  },

  getSkillRadar: async () => {
    const res = await api.get('/dashboard/skill-radar')
    return res.data
  },
}

export const aiApi = {
  mentorChat: async (message: string, history: {role: string; content: string}[]) => {
    const res = await api.post('/ai/mentor-chat', { message, history })
    return res.data
  },

  generateRoadmap: async () => {
    const res = await api.post('/ai/generate-roadmap')
    return res.data
  },

  analyzeResume: async () => {
    const res = await api.post('/ai/analyze-resume')
    return res.data
  },
}

export const usersApi = {
  getProfile: async () => {
    const res = await api.get('/users/profile')
    return res.data
  },

  updateProfile: async (data: Record<string, any>) => {
    const res = await api.put('/users/profile', data)
    return res.data
  },

  getStats: async () => {
    const res = await api.get('/users/stats')
    return res.data
  },

  getAchievements: async () => {
    const res = await api.get('/users/achievements')
    return res.data
  },

  getNotifications: async () => {
    const res = await api.get('/users/notifications')
    return res.data
  },

  markNotificationRead: async (id: number) => {
    await api.put(`/users/notifications/${id}/read`)
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}
