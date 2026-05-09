'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientSupabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type TransactionType = 'income' | 'expense'
type TypeFilter = 'all' | 'income' | 'expense'

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
  income:  ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Outros'],
  expense: ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Roupas', 'Assinaturas', 'Outros'],
}

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const monthAbbr = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${String(day).padStart(2, '0')} de ${monthAbbr[month - 1]}. ${year}`
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isCurrentMonth(dateStr: string): boolean {
  const now = new Date()
  const [year, month] = dateStr.split('-').map(Number)
  return year === now.getFullYear() && month === now.getMonth() + 1
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
  color,
  borderColor,
  bgColor,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  borderColor: string
  bgColor: string
}) {
  return (
    <div
      style={{
        flex: 1,
        borderRadius: 16,
        padding: '20px 22px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        boxShadow: `0 0 20px ${borderColor}40`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 900, color, letterSpacing: '-0.5px' }}>
        {formatBRL(value)}
      </div>
    </div>
  )
}

function MonthBar({ income, expense }: { income: number; expense: number }) {
  const total = income + expense
  if (total === 0) return null

  const incomePct = Math.round((income / total) * 100)
  const expensePct = 100 - incomePct

  return (
    <div
      style={{
        borderRadius: 16,
        padding: '20px 22px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(124,58,237,0.14)',
        marginBottom: 28,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
          Proporção do mês atual
        </span>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600 }}>
            ▲ Receitas {incomePct}%
          </span>
          <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>
            ▼ Despesas {expensePct}%
          </span>
        </div>
      </div>

      {/* Stacked bar */}
      <div style={{ height: 10, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', display: 'flex' }}>
        <div
          style={{
            width: `${incomePct}%`,
            background: 'linear-gradient(90deg, #16a34a, #4ade80)',
            boxShadow: '0 0 10px rgba(74,222,128,0.5)',
            transition: 'width 0.6s ease',
          }}
        />
        <div
          style={{
            width: `${expensePct}%`,
            background: 'linear-gradient(90deg, #ef4444, #f87171)',
            boxShadow: '0 0 10px rgba(248,113,113,0.4)',
            transition: 'width 0.6s ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: '0.72rem', color: '#4ade80' }}>{formatBRL(income)}</span>
        <span style={{ fontSize: '0.72rem', color: '#f87171' }}>{formatBRL(expense)}</span>
      </div>
    </div>
  )
}

function TransactionCard({
  transaction,
  onDelete,
  deleting,
}: {
  transaction: Transaction
  onDelete: (id: string) => void
  deleting: boolean
}) {
  const isIncome = transaction.type === 'income'

  return (
    <div
      style={{
        borderRadius: 14,
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Type icon */}
      <div
        style={{
          flexShrink: 0,
          width: 40,
          height: 40,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isIncome ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
          border: `1px solid ${isIncome ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
          color: isIncome ? '#4ade80' : '#f87171',
        }}
      >
        {isIncome ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {transaction.title}
          </span>
          {transaction.category && (
            <span
              style={{
                flexShrink: 0,
                fontSize: '0.68rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'rgba(124,58,237,0.12)',
                color: '#a78bfa',
                border: '1px solid rgba(124,58,237,0.25)',
              }}
            >
              {transaction.category}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
          {formatDate(transaction.date)}
        </span>
      </div>

      {/* Amount */}
      <div style={{ flexShrink: 0, textAlign: 'right', marginRight: 8 }}>
        <span
          style={{
            fontSize: '1rem',
            fontWeight: 800,
            color: isIncome ? '#4ade80' : '#f87171',
            letterSpacing: '-0.3px',
          }}
        >
          {isIncome ? '+' : '-'}{formatBRL(transaction.amount)}
        </span>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(transaction.id)}
        disabled={deleting}
        aria-label="Deletar transação"
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
          opacity: deleting ? 0.4 : 1,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement
          b.style.background = 'rgba(239,68,68,0.18)'
          b.style.color = '#f87171'
          b.style.borderColor = 'rgba(239,68,68,0.45)'
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement
          b.style.background = 'rgba(239,68,68,0.07)'
          b.style.color = 'rgba(248,113,113,0.6)'
          b.style.borderColor = 'rgba(239,68,68,0.2)'
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6M14 11v6M9 6V4h6v2" />
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
// MODAL
// ─────────────────────────────────────────────────────────────
function NewTransactionModal({
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void
  onSave: (form: NewTransactionForm) => Promise<void>
  saving: boolean
}) {
  const [form, setForm] = useState<NewTransactionForm>({
    title: '',
    amount: '',
    type: 'expense',
    category: CATEGORIES.expense[0],
    date: todayISO(),
  })

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
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: '1px solid rgba(124,58,237,0.3)',
    background: 'rgba(124,58,237,0.07)',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
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
          width: '100%', maxWidth: 500,
          borderRadius: 20,
          background: 'linear-gradient(145deg, #120c22, #0d0a1e)',
          border: '1px solid rgba(124,58,237,0.3)',
          boxShadow: '0 0 60px rgba(124,58,237,0.25), 0 24px 64px rgba(0,0,0,0.6)',
          padding: '32px 28px',
          animation: 'slideUp 0.22s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Nova Transação
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
          {/* Type toggle */}
          <div>
            <label style={labelStyle}>Tipo</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['income', 'expense'] as TransactionType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
                    fontSize: '0.875rem', fontWeight: 700,
                    border: form.type === t
                      ? `1px solid ${t === 'income' ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)'}`
                      : '1px solid rgba(255,255,255,0.08)',
                    background: form.type === t
                      ? t === 'income' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)'
                      : 'rgba(255,255,255,0.03)',
                    color: form.type === t
                      ? t === 'income' ? '#4ade80' : '#f87171'
                      : 'rgba(255,255,255,0.4)',
                    boxShadow: form.type === t
                      ? t === 'income' ? '0 0 14px rgba(74,222,128,0.18)' : '0 0 14px rgba(248,113,113,0.18)'
                      : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {t === 'income' ? '▲ Receita' : '▼ Despesa'}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder={form.type === 'income' ? 'Ex: Salário mensal' : 'Ex: Conta de luz'}
              maxLength={120}
              required
              style={inputStyle}
            />
          </div>

          {/* Amount + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Valor (R$) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0,00"
                min="0.01"
                step="0.01"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ ...inputStyle, background: '#120c22', cursor: 'pointer' }}
              >
                {CATEGORIES[form.type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label style={labelStyle}>Data</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              style={{ ...inputStyle, background: '#120c22', colorScheme: 'dark' }}
            />
          </div>

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
              disabled={saving || !form.title.trim() || !form.amount}
              style={{
                flex: 2, padding: 12, borderRadius: 10,
                border: '1px solid rgba(124,58,237,0.5)',
                background: saving ? 'rgba(124,58,237,0.3)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#fff',
                fontSize: '0.875rem', fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 0 18px rgba(124,58,237,0.45)',
                transition: 'all 0.2s ease',
              }}
            >
              {saving ? 'Salvando...' : 'Registrar'}
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
export default function FinancasPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // ── Fetch ───────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    const supabase = createClientSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)

    const { data } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (data) setTransactions(data as Transaction[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  // ── Create ──────────────────────────────────────────────────
  async function handleCreate(form: NewTransactionForm) {
    if (!userId) return
    setSaving(true)
    const supabase = createClientSupabase()
    const amount = parseFloat(form.amount.replace(',', '.'))

    const { data, error } = await supabase
      .from('financial_transactions')
      .insert({
        user_id: userId,
        title: form.title.trim(),
        amount,
        type: form.type,
        category: form.category,
        date: form.date,
      })
      .select()
      .single()

    setSaving(false)
    if (!error && data) {
      setTransactions(prev => {
        const next = [data as Transaction, ...prev]
        return next.sort((a, b) => {
          if (b.date !== a.date) return b.date.localeCompare(a.date)
          return b.created_at.localeCompare(a.created_at)
        })
      })
      setShowModal(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (deleting) return
    setDeleting(id)
    const supabase = createClientSupabase()
    const { error } = await supabase.from('financial_transactions').delete().eq('id', id)
    if (!error) setTransactions(prev => prev.filter(t => t.id !== id))
    setDeleting(null)
  }

  // ── Month summary ───────────────────────────────────────────
  const monthTransactions = transactions.filter(t => isCurrentMonth(t.date))
  const monthIncome  = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpense = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const monthBalance = monthIncome - monthExpense

  // ── All categories present in list (for filter) ─────────────
  const allCategories = Array.from(new Set(transactions.map(t => t.category).filter(Boolean))) as string[]

  // ── Filtered list ───────────────────────────────────────────
  const filtered = transactions.filter(t => {
    const matchType = typeFilter === 'all' || t.type === typeFilter
    const matchCat  = categoryFilter === 'all' || t.category === categoryFilter
    return matchType && matchCat
  })

  // ── Current month label ─────────────────────────────────────
  const now = new Date()
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`

  const balancePositive = monthBalance >= 0

  return (
    <div className="min-h-screen px-8 pb-12 pt-10">
      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes txIn    { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.22); }
        input:focus, textarea:focus, select:focus {
          border-color: rgba(124,58,237,0.6) !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
        }
      `}</style>

      {showModal && (
        <NewTransactionModal
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
          saving={saving}
        />
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: 0, marginBottom: 4 }}>
            Finanças
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.38)', margin: 0, textTransform: 'capitalize' }}>
            {monthLabel}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 20px', borderRadius: 12,
            border: '1px solid rgba(124,58,237,0.5)',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            color: '#fff', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 0 20px rgba(124,58,237,0.4)',
            transition: 'box-shadow 0.2s ease, transform 0.15s ease',
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.boxShadow = '0 0 32px rgba(124,58,237,0.7)'
            b.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.boxShadow = '0 0 20px rgba(124,58,237,0.4)'
            b.style.transform = 'translateY(0)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova Transação
        </button>
      </div>

      {/* ── Summary cards ───────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <SummaryCard
          label="Receitas do mês"
          value={monthIncome}
          color="#4ade80"
          borderColor="rgba(74,222,128,0.28)"
          bgColor="rgba(74,222,128,0.06)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
            </svg>
          }
        />
        <SummaryCard
          label="Despesas do mês"
          value={monthExpense}
          color="#f87171"
          borderColor="rgba(248,113,113,0.28)"
          bgColor="rgba(248,113,113,0.06)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
            </svg>
          }
        />
        <SummaryCard
          label="Saldo do mês"
          value={Math.abs(monthBalance)}
          color={balancePositive ? '#a78bfa' : '#f87171'}
          borderColor={balancePositive ? 'rgba(167,139,250,0.28)' : 'rgba(248,113,113,0.28)'}
          bgColor={balancePositive ? 'rgba(124,58,237,0.07)' : 'rgba(248,113,113,0.07)'}
          icon={
            balancePositive ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                <polyline points="16 17 22 17 22 11" />
              </svg>
            )
          }
        />
      </div>

      {/* Negative balance indicator */}
      {!balancePositive && monthTransactions.length > 0 && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 10, marginBottom: 16,
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.22)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={2} strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 600 }}>
            Saldo negativo de {formatBRL(Math.abs(monthBalance))} este mês
          </span>
        </div>
      )}

      {/* ── Month bar chart ──────────────────────────────────── */}
      <MonthBar income={monthIncome} expense={monthExpense} />

      {/* ── Filters ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'income', 'expense'] as TypeFilter[]).map(f => (
            <FilterChip key={f} active={typeFilter === f} onClick={() => setTypeFilter(f)}>
              {f === 'all' ? 'Todas' : f === 'income' ? '▲ Receitas' : '▼ Despesas'}
            </FilterChip>
          ))}
        </div>

        {allCategories.length > 0 && (
          <>
            <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <FilterChip active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')}>
                Qualquer categoria
              </FilterChip>
              {allCategories.map(cat => (
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
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
            {transactions.length === 0 ? '💰' : '🔍'}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.95rem', margin: 0, marginBottom: 8 }}>
            {transactions.length === 0 ? 'Nenhuma transação registrada ainda' : 'Nenhuma transação corresponde aos filtros'}
          </p>
          {transactions.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem', margin: 0 }}>
              Registre sua primeira receita ou despesa!
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(tx => (
            <div key={tx.id} style={{ animation: 'txIn 0.25s ease' }}>
              <TransactionCard
                transaction={tx}
                onDelete={handleDelete}
                deleting={deleting === tx.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
