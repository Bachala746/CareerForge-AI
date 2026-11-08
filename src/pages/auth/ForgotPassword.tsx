import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import api from '../../api/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Please enter your email'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err: any) {
      // Show sent even on error to avoid email enumeration
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--color-text-primary)]">InterviewOS</span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Reset your password</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">Enter your email and we'll send a reset link</p>
        </div>

        <div className="card p-8">
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Check your inbox</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                If an account exists for <span className="text-[var(--color-text-primary)] font-medium">{email}</span>,
                you'll receive a reset link shortly.
              </p>
              <Link to="/login">
                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all mt-2">
                  Back to Sign In
                </button>
              </Link>
            </motion.div>
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input
                      id="forgot-email-input"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                <button
                  id="forgot-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                    : 'Send Reset Link'
                  }
                </button>
              </form>
              <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
                <Link to="/login" className="text-blue-500 hover:text-blue-400 flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
