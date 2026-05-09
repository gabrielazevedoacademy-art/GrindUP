'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientSupabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type Event = {
  id: string
  user_id: string
  title: string
  description: string | null
  start_at: string
  end_at: string | null
  color: string
  created_at: string
}

type NewEventForm = {
  title: string
  description: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  color: string
}

type CalendarDay = {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const COLOR_OPTIONS = [
  { value: '#7c3aed', label: 'Roxo' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#f59e0b', label: 'Amarelo' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#ec4899', label: 'Rosa' },
]

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const days: CalendarDay[] = []

  // Padding from previous month
  for (let i = 0; i < firstDay.getDay(); i++) {
    const d = new Date(year, month, -firstDay.getDay() + i + 1)
    days.push({ date: d, isCurrentMonth: false, isToday: false })
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    days.push({
      date,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
    })
  }

  // Padding from next month to fill remaining cells (always 6 rows = 42 cells)
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false, isToday: false })
  }

  return days
}

function isoDateStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function localDateStr(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function localTimeStr(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function dateTimeToISO(date: string, time: string): string {
  return new Date(`${date}T${time || '00:00'}:00`).toISOString()
}

function eventsForDay(events: Event[], date: Date): Event[] {
  const dayStr = isoDateStr(date)
  return events.filter(e => {
    const eDate = new Date(e.start_at)
    return isoDateStr(eDate) === dayStr
  })
}

// ─────────────────────────────────────────────────────────────
// EVENT PILL
// ─────────────────────────────────────────────────────────────
function EventPill({
  event,
  onClick,
}: {
  event: Event
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      onClick={onClick}
      title={event.title}
      style={{
        width: '100%',
        padding: '2px 6px',
        borderRadius: 4,
        background: event.color + '28',
        border: `1px solid ${event.color}55`,
        color: event.color,
        fontSize: '0.7rem',
        fontWeight: 700,
        textAlign: 'left',
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        transition: 'background 0.15s ease',
        lineHeight: 1.4,
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLButtonElement).style.background = event.color + '45'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLButtonElement).style.background = event.color + '28'
      }}
    >
      {event.title}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// CALENDAR CELL
// ─────────────────────────────────────────────────────────────
function CalendarCell({
  day,
  events,
  onDayClick,
  onEventClick,
}: {
  day: CalendarDay
  events: Event[]
  onDayClick: (date: Date) => void
  onEventClick: (event: Event, e: React.MouseEvent) => void
}) {
  const [hovered, setHovered] = useState(false)
  const visible = events.slice(0, 2)
  const overflow = events.length - visible.length

  return (
    <div
      onClick={() => onDayClick(day.date)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minHeight: 96,
        padding: '8px 6px 6px',
        borderRadius: 10,
        border: day.isToday
          ? '1.5px solid rgba(124,58,237,0.7)'
          : '1px solid rgba(255,255,255,0.04)',
        background: day.isToday
          ? 'rgba(124,58,237,0.08)'
          : hovered && day.isCurrentMonth
          ? 'rgba(255,255,255,0.04)'
          : 'transparent',
        boxShadow: day.isToday ? '0 0 14px rgba(124,58,237,0.2)' : 'none',
        cursor: day.isCurrentMonth ? 'pointer' : 'default',
        transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        position: 'relative',
      }}
    >
      {/* Day number */}
      <span
        style={{
          fontSize: '0.8rem',
          fontWeight: day.isToday ? 900 : day.isCurrentMonth ? 600 : 400,
          color: day.isToday
            ? '#a78bfa'
            : day.isCurrentMonth
            ? 'rgba(255,255,255,0.8)'
            : 'rgba(255,255,255,0.18)',
          lineHeight: 1,
          marginBottom: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {day.isToday && (
          <span
            style={{
              display: 'inline-block',
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              boxShadow: '0 0 10px rgba(124,58,237,0.7)',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 900,
              textAlign: 'center',
              lineHeight: '22px',
            }}
          >
            {day.date.getDate()}
          </span>
        )}
        {!day.isToday && day.date.getDate()}
      </span>

      {/* Event pills */}
      {visible.map(ev => (
        <EventPill
          key={ev.id}
          event={ev}
          onClick={e => { e.stopPropagation(); onEventClick(ev, e) }}
        />
      ))}

      {overflow > 0 && (
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: 'rgba(167,139,250,0.7)',
            paddingLeft: 4,
          }}
        >
          +{overflow} mais
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NEW EVENT MODAL
// ─────────────────────────────────────────────────────────────
function NewEventModal({
  initialDate,
  onClose,
  onSave,
  saving,
}: {
  initialDate: string
  onClose: () => void
  onSave: (form: NewEventForm) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState<NewEventForm>({
    title: '',
    description: '',
    startDate: initialDate,
    startTime: '09:00',
    endDate: initialDate,
    endTime: '10:00',
    color: '#7c3aed',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    await onSave(form)
  }

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
          width: '100%', maxWidth: 500, borderRadius: 20,
          background: 'linear-gradient(145deg, #120c22, #0d0a1e)',
          border: '1px solid rgba(124,58,237,0.3)',
          boxShadow: '0 0 60px rgba(124,58,237,0.25), 0 24px 64px rgba(0,0,0,0.6)',
          padding: '32px 28px',
          animation: 'slideUp 0.22s ease',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Novo Evento
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
            <label style={labelStyle}>Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Reunião de equipe"
              maxLength={120}
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Descrição</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Detalhes do evento..."
              rows={2}
              maxLength={500}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
            />
          </div>

          {/* Start row */}
          <div>
            <label style={labelStyle}>Início</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                required
                style={{ ...inputStyle, colorScheme: 'dark', background: '#120c22' }}
              />
              <input
                type="time"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                style={{ ...inputStyle, colorScheme: 'dark', background: '#120c22', width: 110 }}
              />
            </div>
          </div>

          {/* End row */}
          <div>
            <label style={labelStyle}>Fim</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                style={{ ...inputStyle, colorScheme: 'dark', background: '#120c22' }}
              />
              <input
                type="time"
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                style={{ ...inputStyle, colorScheme: 'dark', background: '#120c22', width: 110 }}
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label style={labelStyle}>Cor</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {COLOR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.label}
                  onClick={() => setForm(f => ({ ...f, color: opt.value }))}
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: opt.value,
                    border: form.color === opt.value
                      ? '3px solid #fff'
                      : '3px solid transparent',
                    boxShadow: form.color === opt.value
                      ? `0 0 0 2px ${opt.value}, 0 0 14px ${opt.value}88`
                      : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Color preview strip */}
          <div
            style={{
              height: 4, borderRadius: 999,
              background: form.color,
              boxShadow: `0 0 12px ${form.color}88`,
              transition: 'background 0.2s ease, box-shadow 0.2s ease',
            }}
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: 12, borderRadius: 10,
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
                flex: 2, padding: 12, borderRadius: 10,
                border: '1px solid rgba(124,58,237,0.5)',
                background: saving || !form.title.trim()
                  ? 'rgba(124,58,237,0.3)'
                  : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer',
                boxShadow: saving || !form.title.trim() ? 'none' : '0 0 18px rgba(124,58,237,0.45)',
                transition: 'all 0.2s ease',
              }}
            >
              {saving ? 'Salvando...' : 'Criar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// EVENT DETAIL MODAL
// ─────────────────────────────────────────────────────────────
function EventDetailModal({
  event,
  onClose,
  onDelete,
  deleting,
}: {
  event: Event
  onClose: () => void
  onDelete: (id: string) => Promise<void>
  deleting: boolean
}) {
  const [confirm, setConfirm] = useState(false)

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
          width: '100%', maxWidth: 420, borderRadius: 20,
          background: 'linear-gradient(145deg, #120c22, #0d0a1e)',
          border: '1px solid rgba(124,58,237,0.3)',
          boxShadow: '0 0 60px rgba(124,58,237,0.25), 0 24px 64px rgba(0,0,0,0.6)',
          padding: '28px 24px',
          animation: 'slideUp 0.22s ease',
        }}
      >
        {/* Color bar */}
        <div
          style={{
            height: 4, borderRadius: 999, marginBottom: 20,
            background: event.color,
            boxShadow: `0 0 14px ${event.color}88`,
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.3 }}>
            {event.title}
          </h2>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: 8,
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

        {/* Info rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', margin: 0, fontWeight: 600 }}>
                {localDateStr(event.start_at)}, {localTimeStr(event.start_at)}
              </p>
              {event.end_at && (
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>
                  até {localDateStr(event.end_at)}, {localTimeStr(event.end_at)}
                </p>
              )}
            </div>
          </div>

          {event.description && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }}>
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" />
              </svg>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.55 }}>
                {event.description}
              </p>
            </div>
          )}
        </div>

        {/* Delete */}
        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            style={{
              width: '100%', padding: '10px', borderRadius: 10,
              border: '1px solid rgba(239,68,68,0.25)',
              background: 'rgba(239,68,68,0.08)',
              color: '#f87171',
              fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.16)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.4)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.25)'
            }}
          >
            Deletar evento
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: 0 }}>
              Tem certeza? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setConfirm(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => onDelete(event.id)}
                disabled={deleting}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: '1px solid rgba(239,68,68,0.4)',
                  background: deleting ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.25)',
                  color: '#f87171',
                  fontSize: '0.83rem', fontWeight: 700,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Deletando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SHARED STYLES
