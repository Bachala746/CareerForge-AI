import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Zap } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Zap className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-8xl font-black gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">Page Not Found</h2>
        <p className="text-[var(--color-text-muted)] mb-8">
          Looks like this page went to a different interview. Let's get you back on track.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-surface-2)] transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            <Home className="w-4 h-4" /> Home
          </button>
        </div>
      </motion.div>
    </div>
  )
}
