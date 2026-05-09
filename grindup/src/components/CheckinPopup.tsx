'use client'

import { useState, useEffect } from 'react'
import { createClientSupabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────
type Period = 'morning' | 'afternoon' | 'night'

const MOOD_EMOJIS = ['😞', '😕', '😐', '😊', '🤩']

const PERIOD_CONFIG: Record<Period, { emoji: string; greeting: string; question: string }> = {
  morning:   { emoji: '☀️',  greeting: 'Bom dia!',   question: 'Como você está começando o dia?' },
  afternoon: { emoji: '🌤️', greeting: 'Boa tarde!',  question: 'Como está seu dia até agora?' },
  night:     { emoji: '🌙',  greeting: 'Boa noite!',  question: 'Como foi seu dia?' },
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function getTodayLocalDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getCurrentPeriod(): Period {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  return 'night'
}

function computeNewLevel(currentLevel: number, newXp: number): number {
  let level = currentLevel
  while (newXp >= level * 1000) level++
  return level
}

// ─────────────────────────────────────────────────────────────
// XP ANIMATION
// ─────────────────────────────────────────────────────────────
function XpAnim({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1600)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed', top: '40%', left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999, pointerEvents: 'none',
        animation: 'xpFloat 1.6s ease forwards',
        fontSize: '1.75rem', fontWeight: 900,
        color: '#4ade80',
        textShadow: '0 0 20px rgba(74,222,128,0.9), 0 0 40px rgba(74,222,128,0.5)',
        letterSpacing: '-0.5px',
      }}
    >
      +15 XP
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function CheckinPopup() {
  const [visible, setVisible] = useState(false)
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showXp, setShowXp] = useState(false)

  const period = getCurrentPeriod()
  const config = PERIOD_CONFIG[period]

  useEffect(() => {
    // Don't show if user already dismissed this period today in this session
    const sessionKey = `checkin_dismissed_${period}_${getTodayLocalDate()}`
    if (sessionStorage.getItem(sessionKey)) return

    async function check() {
      const supabase = createClientSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('mood_checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', getTodayLocalDate())
        .eq('period', period)
        .maybeSingle()

      if (!data) {
        setTimeout(() => setVisible(true), 2000)
      }
    }
    check()
  }, [period])

  function handleDismiss() {
    const sessionKey = `checkin_dismissed_${period}_${getTodayLocalDate()}`
    sessionStorage.setItem(sessionKey, '1')
    setVisible(false)
  }

  async function handleSave() {
    if (mood === null || energy === null) return
    setSaving(true)

    const supabase = createClientSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error } = await supabase
      .from('mood_checkins')
      .insert({
        user_id: user.id,
        mood,
        energy,
        notes: notes.trim() || null,
        date: getTodayLocalDate(),
        period,
      })

    if (!error) {
      // Award XP
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, level')
        .eq('id', user.id)
        .single()

      if (profile) {
        const newXp = profile.xp + 15
        const newLevel = computeNewLevel(profile.level, newXp)
        await supabase
          .from('profiles')
          .update({ xp: newXp, level: newLevel })
          .eq('id', user.id)
      }

      setShowXp(true)
      setTimeout(() => {
        setShowXp(false)
        setVisible(false)
      }, 1700)
    } else {
      // Conflict (already done) — just close
      setVisible(false)
    }

    setSaving(false)
  }

  if (!visible) return null

  const canSave = mood !== null && energy !== null && !saving

  return (
    <>
      <style>{`
        @keyframes xpFloat {
          0%   { opacity: 0; transform: translateX(-50%) translateY(0px) scale(0.8); }
          20%  { opacity: 1; transform: translateX(-50%) translateY(-20px) scale(1.15); }
          60%  { opacity: 1; transform: translateX(-50%) translateY(-60px) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-100px) scale(0.85); }
        }
        @keyframes checkinFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes checkinSlideUp {
          from { opacity: 0; transform: translateY(28px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .checkin-emoji-btn:hover { transform: scale(1.15) !important; }
        .checkin-energy-btn:hover { border-color: rgba(251,191,36,0.5) !important; background: rgba(251,191,36,0.1) !important; }
      `}</style>

      {showXp && <XpAnim onDone={() => {}} />}

      {/* Overlay */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          animation: 'checkinFadeIn 0.25s ease',
        }}
      >
        {/* Card */}
        <div
          style={{
            width: '100%', maxWidth: 420, borderRadius: 24,
            background: 'linear-gradient(145deg, #140d26, #0d0a1e)',
            border: '1px solid rgba(124,58,237,0.35)',
            boxShadow: '0 0 80px rgba(124,58,237,0.3), 0 32px 80px rgba(0,0,0,0.7)',
            padding: '32px 28px',
            animation: 'checkinSlideUp 0.28s ease',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: '2.4rem', marginBottom: 10, lineHeight: 1 }}>{config.emoji}</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
              {config.greeting}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.42)', margin: 0, lineHeight: 1.5 }}>
              {config.question}
            </p>
          </div>

          {/* Mood */}
          <div style={{ marginBottom: 22 }}>
            <p style={{
              fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.07em', color: 'rgba(255,255,255,0.38)',
              textAlign: 'center', marginBottom: 12,
            }}>
              Como está seu humor?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              {MOOD_EMOJIS.map((emoji, i) => {
                const val = i + 1
                const active = mood === val
                return (
                  <button
                    key={val}
                    className="checkin-emoji-btn"
                    onClick={() => setMood(val)}
                    title={['Muito ruim', 'Ruim', 'Neutro', 'Bom', 'Ótimo'][i]}
                    style={{
                      fontSize: '1.85rem',
                      background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                      border: active ? '2px solid rgba(124,58,237,0.65)' : '2px solid transparent',
                      borderRadius: 14,
                      padding: '7px 9px',
                      cursor: 'pointer',
                      transform: active ? 'scale(1.2)' : 'scale(1)',
                      transition: 'all 0.15s ease',
                      boxShadow: active ? '0 0 18px rgba(124,58,237,0.5)' : 'none',
                    }}
                  >
                    {emoji}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Energy */}
          <div style={{ marginBottom: 22 }}>
            <p style={{
              fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.07em', color: 'rgba(255,255,255,0.38)',
              textAlign: 'center', marginBottom: 12,
            }}>
              Nível de energia
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(lvl => {
                const active = energy !== null && lvl <= energy
                return (
                  <button
                    key={lvl}
                    className="checkin-energy-btn"
                    onClick={() => setEnergy(lvl)}
                    style={{
                      width: 46, height: 46, borderRadius: 12, fontSize: '1.15rem',
                      border: active ? '2px solid rgba(251,191,36,0.65)' : '2px solid rgba(255,255,255,0.09)',
                      background: active ? 'rgba(251,191,36,0.14)' : 'rgba(255,255,255,0.03)',
                      color: active ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s ease',
                      boxShadow: active ? '0 0 12px rgba(251,191,36,0.3)' : 'none',
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
              placeholder="Anotação opcional sobre como você está..."
              rows={2}
              maxLength={500}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 10,
                border: '1px solid rgba(124,58,237,0.2)',
                background: 'rgba(124,58,237,0.05)',
                color: '#fff', fontSize: '0.85rem', outline: 'none',
                resize: 'none', lineHeight: 1.55, boxSizing: 'border-box',
              }}
            />
          </div>

          {/* XP preview */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '8px 14px', borderRadius: 10, marginBottom: 20,
            background: 'rgba(74,222,128,0.07)',
            border: '1px solid rgba(74,222,128,0.15)',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#4ade80">
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
            </svg>
            <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 600 }}>
              +15 XP ao registrar este check-in
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleDismiss}
              style={{
                flex: 1, padding: '12px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Agora não
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              style={{
                flex: 2, padding: '12px', borderRadius: 10,
                border: '1px solid rgba(124,58,237,0.5)',
                background: canSave
                  ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                  : 'rgba(124,58,237,0.25)',
                color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                cursor: canSave ? 'pointer' : 'not-allowed',
                boxShadow: canSave ? '0 0 20px rgba(124,58,237,0.45)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {saving ? 'Registrando...' : 'Registrar Check-in'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
