'use client'

import { useState, useEffect, useMemo } from 'react'
import { getLevelFromXP, MAX_LEVEL } from '@/lib/levels'

type AdminUser = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  email: string
  plan: string
  xp: number
  level: number
  streak_days: number
  is_active: boolean
  last_activity_date: string | null
  auth_created_at: string
}

type EditForm = {
  full_name: string
  username: string
  plan: string
  xp: number
  streak_days: number
  is_active: boolean
}

const PLAN_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  free:  { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', border: 'rgba(107,114,128,0.3)' },
  pro:   { bg: 'rgba(124,58,237,0.15)',  color: '#a78bfa', border: 'rgba(124,58,237,0.35)' },
  elite: { bg: 'rgba(234,179,8,0.13)',   color: '#fbbf24', border: 'rgba(234,179,8,0.3)'  },
}

const PAGE_SIZE = 20

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditProfileModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser
  onClose: () => void
  onSaved: (updated: Partial<AdminUser>) => void
}) {
  const [form, setForm] = useState<EditForm>({
    full_name:   user.full_name   ?? '',
    username:    user.username    ?? '',
    plan:        user.plan,
    xp:          user.xp,
    streak_days: user.streak_days ?? 0,
    is_active:   user.is_active,
  })
  const computedLevel = getLevelFromXP(form.xp)
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [err, setErr]         = useState<string | null>(null)

  function set<K extends keyof EditForm>(k: K, v: EditForm[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
    setSuccess(false)
    setErr(null)
  }

  async function handleSave() {
    setSaving(true)
    setErr(null)
    try {
      const res = await fetch(`/admin/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, level: computedLevel }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErr(data.error ?? 'Erro ao salvar')
        return
      }
      setSuccess(true)
      onSaved({ ...form, level: computedLevel })
    } catch {
      setErr('Erro de rede')
    } finally {
      setSaving(false)
    }
  }

  const displayName = user.full_name || user.username || 'Usuário'

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 14px', borderRadius: 10,
    border: '1px solid rgba(139,92,246,0.35)',
    background: 'rgba(139,92,246,0.06)',
    color: '#fff', fontSize: '0.875rem', outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.72rem', fontWeight: 700,
    color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: 6,
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`
        .edit-input:focus {
          border-color: rgba(139,92,246,0.7) !important;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.15) !important;
        }
        .edit-input::placeholder { color: rgba(255,255,255,0.2); }
        .edit-input option { background: #120c1e; color: #fff; }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>

      <div style={{
        width: '100%', maxWidth: 'min(520px, 95vw)',
        background: 'linear-gradient(160deg, #0f0a1a 0%, #100c1e 100%)',
        border: '1px solid rgba(139,92,246,0.4)',
        borderRadius: 20,
        boxShadow: '0 0 0 1px rgba(139,92,246,0.1), 0 24px 64px rgba(0,0,0,0.6), 0 0 48px rgba(139,92,246,0.12)',
        animation: 'modalIn 0.22s ease',
        overflow: 'hidden',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '22px 28px 18px',
          borderBottom: '1px solid rgba(139,92,246,0.15)',
          background: 'rgba(139,92,246,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: 'rgba(139,92,246,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Painel Admin
            </p>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#fff' }}>
              Editar Perfil — <span style={{ color: '#a78bfa' }}>{displayName}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
              fontSize: '1.1rem', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Row: full_name + username */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Nome completo</label>
              <input
                className="edit-input"
                type="text"
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                placeholder="Nome completo"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Username</label>
              <input
                className="edit-input"
                type="text"
                value={form.username}
                onChange={e => set('username', e.target.value)}
                placeholder="username"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Row: plan */}
          <div>
            <label style={labelStyle}>Plano</label>
            <select
              className="edit-input"
              value={form.plan}
              onChange={e => set('plan', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="elite">Elite</option>
            </select>
          </div>

          {/* Row: xp + level (auto) + streak */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div>
              <label style={labelStyle}>XP Total</label>
              <input
                className="edit-input"
                type="number"
                min={0}
                value={form.xp}
                onChange={e => set('xp', Math.max(0, Number(e.target.value)))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Nível (auto)</label>
              <div style={{
                ...inputStyle,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'default',
                borderColor: 'rgba(139,92,246,0.2)',
                background: 'rgba(139,92,246,0.03)',
              }}>
                <span style={{ fontWeight: 700, color: '#a78bfa' }}>{computedLevel}</span>
                {computedLevel >= MAX_LEVEL && (
                  <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 700 }}>MAX</span>
                )}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Streak (dias)</label>
              <input
                className="edit-input"
                type="number"
                min={0}
                value={form.streak_days}
                onChange={e => set('streak_days', Math.max(0, Number(e.target.value)))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Status toggle */}
          <div>
            <label style={labelStyle}>Status</label>
            <button
              onClick={() => set('is_active', !form.is_active)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
                border: form.is_active
                  ? '1px solid rgba(74,222,128,0.35)'
                  : '1px solid rgba(239,68,68,0.3)',
                background: form.is_active
                  ? 'rgba(74,222,128,0.08)'
                  : 'rgba(239,68,68,0.08)',
                color: form.is_active ? '#4ade80' : '#f87171',
                fontSize: '0.85rem', fontWeight: 700,
                transition: 'all 0.15s ease', width: '100%',
              }}
            >
              {/* pill */}
              <span style={{
                width: 36, height: 20, borderRadius: 999, flexShrink: 0,
                background: form.is_active ? '#4ade80' : 'rgba(255,255,255,0.12)',
                position: 'relative', transition: 'background 0.2s',
              }}>
                <span style={{
                  position: 'absolute', top: 2,
                  left: form.is_active ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </span>
              {form.is_active ? 'Ativo' : 'Inativo'}
            </button>
          </div>

          {/* Feedback */}
          {success && (
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.3)',
              color: '#4ade80', fontSize: '0.82rem', fontWeight: 600,
            }}>
              ✓ Perfil atualizado com sucesso!
            </div>
          )}
          {err && (
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#f87171', fontSize: '0.82rem',
            }}>
              {err}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px 24px',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
          borderTop: '1px solid rgba(139,92,246,0.1)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 22px', borderRadius: 10,
              cursor: saving ? 'not-allowed' : 'pointer',
              border: '1px solid rgba(139,92,246,0.6)',
              background: saving
                ? 'rgba(139,92,246,0.2)'
                : 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(109,40,217,0.9))',
              color: '#fff', fontSize: '0.85rem', fontWeight: 700,
              boxShadow: saving ? 'none' : '0 0 20px rgba(139,92,246,0.4), 0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.15s ease',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function UsuariosPage() {
  const [users, setUsers]           = useState<AdminUser[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [search, setSearch]         = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage]             = useState(1)
  const [saving, setSaving]         = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)

  useEffect(() => {
    fetch('/admin/api/users')
      .then(r => r.json())
      .then(d => { setUsers(d.users ?? []); setLoading(false) })
      .catch(() => { setError('Erro ao carregar usuários'); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = !search ||
        (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (u.username  ?? '').toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      const matchPlan   = planFilter   === 'all' || u.plan === planFilter
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'active'   &&  u.is_active) ||
        (statusFilter === 'inactive' && !u.is_active)
      return matchSearch && matchPlan && matchStatus
    })
  }, [users, search, planFilter, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageUsers  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, planFilter, statusFilter])

  async function updateUser(id: string, patch: Partial<AdminUser>) {
    setSaving(id)
    try {
      await fetch(`/admin/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u))
    } finally {
      setSaving(null)
    }
  }

  const inputBase: React.CSSProperties = {
    padding: '9px 14px', borderRadius: 10,
    border: '1px solid rgba(232,92,13,0.25)',
    background: 'rgba(232,92,13,0.05)',
    color: '#fff', fontSize: '0.85rem', outline: 'none',
    transition: 'border-color 0.15s ease',
  }

  const filterBtn = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 999, cursor: 'pointer', fontSize: '0.78rem',
    fontWeight: active ? 700 : 500,
    border: active ? '1px solid rgba(232,92,13,0.5)' : '1px solid rgba(255,255,255,0.08)',
    background: active ? 'rgba(232,92,13,0.15)' : 'rgba(255,255,255,0.03)',
    color: active ? '#fb923c' : 'rgba(255,255,255,0.45)',
    boxShadow: active ? '0 0 10px rgba(232,92,13,0.2)' : 'none',
    transition: 'all 0.15s ease',
  })

  return (
    <div className="usr-page" style={{ minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.22); }
        input:focus { border-color: rgba(232,92,13,0.55) !important; box-shadow: 0 0 0 3px rgba(232,92,13,0.1); }
        select option { background: #1a0d0d; color: #fff; }
        .usr-page { padding: 20px 16px; }
        .usr-table-view { display: none; }
        .usr-cards-view { display: flex; flex-direction: column; gap: 10px; }
        .usr-filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-start; }
        .usr-filter-group { display: flex; gap: 6px; flex-wrap: wrap; }
        @media (min-width: 768px) {
          .usr-page { padding: 40px 36px; }
          .usr-table-view { display: block; }
          .usr-cards-view { display: none; }
          .usr-filter-group { flex-wrap: nowrap; }
        }
      `}</style>

      {/* Edit modal */}
      {editingUser && (
        <EditProfileModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={patch => {
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...patch } : u))
          }}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#fff', margin: 0, marginBottom: 4 }}>
          Usuários
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          {loading ? 'Carregando...' : `${filtered.length} usuário${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Filters */}
      <div className="usr-filters" style={{ marginBottom: 24 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email..."
          style={{ ...inputBase, flex: 1, minWidth: 200 }}
        />

        <div className="usr-filter-group">
          {['all', 'free', 'pro', 'elite'].map(p => (
            <button key={p} onClick={() => setPlanFilter(p)} style={filterBtn(planFilter === p)}>
              {p === 'all' ? 'Todos' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        <div className="usr-filter-group">
          {[
            { v: 'all',      l: 'Todos' },
            { v: 'active',   l: 'Ativos' },
            { v: 'inactive', l: 'Inativos' },
          ].map(({ v, l }) => (
            <button key={v} onClick={() => setStatusFilter(v)} style={filterBtn(statusFilter === v)}>
              {l}
            </button>
          ))}
        </div>
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
        <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#f87171' }}>
          {error}
        </div>
      ) : (
        <>
          {/* Table (desktop) */}
          <div className="usr-table-view" style={{ borderRadius: 18, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(232,92,13,0.12)', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Usuário', 'Email', 'Plano', 'XP / Nível', 'Status', 'Cadastro', 'Ações'].map(h => (
                      <th key={h} style={{
                        padding: '13px 16px', textAlign: 'left',
                        fontSize: '0.68rem', fontWeight: 700,
                        color: 'rgba(255,255,255,0.32)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : pageUsers.map((u, i) => {
                    const ps   = PLAN_STYLE[u.plan] ?? PLAN_STYLE.free
                    const name = u.full_name || u.username || '—'
                    const initials = name !== '—' ? name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?'
                    const isSaving = saving === u.id

                    return (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: i < pageUsers.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                          opacity: isSaving ? 0.6 : 1,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => { if (!isSaving) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(232,92,13,0.03)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                      >
                        {/* User */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                              background: 'linear-gradient(135deg, #e85c0d, #dc2626)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.72rem', fontWeight: 800, color: '#fff',
                            }}>{initials}</div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                                {name}
                              </p>
                              {u.username && u.full_name && (
                                <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>@{u.username}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.48)', maxWidth: 200 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                            {u.email || '—'}
                          </span>
                        </td>

                        {/* Plan */}
                        <td style={{ padding: '14px 16px' }}>
                          <select
                            value={u.plan}
                            disabled={isSaving}
                            onChange={e => updateUser(u.id, { plan: e.target.value })}
                            style={{
                              padding: '4px 8px', borderRadius: 8,
                              border: `1px solid ${ps.border}`,
                              background: ps.bg, color: ps.color,
                              fontSize: '0.75rem', fontWeight: 700,
                              cursor: 'pointer', outline: 'none',
                            }}
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="elite">Elite</option>
                          </select>
                        </td>

                        {/* XP / Level */}
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#a78bfa' }}>
                            {u.xp.toLocaleString('pt-BR')} XP
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
                            Nível {u.level}
                          </p>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                            disabled={isSaving}
                            style={{
                              padding: '4px 12px', borderRadius: 999,
                              border: u.is_active ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(239,68,68,0.35)',
                              background: u.is_active ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                              color: u.is_active ? '#4ade80' : '#f87171',
                              fontSize: '0.72rem', fontWeight: 700,
                              cursor: isSaving ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {u.is_active ? '✓ Ativo' : '✗ Inativo'}
                          </button>
                        </td>

                        {/* Created at */}
                        <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.32)', whiteSpace: 'nowrap' }}>
                          {new Date(u.auth_created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            onClick={() => setEditingUser(u)}
                            style={{
                              padding: '5px 12px', borderRadius: 8,
                              border: '1px solid rgba(139,92,246,0.4)',
                              background: 'rgba(139,92,246,0.1)',
                              color: '#a78bfa', fontSize: '0.75rem', fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => {
                              const b = e.currentTarget as HTMLButtonElement
                              b.style.background = 'rgba(139,92,246,0.2)'
                              b.style.boxShadow  = '0 0 12px rgba(139,92,246,0.25)'
                            }}
                            onMouseLeave={e => {
                              const b = e.currentTarget as HTMLButtonElement
                              b.style.background = 'rgba(139,92,246,0.1)'
                              b.style.boxShadow  = 'none'
                            }}
                          >
                            Ver perfil
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="usr-cards-view" style={{ marginBottom: 20 }}>
            {pageUsers.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                Nenhum usuário encontrado
              </div>
            ) : pageUsers.map(u => {
              const ps = PLAN_STYLE[u.plan] ?? PLAN_STYLE.free
              const name = u.full_name || u.username || '—'
              const initials = name !== '—' ? name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?'
              const isSaving = saving === u.id
              return (
                <div key={u.id} style={{
                  padding: '14px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(232,92,13,0.1)',
                  opacity: isSaving ? 0.6 : 1,
                  transition: 'opacity 0.15s ease',
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  {/* Row 1: avatar + name + plan */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #e85c0d, #dc2626)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 800, color: '#fff',
                    }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                    </div>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.05em', padding: '3px 9px', borderRadius: 999, flexShrink: 0,
                      background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`,
                    }}>{u.plan}</span>
                  </div>
                  {/* Row 2: XP + status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 700 }}>
                      {u.xp.toLocaleString('pt-BR')} XP · Nível {u.level}
                    </span>
                    <button
                      onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                      disabled={isSaving}
                      style={{
                        padding: '4px 12px', borderRadius: 999, cursor: isSaving ? 'not-allowed' : 'pointer',
                        border: u.is_active ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(239,68,68,0.35)',
                        background: u.is_active ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                        color: u.is_active ? '#4ade80' : '#f87171',
                        fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.15s ease',
                      }}
                    >
                      {u.is_active ? '✓ Ativo' : '✗ Inativo'}
                    </button>
                  </div>
                  {/* Row 3: plan select + edit button */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      value={u.plan}
                      disabled={isSaving}
                      onChange={e => updateUser(u.id, { plan: e.target.value })}
                      style={{
                        flex: 1, padding: '7px 10px', borderRadius: 8,
                        border: `1px solid ${ps.border}`,
                        background: ps.bg, color: ps.color,
                        fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', outline: 'none',
                      }}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="elite">Elite</option>
                    </select>
                    <button
                      onClick={() => setEditingUser(u)}
                      style={{
                        flex: 1, padding: '7px 12px', borderRadius: 8,
                        border: '1px solid rgba(139,92,246,0.4)',
                        background: 'rgba(139,92,246,0.1)',
                        color: '#a78bfa', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Ver perfil
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
                Página {page} de {totalPages} &middot; {filtered.length} usuários
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '7px 14px', borderRadius: 9, cursor: page === 1 ? 'not-allowed' : 'pointer',
                    border: '1px solid rgba(232,92,13,0.25)',
                    background: 'rgba(232,92,13,0.06)',
                    color: page === 1 ? 'rgba(255,255,255,0.2)' : '#fb923c',
                    fontSize: '0.8rem', fontWeight: 600,
                    opacity: page === 1 ? 0.5 : 1,
                  }}
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '7px 14px', borderRadius: 9, cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    border: '1px solid rgba(232,92,13,0.25)',
                    background: 'rgba(232,92,13,0.06)',
                    color: page === totalPages ? 'rgba(255,255,255,0.2)' : '#fb923c',
                    fontSize: '0.8rem', fontWeight: 600,
                    opacity: page === totalPages ? 0.5 : 1,
                  }}
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
