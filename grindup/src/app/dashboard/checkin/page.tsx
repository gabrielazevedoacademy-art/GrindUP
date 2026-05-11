'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClientSupabase } from '@/lib/supabase'
import { getLevelFromXP } from '@/lib/levels'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type Period = 'morning' | 'afternoon' | 'night'

type MoodCheckin = {
  id: string
  user_id: string
  mood: number
  energy: number
  notes: string | null
  date: string
  period: Period | null
  created_at: string
}

type PeriodStatus = 'done' | 'pending' | 'locked'

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const MOOD_EMOJIS = ['😞', '😕', '😐', '😊', '🤩']
const MOOD_LABELS = ['Muito ruim', 'Ruim', 'Neutro', 'Bom', 'Ótimo']

const MOOD_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#fbbf24',
  4: '#84cc16',
  5: '#22c55e',
}

const PERIOD_META: Record<Period, { label: string; range: string; icon: string }> = {
  morning:   { label: 'Manhã',  range: '05h – 11h59', icon: '☀️'  },
  afternoon: { label: 'Tarde',  range: '12h – 17h59', icon: '🌤️' },
  night:     { label: 'Noite',  range: '18h – 04h59', icon: '🌙'  },
}

const PERIODS: Period[] = ['morning', 'afternoon', 'night']

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getTodayStr(): string {
  return formatLocalDate(new Date())
}

function isPeriodAvailable(period: Period): boolean {
  const h = new Date().getHours()
  if (period === 'morning')   return h >= 5
  if (period === 'afternoon') return h >= 12
  // night: 18h+ or 00-04h
  return h >= 18 || h < 5
}

function getPeriodStatus(period: Period, todayCheckins: MoodCheckin[]): PeriodStatus {
  const done = todayCheckins.some(c => c.period === period)
  if (done) return 'done'
  if (isPeriodAvailable(period)) return 'pending'
  return 'locked'
}

