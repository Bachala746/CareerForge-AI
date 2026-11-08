import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Eye, EyeOff, Mail, Lock, User, Globe2, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Contains a letter', ok: /[a-zA-Z]/.test(password) },
    { label: 'Contains a number', ok: /[0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length
  const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500']
  const labels = ['Weak', 'Fair', 'Strong']

  if (!password) return null
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : 'bg-[var(--color-border)]'}`} />
        ))}
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        {score > 0 && <span className={score === 3 ? 'text-green-500' : score === 2 ? 'text-yellow-500' : 'text-red-400'}>{labels[score - 1]}</span>}
      </p>
    </div>
  )
}

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Frontend validation — show clear messages before hitting backend
    if (!fullName || !email || !password) { setError('Please fill in all fields'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (!/[a-zA-Z]/.test(password)) { setError('Password must contain at least one letter'); return }
    if (!/[0-9]/.test(password)) { setError('Password must contain at least one number (e.g. Hema@123)'); return }

    try {
      await register(email, password, fullName)
      toast.success('Account created! Welcome to InterviewOS 🚀')
      navigate('/dashboard')
    } catch (err: any) {
      // Handle pydantic 422 errors (array format) and regular errors
      const detail = err?.response?.data?.detail
      if (Array.isArray(detail)) {
        // Pydantic returns [{msg: "...", loc: [...]}, ...]
        setError(detail[0]?.msg?.replace('Value error, ', '') || 'Validation failed')
      } else if (typeof detail === 'string') {
        setError(detail)
      } else {
        setError(err?.message || 'Registration failed. Please try again.')
      }
    }
  }


  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--color-text-primary)]">InterviewOS</span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Create your account</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">Join 50,000+ candidates preparing smarter</p>
        </div>

        <div className="card p-8">
          <button type="button" className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-all font-medium text-sm text-[var(--color-text-primary)] mb-6">
            <Globe2 className="w-4 h-4 text-blue-500" />
            Sign up with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--color-border)]" /></div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--color-surface)] px-3 text-[var(--color-text-muted)]">or sign up with email</span>
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input id="name-input" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input id="email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input id="password-input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <button id="signup-submit-btn" type="submit" disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--color-text-muted)] mt-4">
            By signing up, you agree to our{' '}
            <a href="#" className="text-blue-500">Terms of Service</a> and{' '}
            <a href="#" className="text-blue-500">Privacy Policy</a>
          </p>

          <p className="text-center text-sm text-[var(--color-text-muted)] mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 font-medium hover:text-blue-400">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
