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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

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
        .admin-sidebar {
          position: fixed; left: 0; top: 0; z-index: 40;
          width: 240px; height: 100%;
          display: flex; flex-direction: column;
          background: rgba(8,6,16,0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid rgba(232,92,13,0.15);
          box-shadow: 4px 0 24px rgba(232,92,13,0.04);
          transition: transform 0.28s cubic-bezier(0.4,0,0.2,1);
        }
        .admin-main {
          margin-left: 240px;
          flex: 1;
          min-height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .admin-ham-bar { display: none; }
        .admin-sidebar-close { display: none !important; }
        @media (max-width: 767px) {
          .admin-sidebar { width: 80%; transform: translateX(-100%); }
          .admin-sidebar.open { transform: translateX(0); box-shadow: 8px 0 48px rgba(0,0,0,0.7); }
          .admin-main { margin-left: 0; }
          .admin-ham-bar { display: flex; }
          .admin-sidebar-close { display: flex !important; }
        }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 39,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* Logo + close button */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(232,92,13,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
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

          {/* ✕ close button — mobile only */}
          <button
            className="admin-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.65)',
              fontSize: '1rem', cursor: 'pointer',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
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
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(232,92,13,0.1)' }}>
          <Link
            href="/dashboard"
            onClick={() => setSidebarOpen(false)}
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

          <div style={{ padding: '6px 10px', marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </p>
          </div>

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
      <main className="admin-main">
        {/* Mobile hamburger bar */}
        <div
          className="admin-ham-bar"
          style={{
            alignItems: 'center', gap: 12,
            padding: '10px 16px',
            position: 'sticky', top: 0, zIndex: 20,
            background: 'rgba(8,6,16,0.95)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(232,92,13,0.15)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'rgba(232,92,13,0.1)',
              border: '1px solid rgba(232,92,13,0.3)',
              color: '#fb923c', fontSize: '1.15rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ☰
          </button>
          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fb923c' }}>GrindUP Admin</span>
        </div>

        {children}
      </main>
    </div>
  )
}