function computeStreak(history: MoodCheckin[]): number {
  const datesWithCheckin = new Set(history.map(c => c.date))
  let streak = 0
  const cursor = new Date()

  // If today has no check-in, still count streak from yesterday
  if (!datesWithCheckin.has(formatLocalDate(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  while (datesWithCheckin.has(formatLocalDate(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function formatDayFull(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  const isToday = dateStr === getTodayStr()
  if (isToday) return 'Hoje'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === formatLocalDate(yesterday)) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
}

// ─────────────────────────────────────────────────────────────
// XP POPUP
// ─────────────────────────────────────────────────────────────
function XpPopup({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1600)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999, pointerEvents: 'none',
      animation: 'xpFloat 1.6s ease forwards',
      fontSize: '1.75rem', fontWeight: 900,
      color: '#4ade80',
      textShadow: '0 0 20px rgba(74,222,128,0.9), 0 0 40px rgba(74,222,128,0.5)',
      letterSpacing: '-0.5px',
    }}>
      +15 XP
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// INLINE CHECK-IN MODAL
// ─────────────────────────────────────────────────────────────
function CheckinModal({
  period,
  onClose,
  onSave,
  saving,
}: {
  period: Period
  onClose: () => void
  onSave: (mood: number, energy: number, notes: string) => Promise<void>
  saving: boolean
}) {
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  const meta = PERIOD_META[period]
  const canSave = mood !== null && energy !== null && !saving

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.18s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%', maxWidth: 420, borderRadius: 22,
          background: 'linear-gradient(145deg, #120c22, #0d0a1e)',
          border: '1px solid rgba(124,58,237,0.3)',
          boxShadow: '0 0 60px rgba(124,58,237,0.25), 0 24px 64px rgba(0,0,0,0.6)',
          padding: '30px 26px',
          animation: 'slideUp 0.22s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>{meta.icon}</span>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Check-in da {meta.label}
              </h2>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                {meta.range}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Mood */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.38)', textAlign: 'center', marginBottom: 12 }}>
            Como está seu humor?
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 7 }}>
            {MOOD_EMOJIS.map((emoji, i) => {
              const val = i + 1
              const active = mood === val
              return (
                <button
                  key={val}
                  title={MOOD_LABELS[i]}
                  onClick={() => setMood(val)}
                  style={{
                    fontSize: '1.8rem',
                    background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                    border: active ? '2px solid rgba(124,58,237,0.65)' : '2px solid transparent',
                    borderRadius: 12, padding: '6px 8px', cursor: 'pointer',
                    transform: active ? 'scale(1.18)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                    boxShadow: active ? '0 0 16px rgba(124,58,237,0.5)' : 'none',
                  }}
                >
                  {emoji}
                </button>
              )
            })}
          </div>
        </div>

        {/* Energy */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.38)', textAlign: 'center', marginBottom: 12 }}>
            Nível de energia
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 7 }}>
            {[1, 2, 3, 4, 5].map(lvl => {
              const active = energy !== null && lvl <= energy
              return (
                <button
                  key={lvl}
                  onClick={() => setEnergy(lvl)}
                  style={{
                    width: 44, height: 44, borderRadius: 11, fontSize: '1.1rem',
                    border: active ? '2px solid rgba(251,191,36,0.65)' : '2px solid rgba(255,255,255,0.09)',
                    background: active ? 'rgba(251,191,36,0.14)' : 'rgba(255,255,255,0.03)',
                    color: active ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: active ? '0 0 10px rgba(251,191,36,0.3)' : 'none',
                  }}
                >
                  ⚡
                </button>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 18 }}>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anotação opcional..."
            rows={2}
            maxLength={500}
            style={{
              width: '100%', padding: '10px 13px', borderRadius: 10,
              border: '1px solid rgba(124,58,237,0.22)',
              background: 'rgba(124,58,237,0.06)',
              color: '#fff', fontSize: '0.85rem', outline: 'none',
              resize: 'none', lineHeight: 1.55, boxSizing: 'border-box',
            }}
          />
        </div>

        {/* XP hint */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '7px 12px', borderRadius: 9, marginBottom: 16,
          background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.15)',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#4ade80"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10" /></svg>
          <span style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 600 }}>+15 XP ao registrar</span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.55)',
              fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => mood !== null && energy !== null && onSave(mood, energy, notes)}
            disabled={!canSave}
            style={{
              flex: 2, padding: '11px', borderRadius: 10,
              border: '1px solid rgba(124,58,237,0.5)',
              background: canSave ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(124,58,237,0.25)',
              color: '#fff', fontSize: '0.875rem', fontWeight: 700,
              cursor: canSave ? 'pointer' : 'not-allowed',
              boxShadow: canSave ? '0 0 18px rgba(124,58,237,0.45)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {saving ? 'Registrando...' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PERIOD CARD
// ─────────────────────────────────────────────────────────────
function PeriodCard({
  period,
  status,
  checkin,
  onCheckin,
}: {
  period: Period
  status: PeriodStatus
  checkin: MoodCheckin | null
  onCheckin: (period: Period) => void
}) {
  const meta = PERIOD_META[period]

  const borderColor =
    status === 'done'    ? 'rgba(74,222,128,0.25)'  :
    status === 'pending' ? 'rgba(124,58,237,0.28)'  :
    'rgba(255,255,255,0.06)'

  const bgColor =
    status === 'done'    ? 'rgba(74,222,128,0.05)'  :
    status === 'pending' ? 'rgba(124,58,237,0.06)'  :
    'rgba(255,255,255,0.02)'

  const glow =
    status === 'done'    ? '0 0 18px rgba(74,222,128,0.07)'  :
    status === 'pending' ? '0 0 18px rgba(124,58,237,0.08)'  :
    'none'

  return (
    <div
      style={{
        borderRadius: 16, padding: '20px 18px',
        border: `1px solid ${borderColor}`,
        background: bgColor, boxShadow: glow,
        display: 'flex', flexDirection: 'column', gap: 12,
        opacity: status === 'locked' ? 0.5 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{meta.icon}</span>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>{meta.label}</p>
            <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>{meta.range}</p>
          </div>
        </div>

        {/* Status badge */}
        {status === 'done' && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.07em',
            textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999,
            background: 'rgba(74,222,128,0.14)', color: '#4ade80',
            border: '1px solid rgba(74,222,128,0.3)',
          }}>✅ Feito</span>
        )}
        {status === 'pending' && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.07em',
            textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999,
            background: 'rgba(251,191,36,0.1)', color: '#fbbf24',
            border: '1px solid rgba(251,191,36,0.28)',
          }}>⏳ Pendente</span>
        )}
        {status === 'locked' && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.07em',
            textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999,
            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>🔒 Em breve</span>
        )}
      </div>

      {/* Done: show result */}
      {status === 'done' && checkin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '1.5rem' }}>{MOOD_EMOJIS[checkin.mood - 1]}</span>
            <span style={{ fontSize: '0.75rem', color: MOOD_COLORS[checkin.mood], fontWeight: 700 }}>
              {MOOD_LABELS[checkin.mood - 1]}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {[1, 2, 3, 4, 5].map(lvl => (
              <span
                key={lvl}
                style={{
                  fontSize: '0.75rem',
                  color: lvl <= checkin.energy ? '#fbbf24' : 'rgba(255,255,255,0.12)',
                }}
              >
                ⚡
              </span>
            ))}
          </div>
          {checkin.notes && (
            <p style={{
              width: '100%', margin: 0, fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.4)', lineHeight: 1.5,
              fontStyle: 'italic',
            }}>
              &ldquo;{checkin.notes}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Pending: CTA button */}
      {status === 'pending' && (
        <button
          onClick={() => onCheckin(period)}
          style={{
            padding: '9px 16px', borderRadius: 10,
            border: '1px solid rgba(124,58,237,0.45)',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            color: '#fff', fontSize: '0.82rem', fontWeight: 700,
            cursor: 'pointer', alignSelf: 'flex-start',
            boxShadow: '0 0 14px rgba(124,58,237,0.4)',
            transition: 'box-shadow 0.15s ease',
          }}
        >
          Fazer check-in agora →
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MOOD CHART (last 14 days)
// ─────────────────────────────────────────────────────────────
function MoodChart({ history }: { history: MoodCheckin[] }) {
  const days = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (13 - i))
      const dateStr = formatLocalDate(d)
      const dayCheckins = history.filter(c => c.date === dateStr)
      const avgMood = dayCheckins.length > 0
        ? dayCheckins.reduce((s, c) => s + c.mood, 0) / dayCheckins.length
        : null
      return { dateStr, date: d, avgMood, count: dayCheckins.length }
    })
  }, [history])

  const maxBar = 100

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
        {days.map(({ dateStr, avgMood, date }) => {
          const pct = avgMood !== null ? ((avgMood - 1) / 4) * 70 + 15 : 0 // 15%-85%
          const color = avgMood !== null ? MOOD_COLORS[Math.round(avgMood)] : 'rgba(255,255,255,0.06)'
          const isToday = dateStr === getTodayStr()

          return (
            <div
              key={dateStr}
              title={avgMood !== null ? `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}: ${MOOD_LABELS[Math.round(avgMood) - 1]}` : 'Sem check-in'}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: maxBar }}
            >
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: avgMood !== null ? `${pct}%` : '8%',
                    borderRadius: '4px 4px 2px 2px',
                    background: color,
                    boxShadow: avgMood !== null ? `0 0 8px ${color}88` : 'none',
                    transition: 'height 0.4s ease',
                    border: isToday ? '1px solid rgba(167,139,250,0.5)' : 'none',
                    minHeight: 4,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
      {/* X-axis labels: only first, middle, last */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)' }}>
          {formatDateLabel(days[0].dateStr)}
        </span>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)' }}>
          {formatDateLabel(days[6].dateStr)}
        </span>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)' }}>
          Hoje
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function CheckinPage() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ xp: number; level: number } | null>(null)
  const [todayCheckins, setTodayCheckins] = useState<MoodCheckin[]>([])
  const [history, setHistory] = useState<MoodCheckin[]>([])
  const [activePeriod, setActivePeriod] = useState<Period | null>(null)
  const [saving, setSaving] = useState(false)
  const [showXp, setShowXp] = useState(false)

  // ── Fetch data ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const supabase = createClientSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const today = getTodayStr()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const fromDate = formatLocalDate(thirtyDaysAgo)

    const [profileRes, todayRes, histRes] = await Promise.all([
      supabase.from('profiles').select('xp, level').eq('id', user.id).single(),
      supabase.from('mood_checkins').select('*').eq('user_id', user.id).eq('date', today),
      supabase.from('mood_checkins').select('*').eq('user_id', user.id)
        .gte('date', fromDate).order('date', { ascending: false }),
    ])

    if (profileRes.data) setUserProfile(profileRes.data)
    if (todayRes.data) setTodayCheckins(todayRes.data as MoodCheckin[])
    if (histRes.data) setHistory(histRes.data as MoodCheckin[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Save checkin ──────────────────────────────────────────
  async function handleSave(mood: number, energy: number, notes: string) {
    if (!userId || !activePeriod) return
    setSaving(true)

    const supabase = createClientSupabase()
    const { data, error } = await supabase
      .from('mood_checkins')
      .insert({
        user_id: userId,
        mood,
        energy,
        notes: notes.trim() || null,
        date: getTodayStr(),
        period: activePeriod,
      })
      .select()
      .single()

    if (!error && data) {
      // Update local state
      const newCheckin = data as MoodCheckin
      setTodayCheckins(prev => [...prev, newCheckin])
      setHistory(prev => [newCheckin, ...prev])

      // Award XP
      if (userProfile) {
        const newXp = userProfile.xp + 15
        const newLevel = getLevelFromXP(newXp)
        await supabase
          .from('profiles')
          .update({ xp: newXp, level: newLevel })
          .eq('id', userId)
        setUserProfile({ xp: newXp, level: newLevel })
      }

      setShowXp(true)
      setTimeout(() => setShowXp(false), 1700)
    }

    setSaving(false)
    setActivePeriod(null)
  }

  // ── Computed values ───────────────────────────────────────
  const streak = useMemo(() => computeStreak(history), [history])

  const avgMood = useMemo(() => {
    if (!history.length) return null
    return history.reduce((s, c) => s + c.mood, 0) / history.length
  }, [history])

  const avgEnergy = useMemo(() => {
    if (!history.length) return null
    return history.reduce((s, c) => s + c.energy, 0) / history.length
  }, [history])

  // Group history by date (excluding today)
  const historyByDate = useMemo(() => {
    const today = getTodayStr()
    const grouped: Record<string, MoodCheckin[]> = {}
    for (const c of history) {
      if (c.date === today) continue
      if (!grouped[c.date]) grouped[c.date] = []
      grouped[c.date].push(c)
    }
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a))
  }, [history])

  const todayCount = todayCheckins.length
  const totalCheckins = history.length

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 pb-12 pt-10 md:px-8" style={{ overflowX: 'hidden' }}>
      <style>{`
        @keyframes xpFloat {
          0%   { opacity: 0; transform: translateX(-50%) translateY(0px) scale(0.8); }
          20%  { opacity: 1; transform: translateX(-50%) translateY(-20px) scale(1.15); }
          60%  { opacity: 1; transform: translateX(-50%) translateY(-60px) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-100px) scale(0.85); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea::placeholder { color: rgba(255,255,255,0.22); }
        textarea:focus { border-color: rgba(124,58,237,0.6) !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.12); }
        .ci-periods-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .ci-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (min-width: 768px) {
          .ci-periods-grid { grid-template-columns: repeat(3, 1fr); }
          .ci-stats-grid   { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>

      {showXp && <XpPopup onDone={() => setShowXp(false)} />}

      {activePeriod && (
        <CheckinModal
          period={activePeriod}
          onClose={() => setActivePeriod(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: 0, marginBottom: 4 }}>
          Check-in
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.38)', margin: 0 }}>
          {todayCount === 0
            ? 'Nenhum check-in feito hoje ainda'
            : todayCount === 3
            ? 'Todos os check-ins de hoje concluídos!'
            : `${todayCount}/3 check-ins feitos hoje`}
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid rgba(124,58,237,0.22)',
            borderTopColor: '#7c3aed',
            borderRadius: '50%', animation: 'spin 0.75s linear infinite',
          }} />
        </div>
      ) : (
        <>
          {/* ── Today's periods ─────────────────────────────── */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 14px' }}>
              Turnos de hoje
            </h2>
            <div className="ci-periods-grid">
              {PERIODS.map(p => (
                <PeriodCard
                  key={p}
                  period={p}
                  status={getPeriodStatus(p, todayCheckins)}
                  checkin={todayCheckins.find(c => c.period === p) ?? null}
                  onCheckin={setActivePeriod}
                />
              ))}
            </div>
          </section>

          {/* ── Stats strip ─────────────────────────────────── */}
          <section style={{ marginBottom: 32 }}>
            <div className="ci-stats-grid">
              {[
                {
                  label: 'Humor médio',
                  value: avgMood !== null ? MOOD_EMOJIS[Math.round(avgMood) - 1] : '—',
                  sub: avgMood !== null ? MOOD_LABELS[Math.round(avgMood) - 1] : 'sem dados',
                  color: avgMood !== null ? MOOD_COLORS[Math.round(avgMood)] : 'rgba(255,255,255,0.2)',
                },
                {
                  label: 'Energia média',
                  value: avgEnergy !== null ? avgEnergy.toFixed(1) : '—',
                  sub: 'de 5.0',
                  color: '#fbbf24',
                },
                {
                  label: 'Streak',
                  value: streak > 0 ? `${streak}d` : '—',
                  sub: streak === 1 ? 'dia seguido' : 'dias seguidos',
                  color: '#f97316',
                },
                {
                  label: 'Total (30d)',
                  value: totalCheckins,
                  sub: `check-in${totalCheckins !== 1 ? 's' : ''}`,
                  color: '#a78bfa',
                },
              ].map(stat => (
                <div
                  key={stat.label}
                  style={{
                    borderRadius: 14, padding: '16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(124,58,237,0.12)',
                  }}
                >
                  <p style={{ margin: '0 0 6px', fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {stat.label}
                  </p>
                  <p style={{ margin: '0 0 2px', fontSize: '1.6rem', fontWeight: 900, color: stat.color, lineHeight: 1 }}>
                    {stat.value}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)' }}>
                    {stat.sub}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Mood chart ──────────────────────────────────── */}
          {history.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 16px' }}>
                Humor — últimos 14 dias
              </h2>
              <div style={{
                borderRadius: 16, padding: '20px 20px 14px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(124,58,237,0.12)',
              }}>
                <MoodChart history={history} />
                {/* Legend */}
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                  {Object.entries(MOOD_COLORS).map(([k, color]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>
                        {MOOD_LABELS[Number(k) - 1]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── History ─────────────────────────────────────── */}
          {historyByDate.length > 0 && (
            <section>
              <h2 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 14px' }}>
                Histórico — últimos 30 dias
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {historyByDate.map(([dateStr, checkins]) => (
                  <div
                    key={dateStr}
                    style={{
                      borderRadius: 14, padding: '14px 16px',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {/* Date header */}
                    <p style={{ margin: '0 0 10px', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'capitalize' }}>
                      {formatDayFull(dateStr)}
                    </p>

                    {/* Periods done that day */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {PERIODS.map(p => {
                        const c = checkins.find(ch => ch.period === p)
                        if (!c) return null
                        return (
                          <div
                            key={p}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '6px 12px', borderRadius: 10,
                              background: 'rgba(124,58,237,0.07)',
                              border: '1px solid rgba(124,58,237,0.14)',
                            }}
                          >
                            <span style={{ fontSize: '0.85rem' }}>{PERIOD_META[p].icon}</span>
                            <span style={{ fontSize: '0.85rem' }}>{MOOD_EMOJIS[c.mood - 1]}</span>
                            <div style={{ display: 'flex', gap: 2 }}>
                              {[1, 2, 3, 4, 5].map(lvl => (
                                <span key={lvl} style={{ fontSize: '0.6rem', color: lvl <= c.energy ? '#fbbf24' : 'rgba(255,255,255,0.1)' }}>⚡</span>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Notes if any */}
                    {checkins.some(c => c.notes) && (
                      <div style={{ marginTop: 8 }}>
                        {checkins.filter(c => c.notes).map(c => (
                          <p key={c.id} style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.32)', fontStyle: 'italic', lineHeight: 1.5 }}>
                            {PERIOD_META[c.period ?? 'morning'].icon} &ldquo;{c.notes}&rdquo;
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {history.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.3 }}>😐</div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.95rem', margin: 0, marginBottom: 8 }}>
                Nenhum check-in nos últimos 30 dias
              </p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem', margin: 0 }}>
                Registre seu primeiro check-in e ganhe 15 XP!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
