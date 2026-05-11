'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientSupabase } from '@/lib/supabase'
import { isLimitReached } from '@/lib/planLimits'
import UpgradeModal from '@/components/UpgradeModal'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type TransactionType = 'income' | 'expense' | 'pending'
type TypeFilter = 'all' | TransactionType
type PeriodKey = 'current_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year' | 'custom'
type SortKey = 'recent' | 'highest' | 'lowest'

type Transaction = {
  id: string
  user_id: string
  title: string
  amount: number
  type: TransactionType
  category: string | null
  date: string
  notes: string | null
  created_at: string
}

type NewTransactionForm = {
  title: string
  amount: string
  type: TransactionType
  category: string
  date: string
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const CATEGORIES: Record<TransactionType, string[]> = {
  income:    ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Outros'],
  expense:   ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Roupas', 'Assinaturas', 'Outros'],
  pending:   ['Salário', 'Freelance', 'Serviço', 'Investimentos', 'Presente', 'Outros'],
}

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'current_month',  label: 'Mês atual'           },
  { key: 'last_month',     label: 'Mês anterior'         },
  { key: 'last_3_months',  label: 'Últimos 3 meses'      },
  { key: 'last_6_months',  label: 'Últimos 6 meses'      },
  { key: 'this_year',      label: 'Este ano'             },
  { key: 'custom',         label: 'Período personalizado' },
]

const BAR_COLORS = ['#a78bfa', '#60a5fa', '#f97316', '#4ade80', '#f59e0b']

const MONTH_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTH_FULL  = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro',
]

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  const abbr = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
  return `${String(day).padStart(2,'0')} ${abbr[month - 1]}. ${year}`
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getPeriodRange(period: PeriodKey, cFrom: string, cTo: string): { from: string; to: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (period) {
    case 'current_month': {
      const lastDay = new Date(y, m + 1, 0).getDate()
      return {
        from: `${y}-${String(m+1).padStart(2,'0')}-01`,
        to:   `${y}-${String(m+1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`,
      }
    }
    case 'last_month': {
      const lm = m === 0 ? 11 : m - 1
      const ly = m === 0 ? y - 1 : y
      const ld = new Date(ly, lm + 1, 0).getDate()
      return {
        from: `${ly}-${String(lm+1).padStart(2,'0')}-01`,
        to:   `${ly}-${String(lm+1).padStart(2,'0')}-${String(ld).padStart(2,'0')}`,
      }
    }
    case 'last_3_months': {
      const s = new Date(y, m - 2, 1)
      return { from: `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-01`, to: todayISO() }
    }
    case 'last_6_months': {
      const s = new Date(y, m - 5, 1)
      return { from: `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}-01`, to: todayISO() }
    }
    case 'this_year':
      return { from: `${y}-01-01`, to: `${y}-12-31` }
    default:
      return { from: cFrom || `${y}-01-01`, to: cTo || todayISO() }
  }
}

function getPeriodLabel(period: PeriodKey, cFrom: string, cTo: string): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  switch (period) {
    case 'current_month': return `${cap(MONTH_FULL[m])} ${y}`
    case 'last_month': {
      const lm = m === 0 ? 11 : m - 1
      const ly = m === 0 ? y - 1 : y
      return `${cap(MONTH_FULL[lm])} ${ly}`
    }
    case 'last_3_months': {
      const s = new Date(y, m - 2, 1)
      return `${MONTH_SHORT[s.getMonth()]} – ${MONTH_SHORT[m]} ${y}`
    }
    case 'last_6_months': {
      const s = new Date(y, m - 5, 1)
      const sy = s.getFullYear()
      return sy === y
        ? `${MONTH_SHORT[s.getMonth()]} – ${MONTH_SHORT[m]} ${y}`
        : `${MONTH_SHORT[s.getMonth()]} ${sy} – ${MONTH_SHORT[m]} ${y}`
    }
    case 'this_year': return String(y)
    default: {
      if (!cFrom || !cTo) return 'Período personalizado'
      const [fy,fm,fd] = cFrom.split('-')
      const [ty,tm,td] = cTo.split('-')
      return `${fd}/${fm}/${fy} – ${td}/${tm}/${ty}`
    }
  }
}

