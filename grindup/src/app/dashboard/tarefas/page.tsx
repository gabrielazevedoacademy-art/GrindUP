'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClientSupabase } from '@/lib/supabase'
import { getLevelFromXP } from '@/lib/levels'
import { isLimitReached } from '@/lib/planLimits'
import { formatDate } from '@/lib/dateUtils'
import UpgradeModal from '@/components/UpgradeModal'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type Task = {
  id: string
  user_id: string
  title: string
  description: string | null
  is_completed: boolean
  completed_at: string | null
  due_date: string | null
  priority: 'low' | 'medium' | 'high'
  xp_reward: number
  created_at: string
}

type StatusFilter = 'all' | 'pending' | 'completed'
type PriorityFilter = 'all' | 'low' | 'medium' | 'high'

type XpPopup = {
  id: string
  amount: number
  key: number
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const XP_BY_PRIORITY: Record<string, number> = {
  low: 10,
  medium: 20,
  high: 40,
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
}

const PRIORITY_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  high:   { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', border: 'rgba(239,68,68,0.35)'   },
  medium: { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.35)'  },
  low:    { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', border: 'rgba(96,165,250,0.35)'  },
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

function XpPopupItem({ amount, onDone }: { amount: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1600)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'none',
        animation: 'xpFloat 1.6s ease forwards',
        fontSize: '1.75rem',
        fontWeight: 900,
        color: '#4ade80',
        textShadow: '0 0 20px rgba(74,222,128,0.9), 0 0 40px rgba(74,222,128,0.5)',
        letterSpacing: '-0.5px',
      }}
    >
      +{amount} XP
    </div>
  )
}

