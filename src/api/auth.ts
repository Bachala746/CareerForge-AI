import api from './client'

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { email: string; password: string; full_name: string }

export const authApi = {
  register: async (data: RegisterPayload) => {
    const res = await api.post('/auth/register', data)
    return res.data
  },
  login: async (data: LoginPayload) => {
    const res = await api.post('/auth/login', data)
    return res.data
  },
  refresh: async (refresh_token: string) => {
    const res = await api.post('/auth/refresh', { refresh_token })
    return res.data
  },
  logout: async () => {
    await api.post('/auth/logout')
  },
  me: async () => {
    const res = await api.get('/auth/me')
    return res.data
  },
}
