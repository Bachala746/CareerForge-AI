import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Sun, Moon, ChevronDown, Zap, User, Settings, LogOut, Award, BarChart2, Check } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuthStore } from '../../store/authStore'
import { usersApi } from '../../api/api'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuthStore()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    usersApi.getNotifications().then(setNotifications).catch(() => {})
  }, [])

  const unreadCount = notifications.filter(n => !n.is_read).length
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'

  const handleLogout = () => {
    logout()
    toast.success('Signed out successfully')
    navigate('/')
  }

  const handleMarkRead = async (id: number) => {
    await usersApi.markNotificationRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Mock Interview', path: '/interview-setup' },
    { label: 'Reports', path: '/history' },
    { label: 'Roadmap', path: '/roadmap' },
  ]

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/10 dark:border-white/5">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/40 transition-shadow">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="gradient-text">Interview</span>
            <span className="text-[var(--color-text-primary)]">OS</span>
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname === link.path
                  ? 'bg-blue-600/15 text-blue-500'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]'
              }`}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle — Pearl ↔ Dark */}
          <button id="theme-toggle" onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Pearl' : 'Switch to Dark'}
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all">
            <motion.div key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.div>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button id="notifications-btn"
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false) }}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-80 card p-2 z-50 max-h-80 overflow-y-auto">
                  <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1 flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">Notifications</h4>
                    {unreadCount > 0 && <span className="text-xs text-blue-500">{unreadCount} new</span>}
                  </div>
                  {notifications.length > 0 ? notifications.map(n => (
                    <div key={n.id}
                      className={`flex gap-3 p-3 rounded-lg hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors group ${!n.is_read ? 'bg-blue-500/5' : ''}`}
                      onClick={() => handleMarkRead(n.id)}>
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 transition-all ${!n.is_read ? 'bg-blue-500' : 'bg-transparent'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--color-text-primary)]">{n.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{n.message}</p>
                      </div>
                      {!n.is_read && <Check className="w-3 h-3 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 mt-1 flex-shrink-0" />}
                    </div>
                  )) : (
                    <p className="text-sm text-[var(--color-text-muted)] text-center py-4">No notifications yet</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative">
            <button id="profile-btn"
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false) }}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-[var(--color-surface-2)] transition-all">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <span className="text-sm font-medium text-[var(--color-text-primary)] hidden sm:block max-w-24 truncate">
                {user?.full_name?.split(' ')[0] || 'Account'}
              </span>
              <ChevronDown className="w-3 h-3 text-[var(--color-text-muted)] hidden sm:block" />
            </button>
            <AnimatePresence>
              {showProfile && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-52 card p-2 z-50">
                  <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1">
                    <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">{user?.full_name || 'User'}</p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{user?.email}</p>
                  </div>
                  {[
                    { icon: User, label: 'Profile', path: '/profile' },
                    { icon: BarChart2, label: 'History', path: '/history' },
                    { icon: Award, label: 'Achievements', path: '/profile' },
                  ].map(item => (
                    <button key={item.label}
                      onClick={() => { navigate(item.path); setShowProfile(false) }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors">
                      <item.icon className="w-4 h-4" /> {item.label}
                    </button>
                  ))}
                  <div className="border-t border-[var(--color-border)] mt-1 pt-1">
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
