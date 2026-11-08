import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Briefcase, MapPin, Link2, GitBranch, Phone, Save, Upload, Award, CheckCircle } from 'lucide-react'

import toast from 'react-hot-toast'
import { usersApi } from '../api/api'
import { useAuthStore } from '../store/authStore'

const experienceLevels = ['fresher', 'junior', 'mid', 'senior']

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [p, a, s] = await Promise.all([
          usersApi.getProfile(),
          usersApi.getAchievements(),
          usersApi.getStats(),
        ])
        setProfile(p)
        setAchievements(a)
        setStats(s)
        setForm({
          full_name: p.full_name,
          target_role: p.profile?.target_role || '',
          target_company: p.profile?.target_company || '',
          experience_level: p.profile?.experience_level || 'junior',
          university: p.profile?.university || '',
          cgpa: p.profile?.cgpa || '',
          linkedin_url: p.profile?.linkedin_url || '',
          Git_url: p.profile?.Git_url || '',
          phone: p.profile?.phone || '',
          location: p.profile?.location || '',
          bio: p.profile?.bio || '',
          skills: p.profile?.skills || [],
        })
      } catch { toast.error('Failed to load profile') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const update = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }))

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !form.skills.includes(s)) {
      update('skills', [...form.skills, s])
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => update('skills', form.skills.filter((s: string) => s !== skill))

  const handleSave = async () => {
    setSaving(true)
    try {
      await usersApi.updateProfile(form)
      setUser({ ...user!, full_name: form.full_name })
      toast.success('Profile saved! ✓')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  if (loading) {
    return <div className="space-y-4">{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">My Profile</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">Manage your account and preferences</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-60">
          {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      {/* Stats Banner */}
      {stats && (
        <div className="card p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { label: 'Interviews', value: stats.total_interviews },
              { label: 'Best Score', value: stats.best_score },
              { label: 'Readiness', value: `${stats.readiness_score}%` },
              { label: 'Day Streak', value: `${stats.streak_days}d` },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{s.value}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Basic Info */}
      <div className="card p-6">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> Basic Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { key: 'full_name', label: 'Full Name', placeholder: 'John Doe' },
            { key: 'target_role', label: 'Target Role', placeholder: 'Software Engineer' },
            { key: 'target_company', label: 'Dream Company', placeholder: 'Google, Amazon...' },
            { key: 'university', label: 'University', placeholder: 'MIT, IIT...' },
            { key: 'cgpa', label: 'CGPA / GPA', placeholder: '8.5 / 4.0' },
            { key: 'phone', label: 'Phone', placeholder: '+1 234 567 8900' },
            { key: 'location', label: 'Location', placeholder: 'San Francisco, CA' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">{f.label}</label>
              <input value={form[f.key] || ''} onChange={e => update(f.key, e.target.value)} placeholder={f.placeholder}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-[var(--color-text-muted)] mb-1">Experience Level</label>
            <select value={form.experience_level} onChange={e => update('experience_level', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 capitalize">
              {experienceLevels.map(l => <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs text-[var(--color-text-muted)] mb-1">Bio</label>
          <textarea value={form.bio || ''} onChange={e => update('bio', e.target.value)} rows={3} placeholder="A brief intro about yourself..."
            className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
        </div>
      </div>

      {/* Social Links */}
      <div className="card p-6">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2"><Link2 className="w-4 h-4 text-cyan-500" /> Social Links</h2>
        <div className="space-y-3">
          {[
            { key: 'linkedin_url', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/yourname' },
            { key: 'Git_url', label: 'GitBranch URL', placeholder: 'https://GitBranch.com/yourname' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">{f.label}</label>
              <input value={form[f.key] || ''} onChange={e => update(f.key, e.target.value)} placeholder={f.placeholder}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="card p-6">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Skills</h2>
        <div className="flex gap-2 mb-3">
          <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSkill()} placeholder="Add a skill (Enter to add)"
            className="flex-1 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
          <button onClick={addSkill} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors">Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.skills?.map((skill: string) => (
            <span key={skill} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {skill}
              <button onClick={() => removeSkill(skill)} className="hover:text-red-400 transition-colors">×</button>
            </span>
          ))}
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /> Achievements</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map((a) => (
              <div key={a.id} className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-center">
                <p className="text-2xl mb-1">{a.badge_label.split(' ')[0]}</p>
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">{a.badge_label.slice(2)}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{a.badge_desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