function TaskCard({
  task,
  onToggle,
  onDelete,
  completing,
  deleting,
}: {
  task: Task
  onToggle: (task: Task) => void
  onDelete: (id: string) => void
  completing: boolean
  deleting: boolean
}) {
  const ps = PRIORITY_STYLE[task.priority]
  const xpReward = XP_BY_PRIORITY[task.priority]

  return (
    <div
      style={{
        borderRadius: 16,
        padding: '20px 24px',
        background: task.is_completed
          ? 'rgba(255,255,255,0.015)'
          : 'rgba(255,255,255,0.04)',
        border: task.is_completed
          ? '1px solid rgba(255,255,255,0.06)'
          : '1px solid rgba(124,58,237,0.18)',
        boxShadow: task.is_completed ? 'none' : '0 0 18px rgba(124,58,237,0.07)',
        opacity: task.is_completed ? 0.55 : 1,
        transition: 'opacity 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task)}
        disabled={completing || task.is_completed}
        aria-label={task.is_completed ? 'Tarefa concluída' : 'Marcar como concluída'}
        style={{
          flexShrink: 0,
          marginTop: 2,
          width: 24,
          height: 24,
          borderRadius: 8,
          border: task.is_completed
            ? '2px solid rgba(124,58,237,0.6)'
            : '2px solid rgba(124,58,237,0.45)',
          background: task.is_completed
            ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
            : 'transparent',
          boxShadow: task.is_completed ? '0 0 14px rgba(124,58,237,0.7)' : 'none',
          cursor: task.is_completed || completing ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.25s ease',
        }}
      >
        {task.is_completed && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          <span
            style={{
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: task.is_completed ? 'rgba(255,255,255,0.4)' : '#fff',
              textDecoration: task.is_completed ? 'line-through' : 'none',
              flex: 1,
            }}
          >
            {task.title}
          </span>

          {/* Priority badge */}
          <span
            style={{
              flexShrink: 0,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '2px 10px',
              borderRadius: 999,
              background: ps.bg,
              color: ps.color,
              border: `1px solid ${ps.border}`,
            }}
          >
            {PRIORITY_LABEL[task.priority]}
          </span>
        </div>

        {task.description && (
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.38)', marginBottom: 10, lineHeight: 1.55 }}>
            {task.description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {/* XP badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.72rem',
              fontWeight: 700,
              color: task.is_completed ? 'rgba(74,222,128,0.5)' : '#4ade80',
              background: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.18)',
              borderRadius: 999,
              padding: '2px 9px',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
            </svg>
            {task.is_completed ? `+${xpReward} XP obtido` : `+${xpReward} XP`}
          </span>

          {/* Due date */}
          {task.due_date && (
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        disabled={deleting}
        aria-label="Deletar tarefa"
        style={{
          flexShrink: 0,
          marginTop: 1,
          width: 30,
          height: 30,
          borderRadius: 8,
          border: '1px solid rgba(239,68,68,0.2)',
          background: 'rgba(239,68,68,0.07)',
          color: 'rgba(248,113,113,0.6)',
          cursor: deleting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          opacity: deleting ? 0.4 : 1,
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.18)'
          ;(e.currentTarget as HTMLButtonElement).style.color = '#f87171'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.45)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.07)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(248,113,113,0.6)'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.2)'
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NEW TASK MODAL
// ─────────────────────────────────────────────────────────────
type NewTaskForm = {
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  dueDate: string
}

function NewTaskModal({
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void
  onSave: (form: NewTaskForm) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState<NewTaskForm>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
  })

  const xpPreview = XP_BY_PRIORITY[form.priority]

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    await onSave(form)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.18s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 20,
          background: 'linear-gradient(145deg, #120c22, #0d0a1e)',
          border: '1px solid rgba(124,58,237,0.3)',
          boxShadow: '0 0 60px rgba(124,58,237,0.25), 0 24px 64px rgba(0,0,0,0.6)',
          padding: '32px 28px',
          animation: 'slideUp 0.22s ease',
        }}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Nova Tarefa
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Título *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Estudar TypeScript"
              maxLength={120}
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 10,
                border: '1px solid rgba(124,58,237,0.3)',
                background: 'rgba(124,58,237,0.07)',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Descrição
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Detalhe o que precisa ser feito..."
              rows={3}
              maxLength={500}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 10,
                border: '1px solid rgba(124,58,237,0.3)',
                background: 'rgba(124,58,237,0.07)',
                color: '#fff',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.55,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Priority + Due date row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Prioridade
              </label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(124,58,237,0.3)',
                  background: '#120c22',
                  color: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="high">Alta (+40 XP)</option>
                <option value="medium">Média (+20 XP)</option>
                <option value="low">Baixa (+10 XP)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Vencimento
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(124,58,237,0.3)',
                  background: '#120c22',
                  color: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  colorScheme: 'dark',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* XP preview */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(74,222,128,0.07)',
              border: '1px solid rgba(74,222,128,0.18)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#4ade80">
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
            </svg>
            <span style={{ fontSize: '0.82rem', color: '#4ade80', fontWeight: 600 }}>
              Você ganhará <strong>+{xpPreview} XP</strong> ao concluir essa tarefa
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '12px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              style={{
                flex: 2, padding: '12px', borderRadius: 10,
                border: '1px solid rgba(124,58,237,0.5)',
                background: saving || !form.title.trim()
                  ? 'rgba(124,58,237,0.3)'
                  : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff',
                fontSize: '0.875rem', fontWeight: 700,
                cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer',
                boxShadow: saving || !form.title.trim() ? 'none' : '0 0 18px rgba(124,58,237,0.45)',
                transition: 'all 0.2s ease',
              }}
            >
              {saving ? 'Salvando...' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FILTER CHIPS
// ─────────────────────────────────────────────────────────────
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 999,
        border: active ? '1px solid rgba(124,58,237,0.55)' : '1px solid rgba(255,255,255,0.08)',
        background: active ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)',
        color: active ? '#a78bfa' : 'rgba(255,255,255,0.45)',
        fontSize: '0.8rem',
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        boxShadow: active ? '0 0 12px rgba(124,58,237,0.2)' : 'none',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [xpPopups, setXpPopups] = useState<XpPopup[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ xp: number; level: number; plan: string } | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const popupCounter = useRef(0)

  // ── Fetch user + tasks ──────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const supabase = createClientSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)

    const [tasksRes, profileRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('xp, level, plan')
        .eq('id', user.id)
        .single(),
    ])

    if (tasksRes.data) setTasks(tasksRes.data as Task[])
    if (profileRes.data) setUserProfile(profileRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── New task gate ────────────────────────────────────────────
  function handleNewTask() {
    if (userProfile) {
      const todayPrefix = new Date().toISOString().slice(0, 10)
      const todayCount = tasks.filter(t => t.created_at.startsWith(todayPrefix)).length
      if (isLimitReached(userProfile.plan, 'maxTasksPerDay', todayCount)) {
        setShowLimitModal(true)
        return
      }
    }
    setShowModal(true)
  }

  // ── Create task ─────────────────────────────────────────────
  async function handleCreate(form: NewTaskForm) {
    if (!userId) return
    setSaving(true)
    const supabase = createClientSupabase()
    const xpReward = XP_BY_PRIORITY[form.priority]

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        due_date: form.dueDate || null,
        xp_reward: xpReward,
      })
      .select()
      .single()

    setSaving(false)
    if (!error && data) {
      setTasks(prev => [data as Task, ...prev])
      setShowModal(false)
    }
  }

  // ── Toggle complete ─────────────────────────────────────────
  async function handleToggle(task: Task) {
    if (task.is_completed || completing) return
    setCompleting(task.id)

    const supabase = createClientSupabase()
    const xpGain = XP_BY_PRIORITY[task.priority]

    const { error: taskError } = await supabase
      .from('tasks')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', task.id)

    if (taskError) { setCompleting(null); return }

    // Update local task list immediately
    setTasks(prev =>
      prev.map(t =>
        t.id === task.id
          ? { ...t, is_completed: true, completed_at: new Date().toISOString() }
          : t
      )
    )

    // Award XP
    if (userProfile) {
      const newXp = userProfile.xp + xpGain
      const newLevel = getLevelFromXP(newXp)

      await supabase
        .from('profiles')
        .update({ xp: newXp, level: newLevel })
        .eq('id', userId!)

      setUserProfile(prev => prev ? { ...prev, xp: newXp, level: newLevel } : prev)
    }

    // Show XP popup
    const key = ++popupCounter.current
    setXpPopups(prev => [...prev, { id: task.id, amount: xpGain, key }])
    setCompleting(null)
  }

  // ── Delete task ─────────────────────────────────────────────
  async function handleDelete(taskId: string) {
    if (deleting) return
    setDeleting(taskId)

    const supabase = createClientSupabase()
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)

    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== taskId))
    }
    setDeleting(null)
  }

  // ── Filtered tasks ──────────────────────────────────────────
  const filtered = tasks.filter(t => {
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && !t.is_completed) ||
      (statusFilter === 'completed' && t.is_completed)
    const matchPriority =
      priorityFilter === 'all' || t.priority === priorityFilter
    return matchStatus && matchPriority
  })

  const pendingCount = tasks.filter(t => !t.is_completed).length

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 pb-12 pt-10 md:px-8">
      <style>{`
        @keyframes xpFloat {
          0%   { opacity: 0; transform: translateX(-50%) translateY(0px) scale(0.8); }
          20%  { opacity: 1; transform: translateX(-50%) translateY(-20px) scale(1.15); }
          60%  { opacity: 1; transform: translateX(-50%) translateY(-60px) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-100px) scale(0.85); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes taskIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.22); }
        input:focus, textarea:focus, select:focus {
          border-color: rgba(124,58,237,0.6) !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
        }
      `}</style>

      {/* XP popups */}
      {xpPopups.map(p => (
        <XpPopupItem
          key={p.key}
          amount={p.amount}
          onDone={() => setXpPopups(prev => prev.filter(x => x.key !== p.key))}
        />
      ))}

      {/* Modals */}
      {showModal && (
        <NewTaskModal
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
          saving={saving}
        />
      )}
      {showLimitModal && (
        <UpgradeModal
          title="Limite diário atingido"
          message="No plano Free você pode criar até 5 tarefas por dia. Faça upgrade para criar tarefas ilimitadas."
          onClose={() => setShowLimitModal(false)}
        />
      )}

      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: 0, marginBottom: 4 }}>
            Tarefas
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.38)', margin: 0 }}>
            {pendingCount > 0
              ? `${pendingCount} ${pendingCount === 1 ? 'tarefa pendente' : 'tarefas pendentes'}`
              : tasks.length === 0
              ? 'Nenhuma tarefa criada ainda'
              : 'Todas as tarefas concluídas!'}
          </p>
        </div>

        <button
          onClick={handleNewTask}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 20px',
            borderRadius: 12,
            border: '1px solid rgba(124,58,237,0.5)',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(124,58,237,0.4)',
            transition: 'box-shadow 0.2s ease, transform 0.15s ease',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 32px rgba(124,58,237,0.7)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(124,58,237,0.4)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova Tarefa
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'pending', 'completed'] as StatusFilter[]).map(f => (
            <FilterChip key={f} active={statusFilter === f} onClick={() => setStatusFilter(f)}>
              {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendentes' : 'Concluídas'}
            </FilterChip>
          ))}
        </div>

        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />

        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'high', 'medium', 'low'] as PriorityFilter[]).map(f => (
            <FilterChip key={f} active={priorityFilter === f} onClick={() => setPriorityFilter(f)}>
              {f === 'all' ? 'Qualquer prioridade' : PRIORITY_LABEL[f]}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* ── XP summary strip ────────────────────────────────── */}
      {userProfile && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 12,
            background: 'rgba(124,58,237,0.06)',
            border: '1px solid rgba(124,58,237,0.14)',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#a78bfa">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
                <span style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 700 }}>
                  Nível {userProfile.level}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#60a5fa">
                  <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
                </svg>
                <span style={{ fontSize: '0.82rem', color: '#60a5fa', fontWeight: 700 }}>
                  {userProfile.xp.toLocaleString('pt-BR')} XP total
                </span>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
              {(userProfile.level * 1000).toLocaleString('pt-BR')} XP p/ nível {userProfile.level + 1}
            </span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                borderRadius: 999,
                background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                boxShadow: '0 0 10px rgba(124,58,237,0.6)',
                width: `${Math.min(((userProfile.xp % (userProfile.level * 1000)) / (userProfile.level * 1000)) * 100, 100)}%`,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* ── Task list ───────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div
            style={{
              width: 36, height: 36,
              border: '3px solid rgba(124,58,237,0.22)',
              borderTopColor: '#7c3aed',
              borderRadius: '50%',
              animation: 'spin 0.75s linear infinite',
            }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            paddingTop: 80,
            paddingBottom: 80,
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.3 }}>
            {tasks.length === 0 ? '📋' : '🔍'}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.95rem', margin: 0, marginBottom: 8 }}>
            {tasks.length === 0 ? 'Nenhuma tarefa criada ainda' : 'Nenhuma tarefa corresponde aos filtros'}
          </p>
          {tasks.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem', margin: 0 }}>
              Crie sua primeira tarefa e comece a ganhar XP!
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(task => (
            <div key={task.id} style={{ animation: 'taskIn 0.25s ease' }}>
              <TaskCard
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
                completing={completing === task.id}
                deleting={deleting === task.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
