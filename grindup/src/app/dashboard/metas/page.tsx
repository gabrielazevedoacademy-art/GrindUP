'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClientSupabase } from '@/lib/supabase'
import { getLevelFromXP } from '@/lib/levels'
import { isLimitReached } from '@/lib/planLimits'
import { formatDateShort } from '@/lib/dateUtils'
import UpgradeModal from '@/components/UpgradeModal'
import { checkMissionCompletion } from '@/lib/missions'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type Goal = {
  id: string
  user_id: string
  title: string
  description: string | null
  target_value: number
  current_value: number
  unit: string | null
  deadline: string | null
  is_completed: boolean
  xp_reward: number
  created_at: string
}

type StatusFilter = 'all' | 'active' | 'completed'

type XpPopup = {
  id: string
  amount: number
  key: number
}

type NewGoalForm = {
  title: string
  description: string
  targetValue: string
  currentValue: string
  unit: string
  deadline: string
}

type ProgressForm = {
  mode: 'set' | 'add'
  value: string
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function getProgress(current: number, target: number): number {
  if (target <= 0) return 100
  return Math.min((current / target) * 100, 100)
}

function formatValue(value: number, unit: string | null): string {
  if (!unit) return value.toLocaleString('pt-BR')
  const u = unit.trim()
  if (u === 'R$') return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `${value.toLocaleString('pt-BR')} ${u}`
}

function getDeadlineStatus(deadline: string | null): { label: string; color: string; bg: string; border: string } | null {
  if (!deadline) return null
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const dl = new Date(deadline + 'T12:00:00')
  const diffDays = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { label: 'Vencida', color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' }
  }
  if (diffDays <= 7) {
    return { label: `${diffDays}d restantes`, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)' }
  }
  return { label: formatDateShort(deadline), color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' }
}

const UNIT_SUGGESTIONS = ['R$', 'km', 'livros', 'horas', 'kg', 'páginas', 'dias', '%']

// ─────────────────────────────────────────────────────────────
// XP POPUP
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

// ─────────────────────────────────────────────────────────────
// FILTER CHIP
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
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────
function ProgressBar({ percent, completed }: { percent: number; completed: boolean }) {
  return (
    <div
      style={{
        height: 8,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 999,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: '100%',
          borderRadius: 999,
          width: `${percent}%`,
          background: completed
            ? 'linear-gradient(90deg, #4ade80, #22c55e)'
            : 'linear-gradient(90deg, #7c3aed, #a78bfa)',
          boxShadow: completed
            ? '0 0 10px rgba(74,222,128,0.7)'
            : '0 0 12px rgba(124,58,237,0.8)',
          transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          animation: !completed ? 'progressGlow 2s ease-in-out infinite' : 'none',
        }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// GOAL CARD
// ─────────────────────────────────────────────────────────────
function GoalCard({
  goal,
  onProgress,
  onDelete,
  progressing,
  deleting,
}: {
  goal: Goal
  onProgress: (goal: Goal) => void
  onDelete: (id: string) => void
  progressing: boolean
  deleting: boolean
}) {
  const percent = getProgress(goal.current_value, goal.target_value)
  const deadlineStatus = getDeadlineStatus(goal.deadline)

  return (
    <div
      style={{
        borderRadius: 16,
        padding: '22px 24px',
        background: goal.is_completed
          ? 'rgba(74,222,128,0.03)'
          : 'rgba(255,255,255,0.04)',
        border: goal.is_completed
          ? '1px solid rgba(74,222,128,0.2)'
          : '1px solid rgba(124,58,237,0.18)',
        boxShadow: goal.is_completed
          ? '0 0 20px rgba(74,222,128,0.05)'
          : '0 0 18px rgba(124,58,237,0.07)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        animation: 'cardIn 0.25s ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: goal.is_completed ? 'rgba(255,255,255,0.55)' : '#fff',
                lineHeight: 1.3,
              }}
            >
              {goal.title}
            </span>
            {goal.is_completed && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '2px 9px',
                  borderRadius: 999,
                  background: 'rgba(74,222,128,0.15)',
                  color: '#4ade80',
                  border: '1px solid rgba(74,222,128,0.35)',
                  boxShadow: '0 0 8px rgba(74,222,128,0.2)',
                  whiteSpace: 'nowrap',
                }}
              >
                Concluída
              </span>
            )}
          </div>
          {goal.description && (
            <p
              style={{
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.36)',
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {goal.description}
            </p>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={() => onDelete(goal.id)}
          disabled={deleting}
          aria-label="Deletar meta"
          style={{
            flexShrink: 0,
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

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            {formatValue(goal.current_value, goal.unit)}{' '}
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>{' '}
            {formatValue(goal.target_value, goal.unit)}
          </span>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: goal.is_completed ? '#4ade80' : '#a78bfa',
            }}
          >
            {percent.toFixed(0)}%
          </span>
        </div>
        <ProgressBar percent={percent} completed={goal.is_completed} />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* XP badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.72rem',
              fontWeight: 700,
              color: goal.is_completed ? 'rgba(74,222,128,0.5)' : '#4ade80',
              background: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.18)',
              borderRadius: 999,
              padding: '2px 9px',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
            </svg>
            {goal.is_completed ? `+${goal.xp_reward} XP obtido` : `+${goal.xp_reward} XP`}
          </span>

          {/* Deadline */}
          {deadlineStatus && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.72rem',
                fontWeight: 600,
                color: deadlineStatus.color,
                background: deadlineStatus.bg,
                border: `1px solid ${deadlineStatus.border}`,
                borderRadius: 999,
                padding: '2px 9px',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {deadlineStatus.label}
            </span>
          )}
        </div>

        {/* Progress button */}
        {!goal.is_completed && (
          <button
            onClick={() => onProgress(goal)}
            disabled={progressing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 10,
              border: '1px solid rgba(124,58,237,0.4)',
              background: 'rgba(124,58,237,0.12)',
              color: '#a78bfa',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: progressing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: progressing ? 0.5 : 1,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              if (!progressing) {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.22)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 14px rgba(124,58,237,0.35)'
              }
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.12)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Progresso
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NEW GOAL MODAL
// ─────────────────────────────────────────────────────────────
function NewGoalModal({
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void
  onSave: (form: NewGoalForm) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState<NewGoalForm>({
    title: '',
    description: '',
    targetValue: '',
    currentValue: '0',
    unit: '',
    deadline: '',
  })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.targetValue) return
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
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 'min(520px, 95vw)',
          borderRadius: 20,
          background: 'linear-gradient(145deg, #120c22, #0d0a1e)',
          border: '1px solid rgba(124,58,237,0.3)',
          boxShadow: '0 0 60px rgba(124,58,237,0.25), 0 24px 64px rgba(0,0,0,0.6)',
          padding: '28px 20px',
          animation: 'slideUp 0.22s ease',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Nova Meta
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
              placeholder="Ex: Juntar R$ 2.000 de reserva"
              maxLength={120}
              required
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                border: '1px solid rgba(124,58,237,0.3)',
                background: 'rgba(124,58,237,0.07)',
                color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
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
              placeholder="Descreva sua meta e motivação..."
              rows={2}
              maxLength={500}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                border: '1px solid rgba(124,58,237,0.3)',
                background: 'rgba(124,58,237,0.07)',
                color: '#fff', fontSize: '0.875rem', outline: 'none',
                resize: 'vertical', lineHeight: 1.55, boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Target + Current row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Valor alvo *
              </label>
              <input
                type="number"
                value={form.targetValue}
                onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
                placeholder="Ex: 2000"
                min={0}
                step="any"
                required
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  border: '1px solid rgba(124,58,237,0.3)',
                  background: 'rgba(124,58,237,0.07)',
                  color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Valor atual
              </label>
              <input
                type="number"
                value={form.currentValue}
                onChange={e => setForm(f => ({ ...f, currentValue: e.target.value }))}
                placeholder="0"
                min={0}
                step="any"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  border: '1px solid rgba(124,58,237,0.3)',
                  background: 'rgba(124,58,237,0.07)',
                  color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Unit + Deadline row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Unidade
              </label>
              <input
                type="text"
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                placeholder="Ex: R$, km, livros"
                maxLength={20}
                list="unit-suggestions"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  border: '1px solid rgba(124,58,237,0.3)',
                  background: 'rgba(124,58,237,0.07)',
                  color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <datalist id="unit-suggestions">
                {UNIT_SUGGESTIONS.map(u => <option key={u} value={u} />)}
              </datalist>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Prazo
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 10,
                  border: '1px solid rgba(124,58,237,0.3)',
                  background: '#120c22',
                  color: '#fff', fontSize: '0.875rem', outline: 'none',
                  colorScheme: 'dark', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Unit suggestions chips */}
          <div>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', margin: '0 0 8px' }}>Sugestões de unidade:</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {UNIT_SUGGESTIONS.map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, unit: u }))}
                  style={{
                    padding: '3px 12px',
                    borderRadius: 999,
                    border: form.unit === u ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.1)',
                    background: form.unit === u ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                    color: form.unit === u ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* XP preview */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(74,222,128,0.07)',
              border: '1px solid rgba(74,222,128,0.18)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#4ade80">
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
            </svg>
            <span style={{ fontSize: '0.82rem', color: '#4ade80', fontWeight: 600 }}>
              Você ganhará <strong>+100 XP</strong> ao concluir essa meta
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
              disabled={saving || !form.title.trim() || !form.targetValue}
              style={{
                flex: 2, padding: '12px', borderRadius: 10,
                border: '1px solid rgba(124,58,237,0.5)',
                background: saving || !form.title.trim() || !form.targetValue
                  ? 'rgba(124,58,237,0.3)'
                  : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                cursor: saving || !form.title.trim() || !form.targetValue ? 'not-allowed' : 'pointer',
                boxShadow: saving || !form.title.trim() || !form.targetValue ? 'none' : '0 0 18px rgba(124,58,237,0.45)',
                transition: 'all 0.2s ease',
              }}
            >
              {saving ? 'Salvando...' : 'Criar Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PROGRESS MODAL
// ─────────────────────────────────────────────────────────────
function ProgressModal({
  goal,
  onClose,
  onSave,
  saving,
}: {
  goal: Goal
  onClose: () => void
  onSave: (goalId: string, newValue: number) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState<ProgressForm>({ mode: 'add', value: '' })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const previewValue = (() => {
    const n = parseFloat(form.value)
    if (isNaN(n)) return goal.current_value
    if (form.mode === 'set') return Math.max(0, n)
    return Math.max(0, goal.current_value + n)
  })()

  const previewPercent = getProgress(previewValue, goal.target_value)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = parseFloat(form.value)
    if (isNaN(n)) return
    await onSave(goal.id, previewValue)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.18s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%', maxWidth: 'min(440px, 95vw)', borderRadius: 20,
          background: 'linear-gradient(145deg, #120c22, #0d0a1e)',
          border: '1px solid rgba(124,58,237,0.3)',
          boxShadow: '0 0 60px rgba(124,58,237,0.25), 0 24px 64px rgba(0,0,0,0.6)',
          padding: '28px 20px',
          animation: 'slideUp 0.22s ease',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Atualizar Progresso
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

        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', margin: '0 0 24px' }}>
          {goal.title}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Mode toggle */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Modo
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(['add', 'set'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, mode }))}
                  style={{
                    padding: '9px',
                    borderRadius: 10,
                    border: form.mode === mode ? '1px solid rgba(124,58,237,0.55)' : '1px solid rgba(255,255,255,0.08)',
                    background: form.mode === mode ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)',
                    color: form.mode === mode ? '#a78bfa' : 'rgba(255,255,255,0.45)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {mode === 'add' ? '+ Incrementar' : 'Definir valor'}
                </button>
              ))}
            </div>
          </div>

          {/* Value input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {form.mode === 'add' ? 'Quanto adicionar?' : 'Novo valor atual'}
            </label>
            <input
              type="number"
              value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              placeholder={form.mode === 'add' ? `Ex: +50${goal.unit ? ` ${goal.unit}` : ''}` : `Ex: ${goal.current_value}${goal.unit ? ` ${goal.unit}` : ''}`}
              step="any"
              required
              autoFocus
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                border: '1px solid rgba(124,58,237,0.3)',
                background: 'rgba(124,58,237,0.07)',
                color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Live preview */}
          <div
            style={{
              padding: '14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                {formatValue(previewValue, goal.unit)} / {formatValue(goal.target_value, goal.unit)}
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: previewPercent >= 100 ? '#4ade80' : '#a78bfa' }}>
                {previewPercent.toFixed(0)}%
              </span>
            </div>
            <ProgressBar percent={previewPercent} completed={previewPercent >= 100} />
            {previewPercent >= 100 && (
              <p style={{ fontSize: '0.78rem', color: '#4ade80', margin: '8px 0 0', fontWeight: 600, textAlign: 'center' }}>
                🎉 Meta concluída! +100 XP
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
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
              disabled={saving || form.value === ''}
              style={{
                flex: 2, padding: '12px', borderRadius: 10,
                border: '1px solid rgba(124,58,237,0.5)',
                background: saving || form.value === ''
                  ? 'rgba(124,58,237,0.3)'
                  : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                cursor: saving || form.value === '' ? 'not-allowed' : 'pointer',
                boxShadow: saving || form.value === '' ? 'none' : '0 0 18px rgba(124,58,237,0.45)',
                transition: 'all 0.2s ease',
              }}
            >
              {saving ? 'Salvando...' : 'Salvar progresso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function MetasPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [showNewModal, setShowNewModal] = useState(false)
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null)
  const [saving, setSaving] = useState(false)
  const [progressing, setProgressing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [xpPopups, setXpPopups] = useState<XpPopup[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ xp: number; level: number; plan: string } | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const popupCounter = useRef(0)

  // ── Fetch ───────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const supabase = createClientSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)

    const [goalsRes, profileRes] = await Promise.all([
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('xp, level, plan')
        .eq('id', user.id)
        .single(),
    ])

    if (goalsRes.data) setGoals(goalsRes.data as Goal[])
    if (profileRes.data) setUserProfile(profileRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── New goal gate ─────────────────────────────────────────────
  function handleNewGoal() {
    if (userProfile) {
      const active = goals.filter(g => !g.is_completed).length
      if (isLimitReached(userProfile.plan, 'maxActiveGoals', active)) {
        setShowLimitModal(true)
        return
      }
    }
    setShowNewModal(true)
  }

  // ── Create goal ─────────────────────────────────────────────
  async function handleCreate(form: NewGoalForm) {
    if (!userId) return
    setSaving(true)
    const supabase = createClientSupabase()

    const target = parseFloat(form.targetValue)
    const current = parseFloat(form.currentValue) || 0

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        target_value: target,
        current_value: current,
        unit: form.unit.trim() || null,
        deadline: form.deadline || null,
        is_completed: current >= target,
        xp_reward: 100,
      })
      .select()
      .single()

    setSaving(false)
    if (!error && data) {
      setGoals(prev => [data as Goal, ...prev])
      setShowNewModal(false)
    }
  }

  // ── Update progress ─────────────────────────────────────────
  async function handleProgress(goalId: string, newValue: number) {
    if (!userId) return
    setProgressing(goalId)

    const supabase = createClientSupabase()
    const goal = goals.find(g => g.id === goalId)
    if (!goal) { setProgressing(null); return }

    const clampedValue = Math.max(0, newValue)
    const nowCompleted = clampedValue >= goal.target_value
    const wasCompleted = goal.is_completed

    const { error } = await supabase
      .from('goals')
      .update({ current_value: clampedValue, is_completed: nowCompleted })
      .eq('id', goalId)

    if (error) { setProgressing(null); return }

    setGoals(prev =>
      prev.map(g =>
        g.id === goalId
          ? { ...g, current_value: clampedValue, is_completed: nowCompleted }
          : g
      )
    )

    // Award XP on first completion
    if (nowCompleted && !wasCompleted && userProfile) {
      const xpGain = goal.xp_reward
      const newXp = userProfile.xp + xpGain
      const newLevel = getLevelFromXP(newXp)

      await supabase
        .from('profiles')
        .update({ xp: newXp, level: newLevel })
        .eq('id', userId)

      setUserProfile(prev => prev ? { ...prev, xp: newXp, level: newLevel } : prev)

      const key = ++popupCounter.current
      setXpPopups(prev => [...prev, { id: goalId, amount: xpGain, key }])

      checkMissionCompletion(userId!, 'goal_completed').then(results => {
        for (const r of results) {
          const mKey = ++popupCounter.current
          setXpPopups(prev => [...prev, { id: r.missionId, amount: r.xpAwarded, key: mKey }])
        }
      }).catch(() => {})
    }

    checkMissionCompletion(userId!, 'goal_updated').catch(() => {})

    setProgressing(null)
    setProgressGoal(null)
  }

  // ── Delete goal ─────────────────────────────────────────────
  async function handleDelete(goalId: string) {
    if (deleting) return
    setDeleting(goalId)
    const supabase = createClientSupabase()
    const { error } = await supabase.from('goals').delete().eq('id', goalId)
    if (!error) setGoals(prev => prev.filter(g => g.id !== goalId))
    setDeleting(null)
  }

  // ── Filtered goals ──────────────────────────────────────────
  const filtered = goals.filter(g => {
    if (filter === 'active') return !g.is_completed
    if (filter === 'completed') return g.is_completed
    return true
  })

  const activeCount = goals.filter(g => !g.is_completed).length
  const completedCount = goals.filter(g => g.is_completed).length

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 md:px-8 pb-12 pt-10" style={{ overflowX: 'hidden' }}>
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
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(124,58,237,0.6); }
          50%       { box-shadow: 0 0 20px rgba(124,58,237,1), 0 0 30px rgba(167,139,250,0.5); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.22); }
        input:focus, textarea:focus, select:focus {
          border-color: rgba(124,58,237,0.6) !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { opacity: 0.4; }
        .mt-goals-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .mt-filters {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          flex-wrap: nowrap;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .mt-filters::-webkit-scrollbar { display: none; }
        @media (min-width: 768px) {
          .mt-goals-grid { grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); }
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
      {showLimitModal && (
        <UpgradeModal
          title="Limite de metas atingido"
          message="No plano Free você pode ter até 3 metas ativas simultaneamente. Faça upgrade para criar metas ilimitadas."
          onClose={() => setShowLimitModal(false)}
        />
      )}
      {showNewModal && (
        <NewGoalModal
          onClose={() => setShowNewModal(false)}
          onSave={handleCreate}
          saving={saving}
        />
      )}
      {progressGoal && (
        <ProgressModal
          goal={progressGoal}
          onClose={() => setProgressGoal(null)}
          onSave={handleProgress}
          saving={progressing === progressGoal.id}
        />
      )}

      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: 0, marginBottom: 4 }}>
            Metas
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.38)', margin: 0 }}>
            {goals.length === 0
              ? 'Nenhuma meta criada ainda'
              : `${activeCount} em andamento · ${completedCount} concluída${completedCount !== 1 ? 's' : ''}`}
          </p>
        </div>

        <button
          onClick={handleNewGoal}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 20px', borderRadius: 12,
            border: '1px solid rgba(124,58,237,0.5)',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            color: '#fff', fontSize: '0.875rem', fontWeight: 700,
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
          Nova Meta
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="mt-filters" style={{ marginBottom: 24 }}>
        {(['all', 'active', 'completed'] as StatusFilter[]).map(f => (
          <FilterChip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f === 'all' ? `Todas (${goals.length})` : f === 'active' ? `Em andamento (${activeCount})` : `Concluídas (${completedCount})`}
          </FilterChip>
        ))}
      </div>

      {/* ── XP summary strip ────────────────────────────────── */}
      {userProfile && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            padding: '12px 14px', borderRadius: 12,
            background: 'rgba(124,58,237,0.06)',
            border: '1px solid rgba(124,58,237,0.14)',
            marginBottom: 28,
          }}
        >
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
          <div style={{ flex: 1 }}>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%', borderRadius: 999,
                  background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                  boxShadow: '0 0 10px rgba(124,58,237,0.6)',
                  width: `${Math.min(((userProfile.xp % (userProfile.level * 1000)) / (userProfile.level * 1000)) * 100, 100)}%`,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
            {(userProfile.level * 1000).toLocaleString('pt-BR')} XP p/ nível {userProfile.level + 1}
          </span>
        </div>
      )}

      {/* ── Goals grid ──────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
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
        <div style={{ textAlign: 'center', paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.3 }}>
            {goals.length === 0 ? '🎯' : '🔍'}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.95rem', margin: 0, marginBottom: 8 }}>
            {goals.length === 0 ? 'Nenhuma meta criada ainda' : 'Nenhuma meta corresponde ao filtro'}
          </p>
          {goals.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem', margin: 0 }}>
              Crie sua primeira meta e ganhe 100 XP ao concluí-la!
            </p>
          )}
        </div>
      ) : (
        <div className="mt-goals-grid">
          {filtered.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onProgress={g => setProgressGoal(g)}
              onDelete={handleDelete}
              progressing={progressing === goal.id}
              deleting={deleting === goal.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