// ─────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600,
  color: 'rgba(255,255,255,0.55)', marginBottom: 8,
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid rgba(124,58,237,0.3)',
  background: 'rgba(124,58,237,0.07)',
  color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function AgendaPage() {
  const today = new Date()

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [userId, setUserId] = useState<string | null>(null)

  const [showNewModal, setShowNewModal] = useState(false)
  const [newModalDate, setNewModalDate] = useState(isoDateStr(today))
  const [saving, setSaving] = useState(false)

  const [detailEvent, setDetailEvent] = useState<Event | null>(null)
  const [deleting, setDeleting] = useState(false)

  const calendarDays = buildCalendarDays(viewYear, viewMonth)

  // ── Fetch ───────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    const supabase = createClientSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // Fetch events for ±1 month range to cover calendar padding days
    const from = new Date(viewYear, viewMonth - 1, 1).toISOString()
    const to = new Date(viewYear, viewMonth + 2, 0).toISOString()

    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_at', from)
      .lte('start_at', to)
      .order('start_at', { ascending: true })

    if (data) setEvents(data as Event[])
    setLoading(false)
  }, [viewYear, viewMonth])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // ── Navigation ──────────────────────────────────────────────
  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function goToday() {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  // ── Create event ────────────────────────────────────────────
  async function handleCreate(form: NewEventForm) {
    if (!userId) return
    setSaving(true)
    const supabase = createClientSupabase()

    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id: userId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_at: dateTimeToISO(form.startDate, form.startTime),
        end_at: form.endDate ? dateTimeToISO(form.endDate, form.endTime) : null,
        color: form.color,
      })
      .select()
      .single()

    setSaving(false)
    if (!error && data) {
      setEvents(prev => [...prev, data as Event].sort(
        (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      ))
      setShowNewModal(false)
    }
  }

  // ── Delete event ────────────────────────────────────────────
  async function handleDelete(eventId: string) {
    setDeleting(true)
    const supabase = createClientSupabase()
    const { error } = await supabase.from('events').delete().eq('id', eventId)
    if (!error) {
      setEvents(prev => prev.filter(e => e.id !== eventId))
      setDetailEvent(null)
    }
    setDeleting(false)
  }

  // ── Day click ───────────────────────────────────────────────
  function handleDayClick(date: Date) {
    setNewModalDate(isoDateStr(date))
    setShowNewModal(true)
  }

  const monthEventCount = events.filter(e => {
    const d = new Date(e.start_at)
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth
  }).length

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-8 pb-12 pt-10">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.22); }
        input:focus, textarea:focus, select:focus {
          border-color: rgba(124,58,237,0.6) !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
        }
      `}</style>

      {/* Modals */}
      {showNewModal && (
        <NewEventModal
          initialDate={newModalDate}
          onClose={() => setShowNewModal(false)}
          onSave={handleCreate}
          saving={saving}
        />
      )}
      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onDelete={handleDelete}
          deleting={deleting}
        />
      )}

      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: 0, marginBottom: 4 }}>
            Agenda
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.38)', margin: 0 }}>
            {monthEventCount === 0
              ? 'Nenhum evento este mês'
              : `${monthEventCount} evento${monthEventCount !== 1 ? 's' : ''} em ${MONTH_NAMES[viewMonth]}`}
          </p>
        </div>

        <button
          onClick={() => { setNewModalDate(isoDateStr(today)); setShowNewModal(true) }}
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
          Novo Evento
        </button>
      </div>

      {/* ── Calendar card ───────────────────────────────────── */}
      <div
        style={{
          borderRadius: 20,
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(124,58,237,0.14)',
          boxShadow: '0 0 40px rgba(124,58,237,0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Calendar header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={prevMonth}
              style={navBtnStyle}
              onMouseEnter={e => { ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.18)'; ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa' }}
              onMouseLeave={e => { ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0, minWidth: 180, textAlign: 'center' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>

            <button
              onClick={nextMonth}
              style={navBtnStyle}
              onMouseEnter={e => { ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.18)'; ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa' }}
              onMouseLeave={e => { ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Today button */}
          <button
            onClick={goToday}
            style={{
              padding: '7px 16px', borderRadius: 10,
              border: '1px solid rgba(124,58,237,0.3)',
              background: 'rgba(124,58,237,0.08)',
              color: '#a78bfa',
              fontSize: '0.8rem', fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.18)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 12px rgba(124,58,237,0.3)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.08)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
            }}
          >
            Hoje
          </button>
        </div>

        {/* Weekday headers */}
        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            padding: '10px 16px 6px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {WEEKDAYS.map(day => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.28)',
                paddingBottom: 4,
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
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
        ) : (
          <div
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 2,
              padding: '8px 12px 16px',
            }}
          >
            {calendarDays.map((day, idx) => (
              <CalendarCell
                key={idx}
                day={day}
                events={eventsForDay(events, day.date)}
                onDayClick={handleDayClick}
                onEventClick={(ev) => setDetailEvent(ev)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Upcoming events list ─────────────────────────────── */}
      {!loading && monthEventCount > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Eventos de {MONTH_NAMES[viewMonth]}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events
              .filter(e => {
                const d = new Date(e.start_at)
                return d.getFullYear() === viewYear && d.getMonth() === viewMonth
              })
              .map(ev => (
                <button
                  key={ev.id}
                  onClick={() => setDetailEvent(ev)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 16px', borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.025)',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s ease',
                    width: '100%',
                  }}
                  onMouseEnter={e => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = `${ev.color}44`
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.025)'
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.05)'
                  }}
                >
                  <div
                    style={{
                      width: 4, alignSelf: 'stretch', minHeight: 36,
                      borderRadius: 999,
                      background: ev.color,
                      boxShadow: `0 0 8px ${ev.color}88`,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.title}
                    </p>
                    {ev.description && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.description}
                      </p>
                    )}
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                      {new Date(ev.start_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)' }}>
                      {localTimeStr(ev.start_at)}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NAV BUTTON STYLE
// ─────────────────────────────────────────────────────────────
const navBtnStyle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 9,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.05)',
  color: 'rgba(255,255,255,0.5)',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.15s ease',
  flexShrink: 0,
}
