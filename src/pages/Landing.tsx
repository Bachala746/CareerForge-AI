import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Zap, ArrowRight, Play, Brain, Mic, FileText, BarChart3,
  Star, CheckCircle, XCircle, ChevronRight, Shield, Award,
  Sparkles, Users, TrendingUp, MessageSquare, Code2,
  Target, Eye, Cpu, GitBranch, Share2, Link2, Map as MapIcon
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

// Animated counter hook
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return { count, ref }
}

function StatCounter({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const { count, ref } = useCounter(value)
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-4xl font-bold gradient-text">{count.toLocaleString()}{suffix}</div>
      <div className="text-sm text-[var(--color-text-muted)] mt-1">{label}</div>
    </div>
  )
}

const features = [
  { icon: Brain, title: 'AI Interview Brain', desc: 'Adaptive questions based on your answers, resume, and target role', color: 'from-blue-500 to-cyan-500' },
  { icon: Mic, title: 'Voice Analytics', desc: 'Real-time speech analysis for confidence, pace, and clarity', color: 'from-purple-500 to-pink-500' },
  { icon: FileText, title: 'Resume Intelligence', desc: 'Deep resume parsing to generate hyper-personalized questions', color: 'from-green-500 to-emerald-500' },
  { icon: BarChart3, title: 'Recruiter Reports', desc: 'Professional multi-dimensional evaluation like a real recruiter', color: 'from-orange-500 to-amber-500' },
  { icon: MapIcon, title: 'Learning Roadmap', desc: 'Week-by-week personalized study plan based on your gaps', color: 'from-red-500 to-pink-500' },
  { icon: Code2, title: 'Coding Interviews', desc: 'Live code editor with AI review, test cases, and complexity analysis', color: 'from-indigo-500 to-blue-500' },
  { icon: Eye, title: 'Vision Analytics', desc: 'Eye contact, posture, and facial expression analysis via webcam', color: 'from-teal-500 to-cyan-500' },
  { icon: Target, title: 'Adaptive Difficulty', desc: 'Questions get harder or easier based on your performance in real-time', color: 'from-violet-500 to-purple-500' },
  { icon: Cpu, title: 'RAG Knowledge Base', desc: 'Company-specific questions from a curated knowledge base', color: 'from-rose-500 to-red-500' },
  { icon: Users, title: 'Panel Simulation', desc: 'Face a panel of AI interviewers — HR, Technical, and Team Lead', color: 'from-sky-500 to-blue-500' },
  { icon: MessageSquare, title: 'STAR Evaluation', desc: 'Behavioral answers scored on Situation, Task, Action, Result', color: 'from-lime-500 to-green-500' },
  { icon: Award, title: 'Certifications', desc: 'Earn badges, unlock achievements, and download performance certificates', color: 'from-yellow-500 to-amber-500' },
]

const personalities = [
  { emoji: '😊', name: 'Friendly HR', desc: 'Warm, encouraging, behavioral focus' },
  { emoji: '😠', name: 'Strict Tech Lead', desc: 'Deep technical, no hand-holding' },
  { emoji: '⚡', name: 'Startup Founder', desc: 'Fast-paced, resourcefulness focused' },
  { emoji: '🧠', name: 'Eng Manager', desc: 'System design, leadership scenarios' },
]

const testimonials = [
  { name: 'Priya Sharma', role: 'SWE @ Google', text: 'InterviewOS helped me crack Google in 3 weeks. The adaptive questions were spot-on!', rating: 5 },
  { name: 'Rahul Gupta', role: 'ML Engineer @ Microsoft', text: 'The voice analytics showed me I was speaking too fast. Fixed it, got the offer.', rating: 5 },
  { name: 'Ananya Singh', role: 'Placed @ TCS', text: 'Finally an interview platform that reads my resume and asks relevant questions.', rating: 5 },
]

const steps = [
  { num: '01', title: 'Upload Resume & JD', desc: 'AI reads your resume and target job description', icon: FileText },
  { num: '02', title: 'AI Creates Interview Plan', desc: 'Personalized questions based on your exact profile', icon: Brain },
  { num: '03', title: 'Practice & Get Evaluated', desc: 'Speak your answers, get real-time feedback and report', icon: BarChart3 },
]

