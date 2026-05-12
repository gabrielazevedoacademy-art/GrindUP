'use client'

import Link from 'next/link'
import type { DailyMission } from '@/lib/missions'

export default function DailyMissions({
  missions,
  plan,
}: {
  missions: DailyMission[]
  plan: string
}) {
  const completed = missions.filter(m => m.is_completed).length
  const total = missions.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const allDone = total > 0 && completed === total
  const isPro = plan === 'pro' || plan === 'elite'

  return (
    <div
      className="mb-6 rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(124,58,237,0.14)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={2}>
            <circle cx="12" cy="8" r="6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
          </svg>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>Missões de hoje</span>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: allDone ? '#4ade80' : '#a78bfa' }}>
          {completed}/{total} concluídas
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: allDone
            ? 'linear-gradient(90deg, #4ade80, #22d3ee)'
            : 'linear-gradient(90deg, #7c3aed, #a78bfa)',
          borderRadius: 999,
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Mission list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {missions.map(m => (
          <div
            key={m.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 10,
              background: m.is_completed ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${m.is_completed ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.05)'}`,
            }}
          >
            <div style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: m.is_completed ? '#4ade80' : 'transparent',
              border: `1.5px solid ${m.is_completed ? '#4ade80' : 'rgba(255,255,255,0.18)'}`,
            }}>
              {m.is_completed && (
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5 3.5-4" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{
              flex: 1, fontSize: '0.8rem', fontWeight: 500,
              color: m.is_completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.72)',
              textDecoration: m.is_completed ? 'line-through' : 'none',
            }}>
              {m.title}
            </span>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, flexShrink: 0,
              padding: '2px 6px', borderRadius: 5,
              color: m.is_completed ? 'rgba(74,222,128,0.45)' : '#a78bfa',
              background: m.is_completed ? 'rgba(74,222,128,0.07)' : 'rgba(124,58,237,0.12)',
              border: `1px solid ${m.is_completed ? 'rgba(74,222,128,0.12)' : 'rgba(124,58,237,0.2)'}`,
            }}>
              +{m.xp_reward} XP
            </span>
          </div>
        ))}

        {!isPro && (
          <Link href="/planos" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', borderRadius: 10, marginTop: 2,
            background: 'rgba(124,58,237,0.05)',
            border: '1px dashed rgba(124,58,237,0.22)',
            textDecoration: 'none',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth={2}>
              <path strokeLinecap="round" d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(167,139,250,0.7)', flex: 1 }}>
              +6 missões exclusivas Pro/Elite
            </span>
            <span style={{ fontSize: '0.68rem', color: 'rgba(124,58,237,0.6)', flexShrink: 0 }}>
              Ver planos →
            </span>
          </Link>
        )}

        {allDone && (
          <div style={{
            padding: '8px 12px', borderRadius: 10, textAlign: 'center', marginTop: 2,
            background: 'rgba(74,222,128,0.07)',
            border: '1px solid rgba(74,222,128,0.18)',
            fontSize: '0.75rem', fontWeight: 600, color: '#4ade80',
          }}>
            Todas as missões concluídas hoje!
          </div>
        )}
      </div>
    </div>
  )
}