// ─────────────────────────────────────────────────────────────
// SUMMARY CARD
// ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, icon, color, borderColor, bgColor, prefix = '' }: {
  label: string; value: number; icon: React.ReactNode
  color: string; borderColor: string; bgColor: string; prefix?: string
}) {
  return (
    <div style={{
      borderRadius: 16, padding: '18px 20px',
      background: bgColor, border: `1px solid ${borderColor}`,
      boxShadow: `0 0 18px ${borderColor}50`,
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ color, flexShrink: 0 }}>{icon}</div>
        <span style={{ fontSize: '0.73rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 'clamp(0.95rem, 3vw, 1.35rem)', fontWeight: 900, color, letterSpacing: '-0.5px', wordBreak: 'break-word' }}>
        {prefix}{formatBRL(value)}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PROPORTION BAR
// ─────────────────────────────────────────────────────────────
function ProportionBar({ income, expense, pending }: { income: number; expense: number; pending: number }) {
  const total = income + expense + pending
  if (total === 0) return null
  const incPct = Math.round((income  / total) * 100)
  const expPct = Math.round((expense / total) * 100)
  const penPct = 100 - incPct - expPct

  return (
    <div style={{
      borderRadius: 16, padding: '18px 22px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(124,58,237,0.14)',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
          Proporção do período
        </span>
        <div style={{ display: 'flex', gap: 14 }}>
          {incPct > 0 && <span style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 600 }}>▲ {incPct}%</span>}
          {expPct > 0 && <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 600 }}>▼ {expPct}%</span>}
          {penPct > 0 && <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600 }}>⏳ {penPct}%</span>}
        </div>
      </div>
      <div style={{ height: 10, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', display: 'flex' }}>
        {incPct > 0 && (
          <div style={{ width: `${incPct}%`, background: 'linear-gradient(90deg,#16a34a,#4ade80)', boxShadow: '0 0 10px rgba(74,222,128,0.5)', transition: 'width 0.7s ease' }} />
        )}
        {expPct > 0 && (
          <div style={{ width: `${expPct}%`, background: 'linear-gradient(90deg,#ef4444,#f87171)', boxShadow: '0 0 10px rgba(248,113,113,0.4)', transition: 'width 0.7s ease' }} />
        )}
        {penPct > 0 && (
          <div style={{ width: `${penPct}%`, background: 'linear-gradient(90deg,#b45309,#fbbf24)', boxShadow: '0 0 10px rgba(251,191,36,0.4)', transition: 'width 0.7s ease' }} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 4 }}>
        <span style={{ fontSize: '0.7rem', color: '#4ade80' }}>{formatBRL(income)}</span>
        <span style={{ fontSize: '0.7rem', color: '#f87171' }}>{formatBRL(expense)}</span>
        {pending > 0 && <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>{formatBRL(pending)} a receber</span>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CATEGORY BREAKDOWN
// ─────────────────────────────────────────────────────────────
function CategoryBreakdown({ transactions }: { transactions: Transaction[] }) {
  const expenses = transactions.filter(t => t.type === 'expense')
  const totalExp = expenses.reduce((s, t) => s + t.amount, 0)
  if (totalExp === 0) return null

  const map: Record<string, number> = {}
  expenses.forEach(t => {
    const cat = t.category || 'Outros'
    map[cat] = (map[cat] || 0) + t.amount
  })
  const top5 = Object.entries(map).sort(([,a],[,b]) => b - a).slice(0, 5)

  return (
    <div style={{
      borderRadius: 16, padding: '20px 22px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(124,58,237,0.14)',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={2} strokeLinecap="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
          Resumo por categoria — despesas
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {top5.map(([cat, total], i) => {
          const pct = Math.round((total / totalExp) * 100)
          const color = BAR_COLORS[i]
          return (
            <div key={cat}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{cat}</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: '0.78rem', color, fontWeight: 700 }}>{pct}%</span>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{formatBRL(total)}</span>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  background: color,
                  boxShadow: `0 0 8px ${color}60`,
                  width: `${pct}%`,
                  transition: 'width 0.9s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TRANSACTION CARD
// ─────────────────────────────────────────────────────────────
function TransactionCard({
  transaction, onDelete, onMarkReceived, deleting, markingReceived,
}: {
  transaction: Transaction
  onDelete: (tx: Transaction) => void
  onMarkReceived: (tx: Transaction) => void
  deleting: boolean
  markingReceived: boolean
}) {
  const { type } = transaction
  const isIncome    = type === 'income'
  const isPending   = type === 'pending'

  const iconBg    = isIncome ? 'rgba(74,222,128,0.1)'  : isPending ? 'rgba(251,191,36,0.1)'  : 'rgba(248,113,113,0.1)'
  const iconBdr   = isIncome ? 'rgba(74,222,128,0.25)' : isPending ? 'rgba(251,191,36,0.25)' : 'rgba(248,113,113,0.25)'
  const iconColor = isIncome ? '#4ade80'                : isPending ? '#fbbf24'               : '#f87171'
  const amtColor  = isIncome ? '#4ade80'                : isPending ? '#fbbf24'               : '#f87171'
  const amtSign   = isIncome ? '+'                      : isPending ? ''                      : '-'

  return (
    <div style={{
      borderRadius: 14, padding: '14px 18px',
      background: isPending ? 'rgba(251,191,36,0.03)' : 'rgba(255,255,255,0.03)',
      border: isPending ? '1px solid rgba(251,191,36,0.15)' : '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', gap: 14,
      transition: 'border-color 0.2s ease',
    }}>
      {/* Icon */}
      <div style={{
        flexShrink: 0, width: 38, height: 38, borderRadius: 11,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: iconBg, border: `1px solid ${iconBdr}`, color: iconColor,
      }}>
        {isIncome ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
          </svg>
        ) : isPending ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff', overflow: 'hidden', wordBreak: 'break-word' }}>
            {transaction.title}
          </span>
          {transaction.category && (
            <span style={{
              flexShrink: 0, fontSize: '0.65rem', fontWeight: 600, padding: '1px 7px', borderRadius: 999,
              background: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.22)',
            }}>
              {transaction.category}
            </span>
          )}
          {isPending && (
            <span style={{
              flexShrink: 0, fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: 999,
              background: 'rgba(251,191,36,0.14)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              A RECEBER
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)' }}>
          {formatDate(transaction.date)}
        </span>
      </div>

      {/* Amount */}
      <div style={{ flexShrink: 0, textAlign: 'right', marginRight: 6 }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: amtColor, letterSpacing: '-0.3px' }}>
          {amtSign}{formatBRL(transaction.amount)}
        </span>
      </div>

      {/* Mark as received button (only for pending) */}
      {isPending && (
        <button
          onClick={() => onMarkReceived(transaction)}
          disabled={markingReceived}
          title="Marcar como recebida"
          style={{
            flexShrink: 0, height: 30, padding: '0 10px', borderRadius: 8,
            border: '1px solid rgba(74,222,128,0.35)',
            background: 'rgba(74,222,128,0.1)',
            color: '#4ade80', cursor: markingReceived ? 'not-allowed' : 'pointer',
            fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
            opacity: markingReceived ? 0.5 : 1,
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.background = 'rgba(74,222,128,0.2)'
            b.style.boxShadow = '0 0 10px rgba(74,222,128,0.3)'
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.background = 'rgba(74,222,128,0.1)'
            b.style.boxShadow = 'none'
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Recebido
        </button>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(transaction)}
        disabled={deleting}
        aria-label="Deletar transação"
        style={{
          flexShrink: 0, width: 28, height: 28, borderRadius: 7,
          border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.07)',
          color: 'rgba(248,113,113,0.6)', cursor: deleting ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: deleting ? 0.4 : 1, transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement
          b.style.background = 'rgba(239,68,68,0.18)'; b.style.color = '#f87171'; b.style.borderColor = 'rgba(239,68,68,0.45)'
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement
          b.style.background = 'rgba(239,68,68,0.07)'; b.style.color = 'rgba(248,113,113,0.6)'; b.style.borderColor = 'rgba(239,68,68,0.2)'
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" />
        </svg>
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FILTER CHIP
// ─────────────────────────────────────────────────────────────
function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 13px', borderRadius: 999,
        border: active ? '1px solid rgba(124,58,237,0.55)' : '1px solid rgba(255,255,255,0.08)',
        background: active ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)',
        color: active ? '#a78bfa' : 'rgba(255,255,255,0.4)',
        fontSize: '0.78rem', fontWeight: active ? 700 : 500, cursor: 'pointer',
        boxShadow: active ? '0 0 10px rgba(124,58,237,0.2)' : 'none',
        transition: 'all 0.2s ease', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// DELETE CONFIRM MODAL
// ─────────────────────────────────────────────────────────────
function DeleteConfirmModal({ tx, onConfirm, onCancel, loading }: {
  tx: Transaction; onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{
        width: '100%', maxWidth: 380, borderRadius: 18,
        background: 'linear-gradient(145deg,#120c22,#0d0a1e)',
        border: '1px solid rgba(239,68,68,0.3)',
        boxShadow: '0 0 40px rgba(239,68,68,0.15), 0 20px 50px rgba(0,0,0,0.6)',
        padding: '28px 24px', animation: 'slideUp 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Excluir transação?
          </h3>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 6px', lineHeight: 1.5 }}>
          Tem certeza que deseja excluir
        </p>
        <p style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 700, margin: '0 0 22px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          &ldquo;{tx.title}&rdquo;?
        </p>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', margin: '0 0 22px' }}>
          Esta ação não pode ser desfeita.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              border: '1px solid rgba(239,68,68,0.5)',
              background: loading ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg,#dc2626,#ef4444)',
              color: '#fff', fontSize: '0.875rem', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 0 16px rgba(239,68,68,0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// NEW TRANSACTION MODAL
// ─────────────────────────────────────────────────────────────
function NewTransactionModal({ onClose, onSave, saving, saveError }: {
  onClose: () => void; onSave: (form: NewTransactionForm) => Promise<void>; saving: boolean; saveError: string | null
}) {
  const [form, setForm] = useState<NewTransactionForm>({
    title: '', amount: '', type: 'expense',
    category: CATEGORIES.expense[0], date: todayISO(),
  })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function setType(t: TransactionType) {
    setForm(f => ({ ...f, type: t, category: CATEGORIES[t][0] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(form.amount.replace(',', '.'))
    if (!form.title.trim() || isNaN(parsed) || parsed <= 0) return
    await onSave(form)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.07)',
    color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.75rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.45)', marginBottom: 7,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  const TYPE_CONFIG: { key: TransactionType; label: string; color: string; activeBg: string; activeBdr: string }[] = [
    { key: 'income',    label: '▲ Receita',    color: '#4ade80', activeBg: 'rgba(74,222,128,0.12)',  activeBdr: 'rgba(74,222,128,0.5)'  },
    { key: 'expense',   label: '▼ Despesa',    color: '#f87171', activeBg: 'rgba(248,113,113,0.12)', activeBdr: 'rgba(248,113,113,0.5)' },
    { key: 'pending',    label: '⏳ A Receber', color: '#fbbf24', activeBg: 'rgba(251,191,36,0.12)',  activeBdr: 'rgba(251,191,36,0.5)'  },
  ]

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
        width: '100%', maxWidth: 500, borderRadius: 20,
        background: 'linear-gradient(145deg,#120c22,#0d0a1e)',
        border: '1px solid rgba(124,58,237,0.3)',
        boxShadow: '0 0 60px rgba(124,58,237,0.25), 0 24px 64px rgba(0,0,0,0.6)',
        padding: '30px 26px', animation: 'slideUp 0.22s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>Nova Transação</h2>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Type toggle */}
          <div>
            <label style={labelStyle}>Tipo</label>
            <div style={{ display: 'flex', gap: 7 }}>
              {TYPE_CONFIG.map(tc => (
                <button
                  key={tc.key}
                  type="button"
                  onClick={() => setType(tc.key)}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 700,
                    border: form.type === tc.key ? `1px solid ${tc.activeBdr}` : '1px solid rgba(255,255,255,0.08)',
                    background: form.type === tc.key ? tc.activeBg : 'rgba(255,255,255,0.03)',
                    color: form.type === tc.key ? tc.color : 'rgba(255,255,255,0.4)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Título *</label>
            <input
              type="text" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder={form.type === 'income' ? 'Ex: Salário mensal' : form.type === 'pending' ? 'Ex: Projeto XYZ' : 'Ex: Conta de luz'}
              maxLength={120} required style={inputStyle}
            />
          </div>

          {/* Amount + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Valor (R$) *</label>
              <input
                type="number" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0,00" min="0.01" step="0.01" required style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select
                className="periodo-select"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box' as React.CSSProperties['boxSizing'] }}
              >
                {CATEGORIES[form.type].map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label style={labelStyle}>Data</label>
            <input
              type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              style={{ ...inputStyle, background: '#120c22', colorScheme: 'dark' as React.CSSProperties['colorScheme'] }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button" onClick={onClose}
              style={{
                flex: 1, padding: 11, borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={saving || !form.title.trim() || !form.amount}
              style={{
                flex: 2, padding: 11, borderRadius: 10,
                border: '1px solid rgba(124,58,237,0.5)',
                background: saving ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 0 18px rgba(124,58,237,0.45)',
                transition: 'all 0.2s ease',
              }}
            >
              {saving ? 'Salvando...' : 'Registrar'}
            </button>
          </div>

          {saveError && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <svg style={{ flexShrink: 0, marginTop: 1 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={2} strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ fontSize: '0.8rem', color: '#f87171', lineHeight: 1.5 }}>
                {saveError}
              </span>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function FinancasPage() {
  const [transactions, setTransactions]     = useState<Transaction[]>([])
  const [loading, setLoading]               = useState(true)
  const [userId, setUserId]                 = useState<string | null>(null)

  // Period
  const [period, setPeriod]       = useState<PeriodKey>('current_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo,   setCustomTo]   = useState('')

  // List filters / search / sort
  const [typeFilter,     setTypeFilter]     = useState<TypeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [search,         setSearch]         = useState('')
  const [sort,           setSort]           = useState<SortKey>('recent')

  // Modals
  const [showModal,     setShowModal]     = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [saveError,     setSaveError]     = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Transaction | null>(null)
  const [deleting,      setDeleting]      = useState(false)
  const [markingReceived, setMarkingReceived] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ plan: string } | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)

  // ── Fetch ───────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    const supabase = createClientSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const [txRes, profileRes] = await Promise.all([
      supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single(),
    ])
    if (txRes.data) setTransactions(txRes.data as Transaction[])
    if (profileRes.data) setUserProfile(profileRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  // ── New transaction gate ────────────────────────────────────
  function handleNewTransaction() {
    if (userProfile) {
      const monthPrefix = new Date().toISOString().slice(0, 7)
      const monthlyCount = transactions.filter(t => t.created_at.startsWith(monthPrefix)).length
      if (isLimitReached(userProfile.plan, 'maxMonthlyTransactions', monthlyCount)) {
        setShowLimitModal(true)
        return
      }
    }
    setShowModal(true)
  }

  // ── Create ──────────────────────────────────────────────────
  async function handleCreate(form: NewTransactionForm) {
    if (!userId) {
      setSaveError('Usuário não autenticado. Recarregue a página e tente novamente.')
      return
    }
    setSaving(true)
    setSaveError(null)
    const supabase = createClientSupabase()
    const amount = parseFloat(form.amount.replace(',', '.'))
    // Garantir formato YYYY-MM-DD e que o tipo seja válido no banco
    const payload = {
      user_id:  userId,
      title:    form.title.trim(),
      amount,
      type:     form.type,           // 'income' | 'expense' | 'pending'
      category: form.category,
      date:     form.date,           // input[type=date] já retorna YYYY-MM-DD
    }
    console.log('[handleCreate] payload:', payload)
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert(payload)
      .select()
      .single()
    setSaving(false)
    if (error) {
      console.error('[handleCreate] Supabase error:', error)
      setSaveError(`Erro ao salvar: ${error.message}`)
      return
    }
    setTransactions(prev =>
      [data as Transaction, ...prev].sort((a, b) =>
        b.date !== a.date ? b.date.localeCompare(a.date) : b.created_at.localeCompare(a.created_at)
      )
    )
    setSaveError(null)
    setShowModal(false)
  }

  // ── Delete ──────────────────────────────────────────────────
  async function handleDeleteConfirm() {
    if (!confirmDelete) return
    setDeleting(true)
    const supabase = createClientSupabase()
    const { error } = await supabase.from('financial_transactions').delete().eq('id', confirmDelete.id)
    if (!error) setTransactions(prev => prev.filter(t => t.id !== confirmDelete.id))
    setDeleting(false)
    setConfirmDelete(null)
  }

  // ── Mark as received ────────────────────────────────────────
  async function handleMarkReceived(tx: Transaction) {
    setMarkingReceived(tx.id)
    const supabase = createClientSupabase()
    const { error } = await supabase
      .from('financial_transactions')
      .update({ type: 'income' })
      .eq('id', tx.id)
    if (!error) {
      setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, type: 'income' as TransactionType } : t))
    }
    setMarkingReceived(null)
  }

  // ── Period calculations ─────────────────────────────────────
  const periodRange = getPeriodRange(period, customFrom, customTo)
  const periodLabel = getPeriodLabel(period, customFrom, customTo)

  const periodTxs = transactions.filter(t => t.date >= periodRange.from && t.date <= periodRange.to)

  const periodIncome  = periodTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const periodExpense = periodTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const periodPending = periodTxs.filter(t => t.type === 'pending').reduce((s, t) => s + t.amount, 0)
  const periodBalance = periodIncome - periodExpense
  const balancePos    = periodBalance >= 0

  // ── Categories present in period (for filter chips) ────────
  const periodCategories = Array.from(new Set(periodTxs.map(t => t.category).filter(Boolean))) as string[]

  // ── Filtered + sorted list ──────────────────────────────────
  const filtered = periodTxs
    .filter(t => typeFilter === 'all' || t.type === typeFilter)
    .filter(t => categoryFilter === 'all' || t.category === categoryFilter)
    .filter(t => !search.trim() || t.title.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => {
      if (sort === 'highest') return b.amount - a.amount
      if (sort === 'lowest')  return a.amount - b.amount
      if (b.date !== a.date) return b.date.localeCompare(a.date)
      return b.created_at.localeCompare(a.created_at)
    })

  const inputBase: React.CSSProperties = {
    padding: '9px 13px', borderRadius: 9,
    border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(255,255,255,0.04)',
    color: '#fff', fontSize: '0.85rem', outline: 'none', colorScheme: 'dark' as React.CSSProperties['colorScheme'],
  }

  return (
    <div className="min-h-screen px-4 pb-12 pt-10 md:px-8">
      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(22px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes txIn    { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
        input:focus, select:focus {
          border-color: rgba(124,58,237,0.6) !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
        }
        select option { background-color: #1a1a2e !important; color: #fff !important; }
        select.periodo-select {
          background-color: #1a1a2e !important;
          color: white !important;
          border: 1px solid rgba(124,58,237,0.3) !important;
          padding: 8px 16px !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          outline: none !important;
        }
        select.periodo-select option {
          background-color: #1a1a2e !important;
          color: white !important;
        }
        .fin-summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (min-width: 768px) {
          .fin-summary-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>

      {showLimitModal && (
        <UpgradeModal
          title="Limite mensal atingido"
          message="Você atingiu o limite de 20 transações mensais do plano Free. Faça upgrade para transações ilimitadas!"
          onClose={() => setShowLimitModal(false)}
        />
      )}
      {showModal && (
        <NewTransactionModal
          onClose={() => { setShowModal(false); setSaveError(null) }}
          onSave={handleCreate}
          saving={saving}
          saveError={saveError}
        />
      )}
      {confirmDelete && (
        <DeleteConfirmModal
          tx={confirmDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
        />
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: 0, marginBottom: 4 }}>
            Finanças
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.38)', margin: 0 }}>
            {periodLabel}
          </p>
        </div>
        <button
          onClick={handleNewTransaction}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 20px', borderRadius: 12,
            border: '1px solid rgba(124,58,237,0.5)',
            background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
            color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 0 20px rgba(124,58,237,0.4)',
            transition: 'box-shadow 0.2s ease, transform 0.15s ease',
          }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.boxShadow='0 0 32px rgba(124,58,237,0.7)'; b.style.transform='translateY(-1px)' }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.boxShadow='0 0 20px rgba(124,58,237,0.4)'; b.style.transform='translateY(0)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova Transação
        </button>
      </div>

      {/* ── Period selector ──────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        marginBottom: 22, padding: '14px 18px', borderRadius: 14,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.14)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth={2} strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Período
          </span>
        </div>
        <select
          className="periodo-select"
          value={period}
          onChange={e => { setPeriod(e.target.value as PeriodKey); setCustomFrom(''); setCustomTo('') }}
          style={{ minWidth: 180 }}
        >
          {PERIOD_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>

        {period === 'custom' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>De</span>
              <input
                type="date" value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                style={inputBase}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>Até</span>
              <input
                type="date" value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                style={inputBase}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Summary cards ───────────────────────────────────── */}
      <div className="fin-summary-grid" style={{ marginBottom: 16 }}>
        <SummaryCard
          label="Receitas" value={periodIncome}
          color="#4ade80" borderColor="rgba(74,222,128,0.28)" bgColor="rgba(74,222,128,0.06)"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>}
        />
        <SummaryCard
          label="Despesas" value={periodExpense}
          color="#f87171" borderColor="rgba(248,113,113,0.28)" bgColor="rgba(248,113,113,0.06)"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>}
        />
        <SummaryCard
          label="Saldo" value={Math.abs(periodBalance)}
          prefix={periodBalance < 0 ? '-' : ''}
          color={balancePos ? '#a78bfa' : '#f87171'}
          borderColor={balancePos ? 'rgba(167,139,250,0.28)' : 'rgba(248,113,113,0.28)'}
          bgColor={balancePos ? 'rgba(124,58,237,0.07)' : 'rgba(248,113,113,0.07)'}
          icon={balancePos
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
          }
        />
        <SummaryCard
          label="A Receber" value={periodPending}
          color="#fbbf24" borderColor="rgba(251,191,36,0.28)" bgColor="rgba(251,191,36,0.06)"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
      </div>

      {/* Negative balance alert */}
      {!balancePos && periodTxs.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 14px', borderRadius: 10, marginBottom: 14,
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={2} strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontSize: '0.78rem', color: '#f87171', fontWeight: 600 }}>
            Saldo negativo de {formatBRL(Math.abs(periodBalance))} no período
          </span>
        </div>
      )}

      {/* ── Proportion bar ───────────────────────────────────── */}
      <ProportionBar income={periodIncome} expense={periodExpense} pending={periodPending} />

      {/* ── Category breakdown ───────────────────────────────── */}
      <CategoryBreakdown transactions={periodTxs} />

      {/* ── Search + sort ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título..."
            style={{
              ...inputBase, width: '100%', boxSizing: 'border-box',
              paddingLeft: 36,
            }}
          />
        </div>
        <select
          className="periodo-select"
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          style={{ flexShrink: 0 }}
        >
          <option value="recent">Mais recentes</option>
          <option value="highest">Maior valor</option>
          <option value="lowest">Menor valor</option>
        </select>
      </div>

      {/* ── Type + category filters ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'income', 'expense', 'pending'] as TypeFilter[]).map(f => (
            <FilterChip key={f} active={typeFilter === f} onClick={() => setTypeFilter(f)}>
              {f === 'all' ? 'Todas' : f === 'income' ? '▲ Receitas' : f === 'expense' ? '▼ Despesas' : '⏳ A Receber'}
            </FilterChip>
          ))}
        </div>

        {periodCategories.length > 0 && (
          <>
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 2px' }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <FilterChip active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>
                Qualquer categoria
              </FilterChip>
              {periodCategories.map(cat => (
                <FilterChip key={cat} active={categoryFilter === cat} onClick={() => setCategoryFilter(cat)}>
                  {cat}
                </FilterChip>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Transaction list ─────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(124,58,237,0.22)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 70, paddingBottom: 70 }}>
          <div style={{ fontSize: '2.8rem', marginBottom: 14, opacity: 0.25 }}>
            {transactions.length === 0 ? '💰' : '🔍'}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem', margin: '0 0 6px' }}>
            {transactions.length === 0 ? 'Nenhuma transação registrada ainda' : 'Nenhuma transação neste período'}
          </p>
          {transactions.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', margin: 0 }}>
              Registre sua primeira receita ou despesa!
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {filtered.map(tx => (
            <div key={tx.id} style={{ animation: 'txIn 0.22s ease' }}>
              <TransactionCard
                transaction={tx}
                onDelete={setConfirmDelete}
                onMarkReceived={handleMarkReceived}
                deleting={confirmDelete?.id === tx.id && deleting}
                markingReceived={markingReceived === tx.id}
              />
            </div>
          ))}
          {filtered.length > 0 && (
            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.18)', marginTop: 8 }}>
              {filtered.length} {filtered.length === 1 ? 'transação' : 'transações'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