export default function Landing() {
  const navigate = useNavigate()
  const { theme } = useTheme()

  const floatingCards = [
    { label: 'Confidence Score', value: '87%', color: 'text-green-400', bg: 'bg-green-500/10', top: '15%', right: '5%', delay: 0 },
    { label: 'Technical', value: '9.1/10', color: 'text-blue-400', bg: 'bg-blue-500/10', top: '45%', right: '0%', delay: 0.5 },
    { label: 'Interview Ready', value: '94%', color: 'text-cyan-400', bg: 'bg-cyan-500/10', top: '70%', right: '8%', delay: 1 },
  ]

  return (
    <div className="min-h-screen bg-[var(--color-bg)] overflow-x-hidden">
      {/* Landing Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 dark:border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              <span className="gradient-text">Interview</span>
              <span className="text-[var(--color-text-primary)]">OS</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {['Features', 'How It Works', 'Testimonials'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
              Sign In
            </Link>
            <Link to="/signup">
              <button className="btn-primary">
                <span>Get Started Free</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(37, 99, 235, 0.15) 0%, transparent 50%),
                           radial-gradient(ellipse at 80% 20%, rgba(6, 182, 212, 0.12) 0%, transparent 50%)`,
        }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Interview Preparation
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6"
            >
              Practice Interviews{' '}
              <span className="gradient-text">Like They're</span>{' '}
              Real.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg"
            >
              AI Interview Twin analyzes your resume, understands your target job, conducts adaptive mock interviews, evaluates your communication and technical skills, and builds your personalized learning roadmap.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <button
                id="hero-start-btn"
                onClick={() => navigate('/signup')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5 group"
              >
                <Zap className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Start Mock Interview
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                id="hero-demo-btn"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-all hover:-translate-y-0.5 group backdrop-blur-sm"
              >
                <Play className="w-4 h-4" />
                View Dashboard Demo
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex flex-wrap items-center gap-6"
            >
              {[
                { icon: Shield, text: 'Privacy First' },
                { icon: Star, text: '4.9/5 Rating' },
                { icon: CheckCircle, text: 'No Credit Card' },
              ].map(badge => (
                <div key={badge.text} className="flex items-center gap-1.5 text-slate-400 text-sm">
                  <badge.icon className="w-4 h-4 text-green-400" />
                  {badge.text}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — AI Interviewer Visual */}
          <div className="relative hidden lg:block">
            {/* Main Avatar Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative mx-auto w-80"
            >
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-float"
                style={{ background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))' }}>
                {/* Video call header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-white text-xs font-medium">AI Interviewer • Live</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                </div>
                {/* Avatar area */}
                <div className="relative h-52 flex items-center justify-center bg-gradient-to-b from-slate-800/50 to-slate-900/50">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center animate-pulse-glow">
                      <Brain className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-slate-900" />
                  </div>
                  {/* Waveform */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8">
                    {[...Array(16)].map((_, i) => (
                      <div
                        key={i}
                        className="waveform-bar"
                        style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.08}s` }}
                      />
                    ))}
                  </div>
                </div>
                {/* Question */}
                <div className="p-4 space-y-3">
                  <div className="text-xs text-blue-400 font-medium">Current Question</div>
                  <p className="text-white text-sm leading-relaxed">
                    "Tell me about your TensorFlow project mentioned in your resume. What was the biggest challenge you faced?"
                  </p>
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {[
                      { label: 'Confidence', value: '82%', color: 'text-green-400' },
                      { label: 'Clarity', value: 'Good', color: 'text-blue-400' },
                      { label: 'Pace', value: 'Fast', color: 'text-yellow-400' },
                    ].map(m => (
                      <div key={m.label} className="text-center p-2 rounded-lg bg-white/5">
                        <div className={`text-sm font-bold ${m.color}`}>{m.value}</div>
                        <div className="text-xs text-slate-500">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Analytics Cards */}
            {floatingCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + i * 0.2 }}
                style={{ top: card.top, right: card.right }}
                className="absolute glass border border-white/10 rounded-2xl p-3 min-w-32"
              >
                <div className={`text-xs text-slate-400 mb-1`}>{card.label}</div>
                <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
                <div className={`inline-flex items-center gap-1 text-xs mt-1 px-1.5 py-0.5 rounded-full ${card.bg} ${card.color}`}>
                  <TrendingUp className="w-2.5 h-2.5" /> +12%
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════ */}
      <section className="py-16 border-y border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCounter value={50000} label="Interviews Conducted" suffix="+" />
          <StatCounter value={94} label="Placement Rate" suffix="%" />
          <StatCounter value={12} label="AI Modules" suffix="+" />
          <StatCounter value={4} label="Interview Types" suffix="x" />
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm font-medium mb-4">
              <ChevronRight className="w-3.5 h-3.5" /> Simple 3 Steps
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-[var(--color-text-primary)] mb-4">
              How <span className="gradient-text">InterviewOS</span> Works
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto">
              From upload to offer-ready in minutes. No setup required.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-gradient-to-r from-blue-500/30 via-cyan-500/50 to-blue-500/30" />
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="card p-8 text-center relative group"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                  {step.num}
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/15 to-cyan-500/10 flex items-center justify-center mx-auto mb-4 mt-4 group-hover:scale-110 transition-transform">
                  <step.icon className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">{step.title}</h3>
                <p className="text-[var(--color-text-secondary)] text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section id="features" className="py-24 px-6 bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-sm font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" /> 12 Powerful Modules
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-[var(--color-text-primary)] mb-4">
              Everything You Need to <span className="gradient-text">Land the Job</span>
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto">
              A complete interview preparation ecosystem powered by cutting-edge AI.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="card p-5 group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} p-2.5 mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                  <f.icon className="w-full h-full text-white" />
                </div>
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-1">{f.title}</h3>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          PERSONALITY SIMULATION
      ══════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm font-medium mb-4">
                <Star className="w-3.5 h-3.5" /> Unique Feature
              </div>
              <h2 className="text-4xl font-black text-[var(--color-text-primary)] mb-4">
                4 Different <span className="gradient-text">Interviewer Personalities</span>
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Practice with a Friendly HR, a Strict Tech Lead, a Fast-paced Startup Founder, or a Senior Engineering Manager. Each personality asks questions differently.
              </p>
              <Link to="/interview-setup">
                <button className="btn-primary">
                  <span className="flex items-center gap-2">Try Different Personalities <ArrowRight className="w-4 h-4" /></span>
                </button>
              </Link>
            </motion.div>
            <div className="grid grid-cols-2 gap-4">
              {personalities.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="card p-5 hover:border-blue-500/30 cursor-pointer group"
                >
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform inline-block">{p.emoji}</div>
                  <h3 className="font-bold text-sm text-[var(--color-text-primary)]">{p.name}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{p.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          COMPARISON TABLE
      ══════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[var(--color-surface)]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-black text-[var(--color-text-primary)] mb-4">
              Why <span className="gradient-text">InterviewOS</span>?
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left p-4 text-[var(--color-text-secondary)] font-medium text-sm">Feature</th>
                  <th className="p-4 text-center text-[var(--color-text-muted)] font-medium text-sm">Other Platforms</th>
                  <th className="p-4 text-center font-bold text-sm gradient-text">InterviewOS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Question type', 'Fixed list', 'Dynamic conversations'],
                  ['Personalization', 'Generic', 'Resume + JD specific'],
                  ['Evaluation', 'One score', 'Multi-dimensional analysis'],
                  ['Memory', 'None', 'Remembers past interviews'],
                  ['Interviewer style', 'Single generic', '4 AI personalities'],
                  ['Feedback', 'Basic', 'Personalized learning roadmap'],
                  ['Voice analysis', 'None', 'Real-time speech analytics'],
                  ['Coding', 'Separate tool', 'Built-in Monaco editor + AI'],
                ].map(([feat, other, ours], i) => (
                  <tr key={feat} className={`border-b border-[var(--color-border)] ${i % 2 === 0 ? 'bg-[var(--color-bg)]' : ''}`}>
                    <td className="p-4 text-sm font-medium text-[var(--color-text-primary)]">{feat}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sm text-[var(--color-text-muted)]">
                        <XCircle className="w-4 h-4 text-red-400" /> {other}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sm text-green-500 font-medium">
                        <CheckCircle className="w-4 h-4" /> {ours}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════ */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-black text-[var(--color-text-primary)] mb-4">
              Loved by <span className="gradient-text">Job Seekers</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-text-primary)]">{t.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA SECTION
      ══════════════════════════════════════ */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center rounded-3xl p-16 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e3a8a, #0e7490)' }}
        >
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)`
          }} />
          <div className="relative">
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Ready to Ace Your Next Interview?
            </h2>
            <p className="text-blue-200 text-lg mb-8 max-w-lg mx-auto">
              Join 50,000+ candidates who practice smarter with InterviewOS.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate('/signup')}
                className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-700 font-bold hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <Zap className="w-5 h-5" />
                Start Free — No Credit Card
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/30 text-white font-bold hover:bg-white/10 transition-all"
              >
                <Play className="w-5 h-5" />
                View Demo Dashboard
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="border-t border-[var(--color-border)] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold"><span className="gradient-text">Interview</span>OS</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Practice with an AI interviewer that thinks, reacts, and evaluates like a real recruiter.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Dashboard', 'Mock Interview', 'Reports', 'Roadmap'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
              { title: 'Support', links: ['Help Center', 'Privacy Policy', 'Terms of Service', 'Contact'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-sm text-[var(--color-text-primary)] mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(l => (
                    <li key={l}>
                      <a href="#" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">© 2026 InterviewOS. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              {[Share2, GitBranch, Link2].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-all">
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
