'use client'

import { useEffect } from 'react'
import Link from 'next/link'

const ROWS = [
  { label: 'Tarefas por dia',  free: '5',  pro: '∞', elite: '∞' },
  { label: 'Metas ativas',     free: '3',  pro: '∞', elite: '∞' },
  { label: 'Transações/mês',   free: '20', pro: '∞', elite: '∞' },
  { label: 'Missões diárias',  free: '✗',  pro: '✓', elite: '✓' },
  { label: 'Resumo semanal',   free: '✗',  pro: '✓', elite: '✓' },
  { label: 'Capas premium',    free: '✗',  pro: '✗', elite: '✓' },
  { label: 'Badge Elite',      free: '✗',  pro: '✗', elite: '✓' },
]

export default function UpgradeModal({
  title,
  message,
  onClose,
}: {
  title: string
  message: string
  onClose: () => void
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function cellColor(v: string): string {
    if (v === '✓') return '#4ade80'
    if (v === '✗') return 'rgba(255,255,255,0.2)'
    return '#fff'
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        animation: 'upgradeIn 0.18s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`
        @keyframes upgradeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes upgradeUp  { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes lockPulse  { 0%,100% { box-shadow: 0 0 20px rgba(251,191,36,0.4); } 50% { box-shadow: 0 0 40px rgba(251,191,36,0.8), 0 0 60px rgba(251,191,36,0.3); } }
      `}</style>
      <div
        style={{
          width: '100%', maxWidth: 'min(520px, 95vw)', borderRadius: 24,
          background: 'linear-gradient(145deg, #0d0a1e, #120c22)',
          border: '1px solid rgba(251,191,36,0.25)',
          boxShadow: '0 0 60px rgba(251,191,36,0.12), 0 24px 64px rgba(0,0,0,0.7)',
          padding: '32px 24px',
          animation: 'upgradeUp 0.22s ease',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Lock icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.06))',
            border: '1px solid rgba(251,191,36,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'lockPulse 2s ease-in-out infinite',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', margin: '0 0 8px', textAlign: 'center' }}>
          {title}
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.55 }}>
          {message}
        </p>

        {/* Comparison table */}
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ padding: '10px 16px', fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Recurso
            </div>
            {(['Free', 'Pro', 'Elite'] as const).map((plan, i) => (
              <div key={plan} style={{
                padding: '10px 0', textAlign: 'center',
                fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
                color: i === 0 ? '#9ca3af' : i === 1 ? '#a78bfa' : '#fbbf24',
              }}>
                {plan}
              </div>
            ))}
          </div>

          {/* Rows */}
          {ROWS.map(({ label, free, pro, elite }, idx) => (
            <div
              key={label}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px',
                borderBottom: idx < ROWS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <div style={{ padding: '11px 16px', fontSize: '0.82rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
                {label}
              </div>
              {[free, pro, elite].map((v, i) => (
                <div key={i} style={{
                  padding: '11px 0', textAlign: 'center',
                  fontSize: '0.85rem', fontWeight: 700, color: cellColor(v),
                  background: i === 1 ? 'rgba(124,58,237,0.04)' : i === 2 ? 'rgba(251,191,36,0.04)' : 'transparent',
                }}>
                  {v}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Link
              href="/planos"
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 2,
                padding: '12px 0', borderRadius: 12,
                border: '1px solid rgba(124,58,237,0.5)',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff', fontSize: '0.9rem', fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 0 20px rgba(124,58,237,0.4)',
              }}
            >
              Pro
              <span style={{ fontSize: '0.68rem', fontWeight: 600, opacity: 0.75 }}>R$ 9,90/mês</span>
            </Link>
            <Link
              href="/planos"
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 2,
                padding: '12px 0', borderRadius: 12,
                border: '1px solid rgba(251,191,36,0.5)',
                background: 'linear-gradient(135deg, #b45309, #d97706)',
                color: '#fff', fontSize: '0.9rem', fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 0 20px rgba(251,191,36,0.25)',
              }}
            >
              Elite
              <span style={{ fontSize: '0.68rem', fontWeight: 600, opacity: 0.75 }}>R$ 19,90/mês</span>
            </Link>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '10px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}
