'use client'

import { useState, useEffect } from 'react'

type Plan = {
  id: string
  name: string
  display_name: string
  price: number
  max_tasks_per_month: number | null
  max_active_goals: number | null
  has_missions: boolean
  has_weekly_summary: boolean
  max_themes: number
  has_elite_badge: boolean
  is_active: boolean
}

function BoolBadge({ value }: { value: boolean }) {
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 999,
      fontSize: '0.68rem', fontWeight: 700,
      border: value ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(239,68,68,0.3)',
      background: value ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.08)',
      color: value ? '#4ade80' : '#f87171',
    }}>
      {value ? 'Sim' : 'Não'}
    </span>
  )
}

export default function PlanosPage() {
  const [plans, setPlans]       = useState<Plan[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [saving, setSaving]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/admin/api/plans')
      .then(r => r.json())
      .then(d => { setPlans(d.plans ?? []); setLoading(false) })
      .catch(() => { setError('Erro ao carregar planos'); setLoading(false) })
  }, [])

  async function savePatch(id: string, patch: Partial<Plan>) {
    setSaving(id)
    try {
      await fetch(`/admin/api/plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      setPlans(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
    } finally {
      setSaving(null)
    }
  }

  function startEdit(plan: Plan) {
    setEditingId(plan.id)
    setEditPrice(String(plan.price))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditPrice('')
  }

  async function confirmEdit(plan: Plan) {
    const newPrice = parseFloat(editPrice)
    if (isNaN(newPrice) || newPrice < 0) return
    await savePatch(plan.id, { price: newPrice })
    setEditingId(null)
    setEditPrice('')
  }

  const PLAN_COLORS: Record<string, { primary: string; glow: string }> = {
    free:  { primary: '#9ca3af', glow: 'rgba(156,163,175,0.15)' },
    pro:   { primary: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
    elite: { primary: '#fbbf24', glow: 'rgba(251,191,36,0.15)' },
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px' }} className="planos-page">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.22); }
        input:focus { border-color: rgba(232,92,13,0.55) !important; box-shadow: 0 0 0 3px rgba(232,92,13,0.1); }
        @media (min-width: 768px) { .planos-page { padding: 40px 36px !important; } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', margin: 0, marginBottom: 4 }}>
          Planos
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          Gerencie os planos disponíveis no GrindUP
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
        <div style={{ padding: 20, borderRadius: 14, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#f87171' }}>
          {error}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {plans.map(plan => {
            const colors = PLAN_COLORS[plan.name] ?? PLAN_COLORS.free
            const isSaving = saving === plan.id
            const isEditing = editingId === plan.id
            const isFree = plan.name === 'free'

            return (
              <div
                key={plan.id}
                style={{
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.025)',
                  border: `1px solid ${colors.glow.replace('0.15', '0.25')}`,
                  boxShadow: `0 0 30px ${colors.glow}`,
                  overflow: 'hidden',
                  opacity: isSaving ? 0.7 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {/* Plan header */}
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: colors.glow,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {/* Plan name badge */}
                    <div style={{
                      padding: '5px 16px', borderRadius: 999,
                      background: colors.primary + '22',
                      border: `1px solid ${colors.primary}55`,
                      color: colors.primary,
                      fontSize: '0.85rem', fontWeight: 900,
                      letterSpacing: '0.04em',
                    }}>
                      {plan.display_name}
                    </div>

                    {/* Price editor */}
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>R$</span>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          min={0}
                          step="0.01"
                          autoFocus
                          style={{
                            width: 90, padding: '6px 10px', borderRadius: 8,
                            border: '1px solid rgba(232,92,13,0.4)',
                            background: 'rgba(232,92,13,0.08)',
                            color: '#fff', fontSize: '0.9rem', fontWeight: 700, outline: 'none',
                          }}
                        />
                        <button
                          onClick={() => confirmEdit(plan)}
                          disabled={isSaving}
                          style={{
                            padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                            border: '1px solid rgba(74,222,128,0.4)',
                            background: 'rgba(74,222,128,0.1)',
                            color: '#4ade80', fontSize: '0.78rem', fontWeight: 700,
                          }}
                        >
                          Salvar
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{
                            padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.04)',
                            color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: 600,
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff' }}>
                          {plan.price === 0
                            ? 'Grátis'
                            : `R$ ${plan.price.toFixed(2).replace('.', ',')}/mês`}
                        </span>
                        <button
                          onClick={() => startEdit(plan)}
                          style={{
                            padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
                            border: '1px solid rgba(232,92,13,0.3)',
                            background: 'rgba(232,92,13,0.08)',
                            color: '#fb923c', fontSize: '0.72rem', fontWeight: 700,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          Editar preço
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Active toggle */}
                  <button
                    onClick={() => !isFree && savePatch(plan.id, { is_active: !plan.is_active })}
                    disabled={isSaving || isFree}
                    title={isFree ? 'Plano Free não pode ser desativado' : ''}
                    style={{
                      padding: '7px 16px', borderRadius: 10, cursor: isFree ? 'not-allowed' : 'pointer',
                      border: plan.is_active ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(239,68,68,0.3)',
                      background: plan.is_active ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.08)',
                      color: plan.is_active ? '#4ade80' : '#f87171',
                      fontSize: '0.78rem', fontWeight: 700,
                      opacity: isFree ? 0.5 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {plan.is_active ? '● Ativo' : '○ Inativo'}
                    {isFree && <span style={{ marginLeft: 6, fontSize: '0.65rem' }}>🔒</span>}
                  </button>
                </div>

                {/* Plan features — vertical list */}
                <div>
                  {[
                    { label: 'Tarefas/mês',    value: plan.max_tasks_per_month ?? '∞' },
                    { label: 'Metas ativas',   value: plan.max_active_goals    ?? '∞' },
                    { label: 'Temas',          value: plan.max_themes >= 9999 ? '∞' : plan.max_themes },
                    { label: 'Missões diárias', value: <BoolBadge value={plan.has_missions} /> },
                    { label: 'Resumo semanal', value: <BoolBadge value={plan.has_weekly_summary} /> },
                    { label: 'Badge Elite',    value: <BoolBadge value={plan.has_elite_badge} /> },
                  ].map(({ label, value }, idx, arr) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', gap: 12,
                        padding: '13px 24px',
                        borderBottom: idx < arr.length - 1
                          ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}
                    >
                      <span style={{
                        fontSize: '0.82rem', fontWeight: 500,
                        color: 'rgba(255,255,255,0.5)',
                      }}>
                        {label}
                      </span>
                      {typeof value === 'object' ? value : (
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                          {value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
