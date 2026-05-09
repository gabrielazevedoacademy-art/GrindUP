'use client'

import { useState, useEffect, useMemo } from 'react'

type AdminUser = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  email: string
  plan: string
  xp: number
  level: number
  is_active: boolean
  last_activity_date: string | null
  auth_created_at: string
}

const PLAN_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  free:  { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', border: 'rgba(107,114,128,0.3)' },
  pro:   { bg: 'rgba(124,58,237,0.15)',  color: '#a78bfa', border: 'rgba(124,58,237,0.35)' },
  elite: { bg: 'rgba(234,179,8,0.13)',   color: '#fbbf24', border: 'rgba(234,179,8,0.3)'  },
}

const PAGE_SIZE = 20

export default function UsuariosPage() {
  const [users, setUsers]           = useState<AdminUser[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [search, setSearch]         = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage]             = useState(1)
  const [saving, setSaving]         = useState<string | null>(null)

  useEffect(() => {
    fetch('/admin/api/users')
      .then(r => r.json())
      .then(d => { setUsers(d.users ?? []); setLoading(false) })
      .catch(() => { setError('Erro ao carregar usuários'); setLoading(false) })
  }, [])

  // ── Filtered + paginated ──────────────────────────────────
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

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1) }, [search, planFilter, statusFilter])

  // ── Mutations ─────────────────────────────────────────────
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
    <div style={{ padding: '40px 36px', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.22); }
        input:focus { border-color: rgba(232,92,13,0.55) !important; box-shadow: 0 0 0 3px rgba(232,92,13,0.1); }
        select option { background: #1a0d0d; color: #fff; }
      `}</style>

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
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email..."
          style={{ ...inputBase, minWidth: 260 }}
        />

        {/* Plan filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'free', 'pro', 'elite'].map(p => (
            <button key={p} onClick={() => setPlanFilter(p)} style={filterBtn(planFilter === p)}>
              {p === 'all' ? 'Todos os planos' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: 6 }}>
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
          {/* Table */}
          <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(232,92,13,0.12)', overflow: 'hidden', marginBottom: 20 }}>
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
                          <a
                            href={`/admin/usuarios/${u.id}`}
                            style={{
                              padding: '5px 12px', borderRadius: 8,
                              border: '1px solid rgba(232,92,13,0.3)',
                              background: 'rgba(232,92,13,0.08)',
                              color: '#fb923c', fontSize: '0.75rem', fontWeight: 600,
                              textDecoration: 'none', display: 'inline-block',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            Ver perfil
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
