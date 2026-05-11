'use client'

import { useState, useEffect } from 'react'

type RecentUser = {
  id: string
  full_name: string | null
  username: string | null
  email: string
  plan: string
  created_at: string
}

type Stats = {
  total: number
  freeCount: number
  paidCount: number
  activeToday: number
  recent: RecentUser[]
}

const PLAN_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  free:  { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', border: 'rgba(107,114,128,0.3)' },
  pro:   { bg: 'rgba(124,58,237,0.15)',  color: '#a78bfa', border: 'rgba(124,58,237,0.35)' },
  elite: { bg: 'rgba(234,179,8,0.13)',   color: '#fbbf24', border: 'rgba(234,179,8,0.3)'  },
}

function MetricCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string
  value: string | number
  sub?: string
  color: string
  icon: React.ReactNode
}) {
  return (
    <div style={{
      borderRadius: 16, padding: '20px 22px',
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${color}28`,
      boxShadow: `0 0 24px ${color}0a`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </p>
        <div style={{ color, opacity: 0.7 }}>{icon}</div>
      </div>
      <p style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: '5px 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)' }}>{sub}</p>}
    </div>
  )
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/admin/api/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => { setError('Erro ao carregar dados'); setLoading(false) })
  }, [])

  return (
    <div style={{ padding: '24px 16px', minHeight: '100vh' }} className="adm-page">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .adm-page { padding: 24px 16px; }
        .adm-metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 36px; }
        .adm-table-view  { display: none; }
        .adm-cards-view  { display: flex; flex-direction: column; gap: 10px; }
        @media (min-width: 768px) {
          .adm-page { padding: 40px 36px; }
          .adm-metrics-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
          .adm-table-view { display: block; }
          .adm-cards-view { display: none; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', margin: 0, marginBottom: 4 }}>
          Visão Geral
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          Métricas e atividade recente do GrindUP
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid rgba(232,92,13,0.2)',
            borderTopColor: '#e85c0d',
            borderRadius: '50%', animation: 'spin 0.75s linear infinite',
          }} />
        </div>
      ) : error ? (
        <div style={{
          padding: '20px 24px', borderRadius: 14,
          background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
          color: '#f87171', fontSize: '0.9rem',
        }}>
          {error}
          <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'rgba(248,113,113,0.65)' }}>
            Certifique-se de que SUPABASE_SECRET_KEY está configurada nas variáveis de ambiente.
          </p>
        </div>
      ) : stats && (
        <>
          {/* Metric cards */}
          <div className="adm-metrics-grid">
            <MetricCard
              label="Total de usuários"
              value={stats.total}
              sub="cadastrados"
              color="#fb923c"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path strokeLinecap="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>}
            />
            <MetricCard
              label="Ativos hoje"
              value={stats.activeToday}
              sub="com atividade hoje"
              color="#4ade80"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4l3 3" /></svg>}
            />
            <MetricCard
              label="Plano Free"
              value={stats.freeCount}
              sub={`${stats.total > 0 ? Math.round((stats.freeCount / stats.total) * 100) : 0}% do total`}
              color="#9ca3af"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>}
            />
            <MetricCard
              label="Pagantes"
              value={stats.paidCount}
              sub="Pro + Elite"
              color="#fbbf24"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>}
            />
          </div>

          {/* Recent users */}
          <div style={{
            borderRadius: 18,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(232,92,13,0.12)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                Usuários mais recentes
              </h2>
            </div>
            <div className="adm-table-view" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Nome', 'Email', 'Plano', 'Cadastro'].map(h => (
                      <th key={h} style={{
                        padding: '12px 20px', textAlign: 'left',
                        fontSize: '0.7rem', fontWeight: 700,
                        color: 'rgba(255,255,255,0.35)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((u, i) => {
                    const ps = PLAN_STYLE[u.plan] ?? PLAN_STYLE.free
                    const name = u.full_name || u.username || '—'
                    const initials = name !== '—' ? name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?'
                    return (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: i < stats.recent.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(232,92,13,0.04)'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'linear-gradient(135deg, #e85c0d, #dc2626)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.7rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                            }}>{initials}</div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>{name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                          {u.email || '—'}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.06em', padding: '3px 10px', borderRadius: 999,
                            background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`,
                          }}>{u.plan}</span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)' }}>
                          {new Date(u.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="adm-cards-view" style={{ padding: '12px' }}>
              {stats.recent.map(u => {
                const ps = PLAN_STYLE[u.plan] ?? PLAN_STYLE.free
                const name = u.full_name || u.username || '—'
                const initials = name !== '—' ? name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?'
                return (
                  <div key={u.id} style={{
                    padding: '14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(232,92,13,0.1)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #e85c0d, #dc2626)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                        }}>{initials}</div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.06em', padding: '3px 10px', borderRadius: 999, flexShrink: 0,
                        background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`,
                      }}>{u.plan}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)' }}>
                      {new Date(u.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
