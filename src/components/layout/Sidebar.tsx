import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, Mic, Code2,
  BarChart3, Map as MapIcon, History, User, ChevronLeft,
  ChevronRight, Plus, TrendingDown, LogOut, BrainCircuit
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard' },
  { icon: FileText,        label: 'Resume & JD',  path: '/resume-jd' },
  { icon: Mic,             label: 'Mock Interview', path: '/interview-setup' },
  { icon: Code2,           label: 'Coding',        path: '/coding-interview' },
  { icon: BrainCircuit,    label: 'Aptitude',      path: '/aptitude' },
  { icon: TrendingDown,    label: 'Skill Gap',     path: '/skill-gap' },
  { icon: BarChart3,       label: 'Reports',       path: '/report' },
  { icon: MapIcon,          label: 'Roadmap',       path: '/roadmap' },
  { icon: History,         label: 'History',       path: '/history' },
  { icon: User,            label: 'Profile',       path: '/profile' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const initials = user?.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'U'

  const handleLogout = () => {
    logout()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden lg:flex flex-col h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] overflow-hidden flex-shrink-0"
    >
      {/* Start Interview CTA */}
      <div className="p-3 border-b border-[var(--color-border)]">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.button
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => navigate('/interview-setup')}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              New Interview
            </motion.button>
          ) : (
            <motion.button
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => navigate('/interview-setup')}
              className="w-full flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                isActive
                  ? 'bg-blue-600/10 text-blue-500 dark:text-blue-400 font-medium'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-blue-600/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className={`w-4 h-4 flex-shrink-0 relative z-10 ${isActive ? 'text-blue-500' : ''}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm whitespace-nowrap overflow-hidden relative z-10"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* Tooltip on collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-xs font-medium text-[var(--color-text-primary)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-[var(--color-border)] space-y-2">
        <div className={`flex items-center gap-2 px-2 py-1 rounded-xl ${!collapsed ? '' : 'justify-center'}`}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden min-w-0">
                <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{user?.full_name || 'User'}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button onClick={handleLogout}
          className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-xs ${collapsed ? 'justify-center' : ''}`}>
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shadow-md hover:border-blue-500 hover:text-blue-500 transition-all text-[var(--color-text-muted)] z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  )
}
