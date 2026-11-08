import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api/auth'

export interface AuthUser {
  id: number
  email: string
  full_name: string
  avatar_url?: string
  role: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, full_name: string) => Promise<void>
  logout: () => void
  setUser: (user: AuthUser) => void
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const data = await authApi.login({ email, password })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          set({
            user: data.user,
            accessToken: data.access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      register: async (email, password, full_name) => {
        set({ isLoading: true })
        try {
          const data = await authApi.register({ email, password, full_name })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          set({
            user: data.user,
            accessToken: data.access_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, isAuthenticated: false })
      },

      setUser: (user) => set({ user }),

      refreshUser: async () => {
        try {
          const user = await authApi.me()
          set({ user, isAuthenticated: true })
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: 'interviewos-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
