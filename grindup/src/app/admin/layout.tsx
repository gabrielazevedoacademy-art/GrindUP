'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase'

const NAV = [
  {
    href: '/admin',
    label: 'Visão Geral',
    exact: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/admin/usuarios',
    label: 'Usuários',
    exact: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path strokeLinecap="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    href: '/admin/planos',
    label: 'Planos',
    exact: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const supabase = createClientSupabase()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email ?? '')
    })
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClientSupabase()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div
      style={{
        display: 'flex', minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0f, #0d0a0a, #0f0a0a, #0a0a0f)',
        backgroundSize: '400% 400%',
        animation: 'adminGrad 10s ease infinite',
      }}
    >
      <style>{`
        @keyframes adminGrad {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        .admin-nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 10px;
          font-size: 0.875rem; font-weight: 500;
          color: rgba(255,255,255,0.45);
          transition: color 0.2s, background 0.2s;
          text-decoration: none;
        }
        .admin-nav-link:hover { color: rgba(255,255,255,0.8); background: rgba(232,92,13,0.08); }
        .admin-nav-link.active { color: #fb923c; background: rgba(232,92,13,0.14); box-shadow: 0 0 12px rgba(232,92,13,0.15); }
      `}</style>

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed', left: 0, top: 0, zIndex: 40,
          width: 240, height: '100%',
          display: 'flex', flexDirection: 'column',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(232,92,13,0.15)',
          boxShadow: '4px 0 24px rgba(232,92,13,0.04)',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(232,92,13,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #dc2626, #e85c0d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 14px rgba(232,92,13,0.5)',
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth={1.5} fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>
                GrindUP
              </p>
              <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, color: '#fb923c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Admin
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link${active ? ' active' : ''}`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(232,92,13,0.1)' }}>
          {/* Back to app */}
          <Link
            href="/dashboard"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 8, marginBottom: 8,
              fontSize: '0.78rem', fontWeight: 500,
              color: 'rgba(255,255,255,0.4)',
              textDecoration: 'none',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.15s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" /><line x1="20" y1="12" x2="9" y2="12" />
            </svg>
            Voltar ao app
          </Link>

          {/* User info */}
          <div style={{ padding: '6px 10px', marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '8px 10px', borderRadius: 8,
              fontSize: '0.75rem', fontWeight: 500,
              color: 'rgba(255,255,255,0.35)',
              background: 'rgba(255,255,255,0.03)',
              border: 'none', cursor: loggingOut ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              opacity: loggingOut ? 0.5 : 1,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {loggingOut ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
