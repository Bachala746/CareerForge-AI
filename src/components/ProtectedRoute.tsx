import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const token = localStorage.getItem('access_token')

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
