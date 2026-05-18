'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClientSupabase } from '@/lib/supabase'
import { formatDate, formatDateShort } from '@/lib/dateUtils'
import { checkMissionCompletion } from '@/lib/missions'

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
  eventType: 'pontual' | 'com-duracao'
}

type CalendarDay = {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const WEEKDAYS_FULL   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKDAYS_MOBILE = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

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
  const lastDay  = new Date(year, month + 1, 0)
  const days: CalendarDay[] = []

  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push({ date: new Date(year, month, -firstDay.getDay() + i + 1), isCurrentMonth: false, isToday: false })
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    days.push({ date, isCurrentMonth: true, isToday: date.getTime() === today.getTime() })
  }
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false, isToday: false })
  }
  return days
}

function isoDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}


function localTimeStr(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function dateTimeToISO(date: string, time: string): string {
  return new Date(`${date}T${time || '00:00'}:00`).toISOString()
}

function getEventsForDay(events: Event[], date: Date): Event[] {
  const dayStr = isoDateStr(date)
  return events.filter(e => {
    const startStr = isoDateStr(new Date(e.start_at))
    if (startStr === dayStr) return true
    if (!e.end_at) return false
    const endStr = isoDateStr(new Date(e.end_at))
    return endStr === dayStr && endStr !== startStr
  })
}

function isEventEndDay(event: Event, date: Date): boolean {
  if (!event.end_at) return false
  const endStr = isoDateStr(new Date(event.end_at))
  const startStr = isoDateStr(new Date(event.start_at))
  return endStr === isoDateStr(date) && endStr !== startStr
}

function isPontualEvent(event: Event): boolean {
  if (!event.end_at) return true
  const diff = new Date(event.end_at).getTime() - new Date(event.start_at).getTime()
  return diff < 60_000
}

function formatDayTitle(date: Date): string {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(/^\w/, c => c.toUpperCase())
}

// ─────────────────────────────────────────────────────────────
// MOBILE CALENDAR CELL
// ─────────────────────────────────────────────────────────────
function MobileCalendarCell({
  day,
  events,
  onClick,
}: {
  day: CalendarDay
  events: Event[]
  onClick: (date: Date) => void
}) {
  const dots  = events.slice(0, 3)
  const extra = events.length - dots.length

  return (
    <div
      onClick={() => onClick(day.date)}
      style={{
        height: 60,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        cursor: day.isCurrentMonth ? 'pointer' : 'default',
        opacity: day.isCurrentMonth ? 1 : 0.3,
        borderRadius: 8,
        transition: 'background 0.12s ease',
      }}
    >
      {/* Day number */}
      <div
        style={{
          width: 28, height: 28,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: day.isToday
            ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
            : 'transparent',
          boxShadow: day.isToday ? '0 0 10px rgba(124,58,237,0.7)' : 'none',
          color: day.isToday ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          fontSize: 14,
          fontWeight: day.isToday ? 900 : 500,
          lineHeight: 1,
        }}
      >
        {day.date.getDate()}
      </div>

      {/* Event dots */}
      {events.length > 0 && (
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', minHeight: 6 }}>
          {extra > 0 ? (
            <>
              {dots.map(ev => (
                <div
                  key={ev.id}
                  style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: ev.color,
                    boxShadow: `0 0 4px ${ev.color}bb`,
                    flexShrink: 0,
                  }}
                />
              ))}
              <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(167,139,250,0.9)', lineHeight: 1 }}>
                +{extra}
              </span>
            </>
          ) : (
            dots.map(ev => (
              <div
                key={ev.id}
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: ev.color,
                  boxShadow: `0 0 4px ${ev.color}bb`,
                  flexShrink: 0,
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DAY BOTTOM SHEET (mobile)
// ─────────────────────────────────────────────────────────────
function DayBottomSheet({
  date,
  events,
  onClose,
  onEventClick,
  onAddEvent,
}: {
  date: Date
  events: Event[]
  onClose: () => void
  onEventClick: (event: Event) => void
  onAddEvent: () => void
}) {
  const startY = useRef<number | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function handleTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (startY.current === null) return
    const delta = e.changedTouches[0].clientY - startY.current
    if (delta > 60) onClose()
    startY.current = null
  }

  const title = formatDayTitle(date)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 910,
          height: '62vh',
          maxHeight: '82vh',
          background: 'var(--color-bg-modal)',
          borderTop: '2px solid rgba(124,58,237,0.55)',
          borderRadius: '22px 22px 0 0',
          boxShadow: '0 -8px 40px rgba(124,58,237,0.2)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'sheetUp 0.28s cubic-bezier(0.34,1.1,0.64,1)',
          overflow: 'hidden',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 6, flexShrink: 0 }}>
          <div style={{
            width: 40, height: 4, borderRadius: 999,
            background: 'rgba(255,255,255,0.22)',
          }} />
        </div>

        {/* Header */}
        <div style={{
          padding: '4px 20px 14px',
          borderBottom: '1px solid rgba(124,58,237,0.15)',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              border: '1px solid var(--color-divider)',
              background: 'var(--color-bg-card)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Events list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 40, paddingBottom: 20 }}>
              <div style={{ fontSize: '2rem', marginBottom: 10, opacity: 0.3 }}>📅</div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                Nenhum evento neste dia
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => { onClose(); onEventClick(ev) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 14px', borderRadius: 14,
                    border: `1px solid ${ev.color}30`,
                    background: `${ev.color}10`,
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: ev.color, boxShadow: `0 0 8px ${ev.color}99`,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.title}
                    </p>
                    {ev.description && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.description}
                      </p>
                    )}
                  </div>
                  <span style={{ flexShrink: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    {localTimeStr(ev.start_at)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer button */}
        <div style={{ padding: '12px 20px 24px', flexShrink: 0, borderTop: '1px solid rgba(124,58,237,0.12)' }}>
          <button
            onClick={() => { onClose(); onAddEvent() }}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 14,
              border: '1px solid rgba(124,58,237,0.45)',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              color: '#fff', fontSize: '0.9rem', fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 0 18px rgba(124,58,237,0.35)',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo evento neste dia
          </button>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// DESKTOP: EVENT PILL
// ─────────────────────────────────────────────────────────────
function EventPill({ event, onClick, isEndDay }: {
  event: Event
  onClick: (e: React.MouseEvent) => void
  isEndDay?: boolean
}) {
  const pontual = isPontualEvent(event)
  const opacity = isEndDay ? 0.75 : 1

  let content: React.ReactNode
  if (pontual) {
    const time = new Date(event.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    content = <><span style={{ fontWeight: 800 }}>{time}</span>{' '}{event.title}</>
  } else {
    const label = isEndDay ? 'Fim' : 'Início'
    content = <><span style={{ fontWeight: 800 }}>{label}:</span>{' '}{event.title}</>
  }

  return (
    <button
      onClick={onClick}
      title={event.title}
      style={{
        width: '100%', padding: '2px 6px', borderRadius: 4,
        background: 'transparent', border: 'none',
        color: event.color, fontSize: '0.7rem',
        textAlign: 'left', cursor: 'pointer',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        lineHeight: 1.4, flexShrink: 0,
        transition: 'opacity 0.15s ease',
        opacity,
      }}
      onMouseEnter={e => { ;(e.currentTarget as HTMLButtonElement).style.opacity = '0.9' }}
      onMouseLeave={e => { ;(e.currentTarget as HTMLButtonElement).style.opacity = String(opacity) }}
    >
      {content}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// DESKTOP: DAY EVENTS MODAL
// ─────────────────────────────────────────────────────────────
function DayEventsModal({ date, events, onClose, onEventClick }: {
  date: Date; events: Event[]; onClose: () => void; onEventClick: (event: Event) => void
}) {
  const title = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.18s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%', maxWidth: 400, borderRadius: 20,
        background: 'var(--color-bg-modal)',
        border: '1px solid var(--color-border-strong)',
        boxShadow: '0 0 60px rgba(124,58,237,0.25), 0 24px 64px rgba(0,0,0,0.6)',
        padding: '28px 24px', animation: 'slideUp 0.22s ease',
        maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Eventos</h2>
            <p style={{ fontSize: '0.8rem', color: '#a78bfa', margin: '3px 0 0', fontWeight: 600 }}>{title}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-divider)', background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.map(ev => (
            <button key={ev.id} onClick={() => { onClose(); onEventClick(ev) }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: `1px solid ${ev.color}22`, background: `${ev.color}0d`, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s ease' }}
              onMouseEnter={e => { ;(e.currentTarget as HTMLButtonElement).style.background = `${ev.color}22`; ;(e.currentTarget as HTMLButtonElement).style.borderColor = `${ev.color}55` }}
              onMouseLeave={e => { ;(e.currentTarget as HTMLButtonElement).style.background = `${ev.color}0d`; ;(e.currentTarget as HTMLButtonElement).style.borderColor = `${ev.color}22` }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: ev.color, boxShadow: `0 0 8px ${ev.color}99`, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                {ev.description && <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.description}</p>}
              </div>
              <span style={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{localTimeStr(ev.start_at)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// DESKTOP: CALENDAR CELL
// ─────────────────────────────────────────────────────────────
function CalendarCell({ day, events, onDayClick, onEventClick, onOverflowClick }: {
  day: CalendarDay; events: Event[]
  onDayClick: (date: Date) => void
  onEventClick: (event: Event, e: React.MouseEvent) => void
  onOverflowClick: (date: Date, events: Event[], e: React.MouseEvent) => void
}) {
  const [hovered, setHovered] = useState(false)
  const visible  = events.slice(0, 2)
  const overflow = events.length - visible.length

  return (
    <div
      onClick={() => onDayClick(day.date)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: 120, padding: '8px 6px 6px', borderRadius: 10,
        overflow: 'hidden',
        border: day.isToday ? '1.5px solid rgba(124,58,237,0.7)' : '1px solid var(--color-divider)',
        background: day.isToday ? 'rgba(124,58,237,0.08)' : hovered && day.isCurrentMonth ? 'var(--color-bg-card)' : 'transparent',
        boxShadow: day.isToday ? '0 0 14px rgba(124,58,237,0.2)' : 'none',
        cursor: day.isCurrentMonth ? 'pointer' : 'default',
        transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        display: 'flex', flexDirection: 'column', gap: 3, position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <span style={{ fontSize: '0.8rem', fontWeight: day.isToday ? 900 : day.isCurrentMonth ? 600 : 400, color: day.isToday ? '#a78bfa' : day.isCurrentMonth ? 'var(--color-text-primary)' : 'var(--color-text-muted)', lineHeight: 1, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {day.isToday ? (
          <span style={{ display: 'inline-block', width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', boxShadow: '0 0 10px rgba(124,58,237,0.7)', color: '#fff', fontSize: '0.72rem', fontWeight: 900, textAlign: 'center', lineHeight: '22px' }}>
            {day.date.getDate()}
          </span>
        ) : day.date.getDate()}
      </span>
      {visible.map(ev => (
        <EventPill
          key={ev.id}
          event={ev}
          isEndDay={isEventEndDay(ev, day.date)}
          onClick={e => { e.stopPropagation(); onEventClick(ev, e) }}
        />
      ))}
      {overflow > 0 && (
        <button
          onClick={e => { e.stopPropagation(); onOverflowClick(day.date, events, e) }}
          style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(167,139,250,0.8)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '1px 6px', borderRadius: 4, transition: 'color 0.15s ease, background 0.15s ease', flexShrink: 0, marginTop: 'auto' }}
          onMouseEnter={e => { ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa'; ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.14)' }}
          onMouseLeave={e => { ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(167,139,250,0.8)'; ;(e.currentTarget as HTMLButtonElement).style.background = 'none' }}
        >
          +{overflow} mais
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NEW EVENT MODAL
// ─────────────────────────────────────────────────────────────
function NewEventModal({ initialDate, onClose, onSave, saving }: {
  initialDate: string; onClose: () => void; onSave: (form: NewEventForm) => Promise<void>; saving: boolean
}) {
  const [form, setForm] = useState<NewEventForm>({
    title: '', description: '', startDate: initialDate, startTime: '09:00',
    endDate: initialDate, endTime: '10:00', color: '#7c3aed', eventType: 'pontual',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    await onSave(form)
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', animation: 'fadeIn 0.18s ease' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', maxWidth: 500, borderRadius: 20, background: 'var(--color-bg-modal)', border: '1px solid var(--color-border-strong)', boxShadow: '0 0 60px rgba(124,58,237,0.25), 0 24px 64px rgba(0,0,0,0.6)', padding: '32px 28px', animation: 'slideUp 0.22s ease', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Novo Evento</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-divider)', background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Type toggle */}
          <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)' }}>
            {([['pontual', '📅 Pontual'], ['com-duracao', '📆 Com Duração']] as const).map(([type, label]) => {
              const active = form.eventType === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, eventType: type }))}
                  style={{
                    flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                    background: active ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'transparent',
                    color: active ? '#fff' : 'var(--color-text-secondary)',
                    fontSize: '0.83rem', fontWeight: active ? 700 : 500,
                    transition: 'background 0.18s ease, color 0.18s ease',
                    boxShadow: active ? '0 0 14px rgba(124,58,237,0.35)' : 'none',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div>
            <label style={labelStyle}>Título *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Reunião de equipe" maxLength={120} required autoFocus style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Descrição</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes do evento..." rows={2} maxLength={500} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }} />
          </div>
          <div>
            <label style={labelStyle}>{form.eventType === 'pontual' ? 'Data e Horário' : 'Início'}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required style={{ ...inputStyle, background: 'var(--color-bg-modal)' }} />
              <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} style={{ ...inputStyle, background: 'var(--color-bg-modal)', width: 110 }} />
            </div>
          </div>
          {form.eventType === 'com-duracao' && (
            <div>
              <label style={labelStyle}>Fim</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={{ ...inputStyle, background: 'var(--color-bg-modal)' }} />
                <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} style={{ ...inputStyle, background: 'var(--color-bg-modal)', width: 110 }} />
              </div>
            </div>
          )}
          <div>
            <label style={labelStyle}>Cor</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {COLOR_OPTIONS.map(opt => (
                <button key={opt.value} type="button" title={opt.label} onClick={() => setForm(f => ({ ...f, color: opt.value }))}
                  style={{ width: 34, height: 34, borderRadius: '50%', background: opt.value, border: form.color === opt.value ? '3px solid #fff' : '3px solid transparent', boxShadow: form.color === opt.value ? `0 0 0 2px ${opt.value}, 0 0 14px ${opt.value}88` : 'none', cursor: 'pointer', transition: 'all 0.15s ease', flexShrink: 0 }}
                />
              ))}
            </div>
          </div>
          <div style={{ height: 4, borderRadius: 999, background: form.color, boxShadow: `0 0 12px ${form.color}88`, transition: 'background 0.2s ease, box-shadow 0.2s ease' }} />
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--color-divider)', background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={saving || !form.title.trim()} style={{ flex: 2, padding: 12, borderRadius: 10, border: '1px solid rgba(124,58,237,0.5)', background: saving || !form.title.trim() ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: saving || !form.title.trim() ? 'not-allowed' : 'pointer', boxShadow: saving || !form.title.trim() ? 'none' : '0 0 18px rgba(124,58,237,0.45)', transition: 'all 0.2s ease' }}>
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
function EventDetailModal({ event, onClose, onDelete, deleting }: {
  event: Event; onClose: () => void; onDelete: (id: string) => Promise<void>; deleting: boolean
}) {
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', animation: 'fadeIn 0.18s ease' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', maxWidth: 420, borderRadius: 20, background: 'var(--color-bg-modal)', border: '1px solid var(--color-border-strong)', boxShadow: '0 0 60px rgba(124,58,237,0.25), 0 24px 64px rgba(0,0,0,0.6)', padding: '28px 24px', animation: 'slideUp 0.22s ease' }}>
        <div style={{ height: 4, borderRadius: 999, marginBottom: 20, background: event.color, boxShadow: `0 0 14px ${event.color}88` }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.3 }}>{event.title}</h2>
          <button onClick={onClose} style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, border: '1px solid var(--color-divider)', background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0, fontWeight: 600 }}>{formatDate(event.start_at)}, {localTimeStr(event.start_at)}</p>
              {event.end_at && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>até {formatDate(event.end_at)}, {localTimeStr(event.end_at)}</p>}
            </div>
          </div>
          {event.description && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }}>
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" />
              </svg>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.55 }}>{event.description}</p>
            </div>
          )}
        </div>
        {!confirm ? (
          <button onClick={() => setConfirm(true)} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.16)'; ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.4)' }}
            onMouseLeave={e => { ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.25)' }}
          >
            Deletar evento
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', textAlign: 'center', margin: 0 }}>Tem certeza? Esta ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirm(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--color-divider)', background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => onDelete(event.id)} disabled={deleting} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.4)', background: deleting ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.25)', color: '#f87171', fontSize: '0.83rem', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}>
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
  color: 'var(--color-text-secondary)' as string, marginBottom: 8,
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid var(--color-border)',
  background: 'var(--color-accent-soft)',
  color: 'var(--color-text-primary)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
}

const navBtnStyle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 9,
  border: '1px solid var(--color-divider)',
  background: 'var(--color-bg-card)',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.15s ease', flexShrink: 0,
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function AgendaPage() {
  const today = new Date()

  const [events,      setEvents]      = useState<Event[]>([])
  const [loading,     setLoading]     = useState(true)
  const [viewYear,    setViewYear]    = useState(today.getFullYear())
  const [viewMonth,   setViewMonth]   = useState(today.getMonth())
  const [userId,      setUserId]      = useState<string | null>(null)

  const [showNewModal,    setShowNewModal]    = useState(false)
  const [newModalDate,    setNewModalDate]    = useState(isoDateStr(today))
  const [saving,          setSaving]          = useState(false)
  const [detailEvent,     setDetailEvent]     = useState<Event | null>(null)
  const [deleting,        setDeleting]        = useState(false)
  const [dayEventsModal,  setDayEventsModal]  = useState<{ date: Date; events: Event[] } | null>(null)

  // Mobile bottom sheet
  const [mobileSheet, setMobileSheet] = useState<{ date: Date; events: Event[] } | null>(null)

  const calendarDays = buildCalendarDays(viewYear, viewMonth)

  // ── Fetch ───────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    const supabase = createClientSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const from = new Date(viewYear, viewMonth - 3, 1).toISOString()
    const to   = new Date(viewYear, viewMonth + 2, 0).toISOString()
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
        end_at: form.eventType === 'com-duracao' && form.endDate
          ? dateTimeToISO(form.endDate, form.endTime)
          : null,
        color: form.color,
      })
      .select().single()
    setSaving(false)
    if (!error && data) {
      setEvents(prev => [...prev, data as Event].sort(
        (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      ))
      setShowNewModal(false)
      checkMissionCompletion(userId!, 'event_added').catch(() => {})
    }
  }

  // ── Delete event ────────────────────────────────────────────
  async function handleDelete(eventId: string) {
    setDeleting(true)
    const supabase = createClientSupabase()
    const { error } = await supabase.from('events').delete().eq('id', eventId)
    if (!error) { setEvents(prev => prev.filter(e => e.id !== eventId)); setDetailEvent(null) }
    setDeleting(false)
  }

  // ── Desktop day click ───────────────────────────────────────
  function handleDesktopDayClick(date: Date) {
    setNewModalDate(isoDateStr(date))
    setShowNewModal(true)
  }

  // ── Mobile day click ────────────────────────────────────────
  function handleMobileDayClick(date: Date) {
    setMobileSheet({ date, events: getEventsForDay(events, date) })
  }

  // ── Counts ──────────────────────────────────────────────────
  const monthEventCount = events.filter(e => {
    const d = new Date(e.start_at)
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth
  }).length

  // ── Upcoming events (next 5 from today) ─────────────────────
  const todayISO = isoDateStr(today)
  const upcomingEvents = events
    .filter(e => e.start_at >= new Date(todayISO + 'T00:00:00').toISOString())
    .slice(0, 5)

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 pb-12 pt-10 md:px-8">
      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.22); }
        input:focus, textarea:focus, select:focus {
          border-color: rgba(124,58,237,0.6) !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
        }
        /* show/hide by breakpoint */
        .ag-mobile-only { display: block; }
        .ag-desktop-only { display: none; }
        @media (min-width: 768px) {
          .ag-mobile-only  { display: none; }
          .ag-desktop-only { display: block; }
        }
      `}</style>

      {/* ── Modals ──────────────────────────────────────────── */}
      {showNewModal && (
        <NewEventModal
          initialDate={newModalDate}
          onClose={() => setShowNewModal(false)}
          onSave={handleCreate}
          saving={saving}
        />
      )}
      {/* Desktop: day events overflow modal */}
      {dayEventsModal && (
        <DayEventsModal
          date={dayEventsModal.date}
          events={dayEventsModal.events}
          onClose={() => setDayEventsModal(null)}
          onEventClick={ev => setDetailEvent(ev)}
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
      {/* Mobile: bottom sheet */}
      {mobileSheet && (
        <DayBottomSheet
          date={mobileSheet.date}
          events={mobileSheet.events}
          onClose={() => setMobileSheet(null)}
          onEventClick={ev => setDetailEvent(ev)}
          onAddEvent={() => {
            setNewModalDate(isoDateStr(mobileSheet.date))
            setShowNewModal(true)
          }}
        />
      )}

      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-text-primary)', margin: 0, marginBottom: 4 }}>
            Agenda
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
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
            cursor: 'pointer', boxShadow: '0 0 20px rgba(124,58,237,0.4)',
            transition: 'box-shadow 0.2s ease, transform 0.15s ease',
          }}
          onMouseEnter={e => { ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 32px rgba(124,58,237,0.7)'; ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(124,58,237,0.4)'; ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Evento
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
          MOBILE CALENDAR
      ══════════════════════════════════════════════════════ */}
      <div className="ag-mobile-only">
        {/* Mobile calendar card */}
        <div style={{
          borderRadius: 18,
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          marginBottom: 24,
        }}>
          {/* Mobile header: < month year > | Hoje */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--color-divider)',
          }}>
            <button
              onClick={prevMonth}
              style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--color-divider)', background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>

            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, textAlign: 'center', flex: 1 }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={nextMonth}
                style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--color-divider)', background: 'var(--color-bg-card)', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              <button
                onClick={goToday}
                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.35)', background: 'rgba(124,58,237,0.1)', color: '#a78bfa', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Hoje
              </button>
            </div>
          </div>

          {/* Weekday headers — single letter */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '8px 8px 4px', borderBottom: '1px solid var(--color-divider)' }}>
            {WEEKDAYS_MOBILE.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div style={{ width: 28, height: 28, border: '3px solid rgba(124,58,237,0.22)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '60px', gap: 1, padding: '4px 8px 10px' }}>
              {calendarDays.map((day, idx) => (
                <MobileCalendarCell
                  key={idx}
                  day={day}
                  events={getEventsForDay(events, day.date)}
                  onClick={handleMobileDayClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Próximos eventos (mobile) ───────────────────── */}
        <section>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 12px' }}>
            Próximos eventos
          </h3>
          {loading ? null : upcomingEvents.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0, textAlign: 'center', paddingTop: 16, paddingBottom: 16 }}>
              Nenhum evento próximo
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingEvents.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => setDetailEvent(ev)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12,
                    border: '1px solid var(--color-divider)',
                    background: 'var(--color-bg-card)',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: ev.color, boxShadow: `0 0 7px ${ev.color}99`, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.title}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {new Date(ev.start_at).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} · {localTimeStr(ev.start_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ══════════════════════════════════════════════════════
          DESKTOP CALENDAR (unchanged)
      ══════════════════════════════════════════════════════ */}
      <div className="ag-desktop-only">
        <div style={{
          borderRadius: 20,
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 0 40px rgba(124,58,237,0.05)',
          overflow: 'hidden',
        }}>
          {/* Calendar header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--color-divider)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={prevMonth} style={navBtnStyle}
                onMouseEnter={e => { ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.18)'; ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa' }}
                onMouseLeave={e => { ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-card)'; ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, minWidth: 180, textAlign: 'center' }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h2>
              <button onClick={nextMonth} style={navBtnStyle}
                onMouseEnter={e => { ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.18)'; ;(e.currentTarget as HTMLButtonElement).style.color = '#a78bfa' }}
                onMouseLeave={e => { ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-card)'; ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
            <button onClick={goToday} style={{ padding: '7px 16px', borderRadius: 10, border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.08)', color: '#a78bfa', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease' }}
              onMouseEnter={e => { ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.18)'; ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 12px rgba(124,58,237,0.3)' }}
              onMouseLeave={e => { ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.08)'; ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none' }}
            >
              Hoje
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '10px 16px 6px', borderBottom: '1px solid var(--color-divider)' }}>
            {WEEKDAYS_FULL.map(day => (
              <div key={day} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)', paddingBottom: 4 }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{ width: 36, height: 36, border: '3px solid rgba(124,58,237,0.22)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '120px', gap: 2, padding: '8px 12px 16px' }}>
              {calendarDays.map((day, idx) => (
                <CalendarCell
                  key={idx}
                  day={day}
                  events={getEventsForDay(events, day.date)}
                  onDayClick={handleDesktopDayClick}
                  onEventClick={ev => setDetailEvent(ev)}
                  onOverflowClick={(date, evs) => setDayEventsModal({ date, events: evs })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop: upcoming events below calendar */}
        {!loading && monthEventCount > 0 && (
          <div style={{ marginTop: 28 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-muted)', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Próximos eventos
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingEvents.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => setDetailEvent(ev)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--color-divider)', background: 'var(--color-bg-card)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease', width: '100%' }}
                  onMouseEnter={e => { ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-input)'; ;(e.currentTarget as HTMLButtonElement).style.borderColor = `${ev.color}44` }}
                  onMouseLeave={e => { ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-card)'; ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-divider)' }}
                >
                  <div style={{ width: 4, alignSelf: 'stretch', minHeight: 36, borderRadius: 999, background: ev.color, boxShadow: `0 0 8px ${ev.color}88`, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                    {ev.description && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.description}</p>}
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      {formatDateShort(ev.start_at)}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{localTimeStr(ev.start_at)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
