import axios from 'axios'

const API_BASE = 'http://localhost:8000/api'

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,   // 120s — AI resume analysis can take up to 60s
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — inject auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — auto refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken })
          const newToken = res.data.access_token
          localStorage.setItem('access_token', newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        } catch {
          // Refresh failed — clear tokens
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      } else {
        window.location.href = '/login'
      }
    }

    // Normalize error message
    const message = error.response?.data?.detail || error.message || 'Something went wrong'
    return Promise.reject(new Error(message))
  }
)

export default api
