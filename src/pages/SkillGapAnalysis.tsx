import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Target, ArrowRight, AlertCircle, CheckCircle, BookOpen } from 'lucide-react'

const skills = [
  { name: 'Python', current: 90, required: 85, category: 'Core', color: '#3B82F6' },
  { name: 'Machine Learning', current: 82, required: 90, category: 'Core', color: '#A855F7' },
  { name: 'SQL', current: 60, required: 85, category: 'Core', color: '#F59E0B' },
  { name: 'System Design', current: 45, required: 80, category: 'Architecture', color: '#EF4444' },
  { name: 'AWS / Cloud', current: 40, required: 75, category: 'Infrastructure', color: '#EF4444' },
  { name: 'Docker', current: 65, required: 70, category: 'DevOps', color: '#22C55E' },
  { name: 'REST APIs', current: 78, required: 80, category: 'Backend', color: '#06B6D4' },
  { name: 'Git & CI/CD', current: 85, required: 75, category: 'DevOps', color: '#22C55E' },
  { name: 'Data Structures', current: 72, required: 85, category: 'CS Fundamentals', color: '#F59E0B' },
  { name: 'Communication', current: 78, required: 80, category: 'Soft Skills', color: '#06B6D4' },
]

function SkillBar({ skill, index }: { skill: typeof skills[0]; index: number }) {
  const gap = skill.required - skill.current
  const isAhead = skill.current >= skill.required
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="card p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{skill.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
            {skill.category}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isAhead
            ? <span className="flex items-center gap-1 text-xs text-green-500 font-medium"><CheckCircle className="w-3 h-3" /> +{-gap} ahead</span>
            : <span className="flex items-center gap-1 text-xs text-red-400 font-medium"><AlertCircle className="w-3 h-3" /> -{gap} gap</span>
          }
        </div>
      </div>

      <div className="relative h-5 rounded-full bg-[var(--color-border)] overflow-hidden">
        {/* Required marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/60 z-10"
          style={{ left: `${skill.required}%` }}
          title={`Required: ${skill.required}%`}
        />
        {/* Current level bar */}
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full flex items-center justify-end pr-2"
          initial={{ width: 0 }}
          animate={{ width: `${skill.current}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: index * 0.06 + 0.2 }}
          style={{ backgroundColor: isAhead ? '#22C55E' : skill.current > skill.required * 0.75 ? '#F59E0B' : '#EF4444' }}
        >
          <span className="text-[10px] text-white font-bold">{skill.current}%</span>
        </motion.div>
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-[var(--color-text-muted)]">Your level: {skill.current}%</span>
        <span className="text-[10px] text-[var(--color-text-muted)]">Required: {skill.required}%</span>
      </div>
    </motion.div>
  )
}

export default function SkillGapAnalysis() {
  const navigate = useNavigate()
  const ahead = skills.filter(s => s.current >= s.required)
  const behind = skills.filter(s => s.current < s.required)
  const avgGap = Math.round(behind.reduce((a, s) => a + (s.required - s.current), 0) / (behind.length || 1))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Skill Gap Analysis</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Compare your current skill level against what your target role requires
          </p>
        </div>
        <button
          onClick={() => navigate('/roadmap')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
        >
          <BookOpen className="w-4 h-4" />
          View Learning Roadmap
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Skills Analyzed', value: skills.length, icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Ready', value: ahead.length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Need Work', value: behind.length, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Avg Gap', value: `${avgGap}%`, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /> Skill level ahead of requirement</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500" /> Close to requirement (&gt;75%)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> Significant gap</span>
        <span className="flex items-center gap-1.5"><span className="w-0.5 h-3 bg-white/60 border border-[var(--color-border)]" /> Required level marker</span>
      </div>

      {/* Skill bars */}
      <div className="space-y-3">
        <h2 className="font-semibold text-[var(--color-text-primary)]">Skill Breakdown</h2>
        {skills.map((skill, i) => (
          <SkillBar key={skill.name} skill={skill} index={i} />
        ))}
      </div>

      {/* Priority skills */}
      <div className="card p-6">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">
          🎯 Priority Skills to Focus On
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {behind.sort((a, b) => (b.required - b.current) - (a.required - a.current)).map((s, i) => (
            <div
              key={s.name}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 text-sm font-bold text-red-500">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{s.name}</p>
                <p className="text-xs text-red-400">{s.required - s.current}% gap to close</p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/roadmap')}
          className="mt-4 w-full py-2.5 rounded-xl border border-blue-500/30 text-blue-500 text-sm font-medium hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Get Personalized Study Plan for These Gaps
        </button>
      </div>
    </div>
  )
}
